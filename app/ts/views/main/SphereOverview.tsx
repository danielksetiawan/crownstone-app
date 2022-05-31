import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text, View, StatusBar,
} from "react-native";
import { AnimatedBackground }       from '../components/animated/AnimatedBackground'
import { Icon }                     from '../components/Icon'
import { Sphere }                   from './Sphere'
import {
  availableScreenHeight, background,
  colors,
  overviewStyles, screenWidth, styles
} from "../styles";
import { Permissions}               from "../../backgroundProcesses/PermissionManager";
import {SphereLevel}                from "./SphereLevel";
import { core }                     from "../../Core";
import { NavigationUtil }           from "../../util/navigation/NavigationUtil";
import { PlaceFloatingCrownstonesInRoom } from "../roomViews/PlaceFloatingCrownstonesInRoom";
import { xUtil }                    from "../../util/StandAloneUtil";
import { AutoArrangeButton }        from "./buttons/AutoArrangeButton";
import { CLOUD }                    from "../../cloud/cloudAPI";
import { DataUtil }                 from "../../util/DataUtil";
import { RoomAddCore }              from "../roomViews/RoomAddCore";
import { Background }               from "../components/Background";
import { ActiveSphereManager }      from "../../backgroundProcesses/ActiveSphereManager";
import { BackButtonHandler }        from "../../backgroundProcesses/BackButtonHandler";
import { SideBarView } from "../components/animated/SideBarView";
import { SphereOverviewSideBar } from "../sidebars/SphereOverviewSideBar";
import {useRef} from "react";
import {NavBarBlur} from "../components/NavBarBlur";
import {Debug, DebugNotifications} from "../../DebugCalls";


const ZOOM_LEVELS = {
  sphere: 'sphere',
  room: 'room'
};

export const SPHERE_ID_STORE = {
  activeSphereId: null
}


export class SphereOverviewContent extends LiveComponent<any, any> {
  static options(props) {
    return {topBar:{visible:false}}
    // getTopBarProps(core.store.getState(), props, {});
    // return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeEvents : any;
  unsubscribeSetupEvents : any;
  unsubscribeStoreEvents : any;
  viewId;

  constructor(props) {
    super(props);

    this.state = { zoomLevel: ZOOM_LEVELS.room, zoomInstructionsVisible: false, arrangingRooms: false };
    this.viewId = xUtil.getUUID();
    ActiveSphereManager.updateActiveSphere();
  }


  componentDidMount() {
    Debug();

    // watch for setup stones
    this.unsubscribeSetupEvents = [];
    this.unsubscribeEvents = [];
    this.unsubscribeSetupEvents.push(core.eventBus.on("noSetupStonesVisible", () => { this.forceUpdate(); }));

    this.unsubscribeEvents.push(core.eventBus.on("SET_ARRANGING_ROOMS", () => { this.setRearrangeRooms(true) }));

    this.unsubscribeEvents.push(core.eventBus.on("onScreenNotificationsUpdated", () => { this.forceUpdate(); }));
    this.unsubscribeEvents.push(core.eventBus.on("VIEW_SPHERES", this._zoomOut));

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeSphere) {
        ActiveSphereManager.clearActiveSphere();
        this.setState({zoomLevel: ZOOM_LEVELS.sphere});
        return;
      }


      if (
        change.changeUserDeveloperStatus     ||
        change.changeAppSettings             ||
        change.changeSphereState             ||
        change.changeSphereConfig            ||
        change.hubLocationUpdated            ||
        change.stoneLocationUpdated          ||
        change.updateStoneCoreConfig         ||
        change.changeSphereSmartHomeState    ||
        change.updateSphereUser              ||
        change.changeStones                  ||
        change.changeHubs                    ||
        change.updateActiveSphere            ||
        change.updateLocationConfig          ||
        change.changeFingerprint             ||
        change.changeSpheres                 ||
        change.changeLocations
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
    NAVBAR_PARAMS_CACHE = null;
  }


  _zoomIn = () => {
    const state = core.store.getState();
    let activeSphereId = state.app.activeSphere;

    if (!activeSphereId) { return; }

    NavigationUtil.setTabBarOptions(colors.blue.hex, colors.csBlue.hex);
    if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
      this.setState({zoomLevel: ZOOM_LEVELS.room});
    }
  }

