
import { Alert, AppState }       from 'react-native';

import { eventBus }              from "../util/EventBus";
import { LOG, LogProcessor }     from "../logging/Log";
import { Bluenet }               from "../native/libInterface/Bluenet";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { LocationHandler }       from "../native/localization/LocationHandler";
import { NativeBus }             from "../native/libInterface/NativeBus";
import { CLOUD }                 from "../cloud/cloudAPI";
import { AppUtil }               from "../util/AppUtil";
import { Util }                  from "../util/Util";

import { prepareStoreForUser }   from "../util/DataUtil";

import { StoreManager }          from "../router/store/storeManager";
import { KeepAliveHandler }      from "./KeepAliveHandler";
import { FirmwareWatcher }       from "./FirmwareWatcher";
import { AdvertisementHandler }  from "../native/advertisements/AdvertisementHandler";
import { Scheduler }             from "../logic/Scheduler";
import { StoneStateHandler }     from "../native/advertisements/StoneStateHandler";
import { SetupStateHandler }     from "../native/setup/SetupStateHandler";
import { SPHERE_USER_SYNC_INTERVAL, SYNC_INTERVAL } from "../ExternalConfig";
import { BatterySavingUtil }     from "../util/BatterySavingUtil";
import { MapProvider }           from "./MapProvider";
import { DfuStateHandler }       from "../native/firmware/DfuStateHandler";
import {ErrorWatcher} from "./ErrorWatcher";


const BACKGROUND_SYNC_TRIGGER = 'backgroundSync';
const BACKGROUND_USER_SYNC_TRIGGER = 'activeSphereUserSync';

class BackgroundProcessHandlerClass {
  started : boolean = false;
  userLoggedIn : boolean = false;
  storeInitialized : boolean = false;
  store : any;

  constructor() { }

  start() {
    if (!this.started) {
      LOG.info("BackgroundProcessHandler: Starting the background processes.");
      // start the BLE things.
      // route the events to React Native
      Bluenet.rerouteEvents();

      // we first setup the event listeners since these events can be fired by the this.startStore().

      // when the user is logged in we track spheres and scan for Crownstones
      // This event is triggered on boot by the start store or by the login process.
      eventBus.on('userLoggedIn', () => {
        // clear the temporary data like state and disability of stones so no old data will be shown
        prepareStoreForUser(this.store);

        LOG.info("BackgroundProcessHandler: received userLoggedIn event.");
        BluenetPromiseWrapper.isReady()
          .then(() => {
            Bluenet.startScanningForCrownstonesUniqueOnly()
          });

        LocationHandler.trackSpheres();

        this.userLoggedIn = true;
      });

      // wait for store to be prepared in order to continue.
      eventBus.on("storePrepared", () => {
        LOG.info("BackgroundProcessHandler: Store is prepared.");
        this.storeInitialized = true;

        // pass the store to the singletons
        LOG.info("BackgroundProcessHandler: Starting singletons.");
        this.startSingletons();

        this.startCloudService();

        this.startEventTriggers();

        this.startBluetoothListener();

        this.updateDeviceName();

        LocationHandler.applySphereStateFromStore();

        this.checkErrors(null);

        let state = this.store.getState();
        Bluenet.enableLoggingToFile((state.user.logging === true && state.user.developer === true));
      });

      // Create the store from local storage. If there is no local store yet (first open), this is synchronous
      this.startStore();
    }
    this.started = true;
  }


  checkErrors(sphereId = null) {
    let state = this.store.getState();
    let presentSphere = sphereId || Util.data.getPresentSphere(state);
    if (presentSphere && state.spheres[presentSphere]) {
      let errorsFound = false;
      let stonesContainingError = [];

      Util.data.callOnStonesInSphere(state, presentSphere, (stoneId, stone) => {
        if (stone.errors.hasError === true) {
          errorsFound = true;
          stonesContainingError.push({sphereId: presentSphere, stoneId: stoneId, stone:stone});
        }
      });

      if (errorsFound) {
        eventBus.emit("showErrorOverlay", stonesContainingError)
      }
    }
  }