  _zoomOut = () => {
    const state = core.store.getState();
    let activeSphereId = state.app.activeSphere;
    let amountOfSpheres = Object.keys(state.spheres).length;

    if (!activeSphereId) { return; }
    if (this.state.arrangingRooms === true) { return; }

    if (amountOfSpheres > 1) {
      if (this.state.zoomLevel === ZOOM_LEVELS.room) {
        // tell the app the user has done this and we don't need to tell him any more.
        if (state.app.hasZoomedOutForSphereOverview === false) {
          core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: { hasZoomedOutForSphereOverview: true }});
        }
        NavigationUtil.setTabBarOptions(colors.csOrange.hex, colors.white.hex);
        this.setState({zoomLevel: ZOOM_LEVELS.sphere});
      }
      else { // this is for convenience, it's not accurate but it'll do
        this._zoomIn()
      }
    }
  }


  setRearrangeRooms(value) {
    if (value === true) {
      BackButtonHandler.override(this.props.componentId, () => {
        core.eventBus.emit("reset_positions" + this.viewId);
      });
      NavigationUtil.setTabBarOptions(colors.csOrange.hex, colors.white.hex);

    }
    else {
      BackButtonHandler.clearOverride(this.props.componentId);
      NavigationUtil.setTabBarOptions(colors.blue.hex, colors.black.hex);
    }
    this.setState({arrangingRooms: value});
  }

  _getContent(activeSphereId) {
    if (this.state.zoomLevel !== ZOOM_LEVELS.sphere && activeSphereId) {
      return (
        <Sphere
          viewId={this.viewId}
          sphereId={activeSphereId}
          zoomOutCallback={this._zoomOut}
          setRearrangeRooms={(value) => { this.setRearrangeRooms(value); }}
          arrangingRooms={this.state.arrangingRooms}
          openSideMenu={this.props.openSideMenu}
        />
      )
    }
    else {
      return (
        <SphereLevel
          selectSphere={(sphereId) => {
            ActiveSphereManager.setActiveSphere(sphereId);

            // request latest location data.
            CLOUD.syncUsers();
            this._zoomIn();
          }}
        />
      );
    }
  }

  render() {
    const state = core.store.getState();
    let amountOfSpheres = Object.keys(state.spheres).length;
    let activeSphereId = state.app.activeSphere;
    let backgroundOverride = background.main;

    if (amountOfSpheres > 0) {
      if (!activeSphereId) {
        return (
          <AnimatedBackground image={require("../../../assets/images/backgrounds/sphereBackground.jpg")}>
            { this._getContent(activeSphereId) }
          </AnimatedBackground>
        );
      }

      let activeSphere = state.spheres[activeSphereId];
      SPHERE_ID_STORE.activeSphereId = activeSphereId;
      let noStones = (activeSphereId ? Object.keys(activeSphere.stones).length    : 0) == 0;
      let noRooms  = (activeSphereId ? Object.keys(activeSphere.locations).length : 0) == 0;

      backgroundOverride = background.main;

      if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
        SPHERE_ID_STORE.activeSphereId = null;
        backgroundOverride = require("../../../assets/images/backgrounds/darkBackground3.jpg");
      }
      else {
        // handle the case where there are no rooms added:
        if (noRooms && Permissions.inSphere(activeSphereId).addRoom) {
          return (
            <Background image={background.main} testID={"SphereOverview_addRoom"}>
              <RoomAddCore sphereId={activeSphereId} returnToRoute={ lang("Main") } height={availableScreenHeight} />
            </Background>
          )
        }

        // retrofit: place all stones in a room.
        let floatingStones = DataUtil.getStonesInLocation(activeSphereId, null);
        let floatingHubs   = DataUtil.getHubsInLocation(activeSphereId, null);
        if (
          (Object.keys(floatingHubs).length > 0 || Object.keys(floatingStones).length > 0) &&
          Permissions.inSphere(activeSphereId).moveCrownstone
        ) {
          return <PlaceFloatingCrownstonesInRoom sphereId={activeSphereId} />;
        }

        if (this.state.arrangingRooms) {
          backgroundOverride = require('../../../assets/images/backgrounds/arranging.jpg')
        }
      }

      SPHERE_ID_STORE.activeSphereId = activeSphereId;

      return (
        <AnimatedBackground
          viewWrapper
          image={backgroundOverride}
          lightStatusbar={this.state.zoomLevel === ZOOM_LEVELS.sphere || this.state.arrangingRooms}
          hasTopBar={false}
          testID={"SphereOverview"}
        >
          { this._getContent(activeSphereId) }
          <AutoArrangeButton arrangingRooms={this.state.arrangingRooms} viewId={this.viewId} />
          { this.state.zoomLevel === ZOOM_LEVELS.room && !this.state.arrangingRooms && <NavBarBlur /> }
        </AnimatedBackground>
      );
    }
    else {
      return (
        <AnimatedBackground image={backgroundOverride} testID={"SphereOverview_noSphere"}>
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="c1-sphere" size={150} color={colors.csBlue.hex}/>
            <Text style={overviewStyles.mainText}>{ lang("No_Spheres_available_") }</Text>
            <Text style={overviewStyles.subText}>{ lang("Press_Edit_in_the_upper_r") }</Text>
          </View>
        </AnimatedBackground>
      );
    }
  }
}

export function SphereOverview(props) {
  let sideBarRef = useRef(null);

  return (
    <SideBarView
      ref={sideBarRef}
      content={ <SphereOverviewContent {...props} openSideMenu={() => { sideBarRef.current.open()}} closeSideMenu={() => { sideBarRef.current.close()}}/>}
      sideMenu={<SphereOverviewSideBar            openSideMenu={() => { sideBarRef.current.open()}} closeSideMenu={() => { sideBarRef.current.close()}}/>}
    />
  )
}

SphereOverview.options = (props) => { return {statusBar:{style:'dark'}} }


let NAVBAR_PARAMS_CACHE : topbarOptions = null;