  /**
   * Triggers background sync, sets the networkError handler which is used when there is no internet connection
   */
  startCloudService() {
    // sync every 10 minutes
    Scheduler.setRepeatingTrigger(BACKGROUND_SYNC_TRIGGER, {repeatEveryNSeconds:SYNC_INTERVAL});
    Scheduler.setRepeatingTrigger(BACKGROUND_USER_SYNC_TRIGGER, {repeatEveryNSeconds: SPHERE_USER_SYNC_INTERVAL});

    // if the app is open, update the user locations every 10 seconds
    Scheduler.loadCallback(BACKGROUND_USER_SYNC_TRIGGER, () => {
      if (SetupStateHandler.isSetupInProgress() === false) {
        CLOUD.syncUsers(this.store);
      }
    });

    // sync the full db with the cloud every 10 minutes
    Scheduler.loadCallback(BACKGROUND_SYNC_TRIGGER, () => {
      let state = this.store.getState();
      // if a crownstone is in setup mode, we do not sync at that time
      if (SetupStateHandler.isSetupInProgress() === false) {
        if (state.user.userId) {
          LOG.info("BackgroundProcessHandler: STARTING ROUTINE SYNCING IN BACKGROUND");
          CLOUD.sync(this.store, true).catch((err) => { LOG.error("Error during background sync: ", err)});
        }
      }
      else {
        LOG.info("BackgroundProcessHandler: Skipping routine sync due to active setup phase.");
      }
    });

    // set the global network error handler.
    CLOUD.setNetworkErrorHandler((error) => {
      let defaultAction = () => { eventBus.emit('hideLoading');};
      Alert.alert(
        "Connection Problem",
        "Could not connect to the Cloud. Please check your internet connection.",
        [{text: 'OK', onPress: defaultAction }],
        { onDismiss: defaultAction }
      );
    });
  }


  /**
   * Update device specs: Since name is user editable, it can change over time. We use this to update the model.
   */
  updateDeviceName() {
    let state = this.store.getState();
    let currentDeviceSpecs = Util.data.getDeviceSpecs(state);
    let deviceInDatabaseId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);
    if (currentDeviceSpecs.address && deviceInDatabaseId) {
      let deviceInDatabase = state.devices[deviceInDatabaseId];
      // if the address matches but the name does not, update the device name in the cloud.
      if (deviceInDatabase.address === currentDeviceSpecs.address && currentDeviceSpecs.name != deviceInDatabase.name) {
        this.store.dispatch({type: 'UPDATE_DEVICE_CONFIG', deviceId: deviceInDatabaseId, data: {name: currentDeviceSpecs.name}})
      }
    }
  }

  /**
   * - When the user is logged in, we start listening for BLE and tracking spheres.
   *
   */
  startEventTriggers() {
    // trigger the CalibrateTapToToggle tutorial for existing users when they open the app
    let state = this.store.getState();
    let deviceInDatabaseId = Util.data.getCurrentDeviceId(state);
    NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => {
      // check the state of the crownstone errors and show overlay if needed.
      this.checkErrors(sphereId);

      // do not show popup during setup.
      if (SetupStateHandler.isSetupInProgress() === true) {
        return;
      }

      let state = this.store.getState();
      if (state && state.devices && deviceInDatabaseId && state.devices[deviceInDatabaseId] &&
        (state.devices[deviceInDatabaseId].tapToToggleCalibration === null || state.devices[deviceInDatabaseId].tapToToggleCalibration === undefined)) {
        if (Util.data.userHasPlugsInSphere(state,sphereId))
          eventBus.emit("CalibrateTapToToggle");
      }
    });

    // check errors if we obtained something from the advertisements.
    eventBus.on("checkErrors", () => {
      this.checkErrors();
    });

    // listen to the state of the app: if it is in the foreground or background
    AppState.addEventListener('change', (appState) => {
      LOG.info("App State Change", appState);
      // in the foreground: start scanning!
      if (appState === "active" && this.userLoggedIn) {
        BatterySavingUtil.scanOnlyIfNeeded();

        // if the app is open, update the user locations every 10 seconds
        Scheduler.resumeTrigger(BACKGROUND_USER_SYNC_TRIGGER);
      }
      else {
        // in the background: stop scanning to save battery!
        BatterySavingUtil.stopScanningIfPossible();

        // remove the user sync so it won't use battery in the background
        Scheduler.pauseTrigger(BACKGROUND_USER_SYNC_TRIGGER);
      }
    });
  }

  startBluetoothListener() {
    // Ensure we start scanning when the bluetooth module is powered on.
    NativeBus.on(NativeBus.topics.bleStatus, (status) => {
      if (this.userLoggedIn && status === 'poweredOn') {
        BatterySavingUtil.scanOnlyIfNeeded();
      }
    });
  }

  startStore() {
    // there can be a race condition where the event has already been fired before this module has initialized
    // This check is to ensure that it doesn't matter what comes first.
    if (StoreManager.isInitialized() === true) {
      this._verifyStore();
    }
    else {
      eventBus.on('storeInitialized', () => { this._verifyStore(); });
    }
  }

  _verifyStore() {
    this.store = StoreManager.getStore();

    // update the store based on new fields in the database (changes to the reducers: new fields in the default values)
    // also add the app identifier if we don't already have one.
    refreshDatabase(this.store);

    // if we have an accessToken, we proceed with logging in automatically
    let state = this.store.getState();
    if (state.user.accessToken !== null) {
      // in the background we check if we're authenticated, if not we log out.
      CLOUD.setAccess(state.user.accessToken);
      CLOUD.forUser(state.user.userId).getUserData({background:true})
        .catch((err) => {
          if (err.status === 401) {
            LOG.warn("BackgroundProcessHandler: Could not verify user, attempting to login again.");
            return CLOUD.login({
              email: state.user.email,
              password: state.user.password,
              background: true,
              onUnverified: () => {},
              onInvalidCredentials: () => {}
            })
              .then((response) => {
                CLOUD.setAccess(response.id);
                CLOUD.setUserId(response.userId);
              })
          }
          else {
            throw err;
          }
        })
        .then((reply) => {
          LOG.info("BackgroundProcessHandler: Verified User.", reply);
          CLOUD.sync(this.store, true).catch(() => {})
        })
        .catch((err) => {
          LOG.info("BackgroundProcessHandler: COULD NOT VERIFY USER -- ERROR", err);
          if (err.status === 401) {
            AppUtil.logOut(this.store);
            Alert.alert("Please log in again.", undefined, [{text:'OK'}]);
          }
        });
      eventBus.emit("userLoggedIn");
      eventBus.emit("storePrepared", {userLoggedIn: true});
    }
    else {
      eventBus.emit("storePrepared", {userLoggedIn: false});
    }
  }


  startSingletons() {
    MapProvider.loadStore(this.store);
    LogProcessor.loadStore(this.store);
    LocationHandler.loadStore(this.store);
    AdvertisementHandler.loadStore(this.store);
    Scheduler.loadStore(this.store);
    StoneStateHandler.loadStore(this.store);
    DfuStateHandler.loadStore(this.store);
    SetupStateHandler.loadStore(this.store);
    KeepAliveHandler.loadStore(this.store);
    FirmwareWatcher.loadStore(this.store);
    BatterySavingUtil.loadStore(this.store);
    ErrorWatcher.loadStore(this.store);
    // NotificationHandler.loadStore(store);
  }
}


/**
 * If we change the reducer default values, this adds any new fields to the redux database
 * so we don't have to error catch everywhere.
 *
 * Finally we create the app identifier
 * @param store
 */
function refreshDatabase(store) {
  let state = store.getState();
  let refreshActions = [];
  let sphereIds = Object.keys(state.spheres);

  // refresh all fields that do not have an ID requirement
  refreshActions.push({type:'REFRESH_DEFAULTS'});
  for (let i = 0; i < sphereIds.length; i++) {
    let sphereId = sphereIds[i];
    if (Array.isArray(state.spheres[sphereId].presets)) {
      LOG.info("Initialize: transforming Preset dataType");
      store.dispatch({type:'REFRESH_DEFAULTS', sphereId: sphereId});
      refreshDatabase(store);
      return;
    }

    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locationIds = Object.keys(state.spheres[sphereId].locations);
    let applianceIds = Object.keys(state.spheres[sphereId].appliances);
    let userIds = Object.keys(state.spheres[sphereId].users);
    let presetIds = Object.keys(state.spheres[sphereId].presets);

    refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, sphereOnly: true});
    stoneIds.forEach(    (stoneId)     => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, stoneId:     stoneId});});
    locationIds.forEach( (locationId)  => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, locationId:  locationId});});
    applianceIds.forEach((applianceId) => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, applianceId: applianceId});});
    userIds.forEach(     (userId)      => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, userId:      userId});});
    presetIds.forEach(   (presetId)    => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, presetId:    presetId});});
  }

  // create an app identifier if we do not already have one.
  refreshActions.push({type:'CREATE_APP_IDENTIFIER'});

  store.batchDispatch(refreshActions);
}



export const BackgroundProcessHandler = new BackgroundProcessHandlerClass();
