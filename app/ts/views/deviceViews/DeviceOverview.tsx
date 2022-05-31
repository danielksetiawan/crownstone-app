import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceOverview", key)(a,b,c,d,e);
}
import * as React from 'react';

import { SphereDeleted }        from "../static/SphereDeleted";
import { StoneDeleted }         from "../static/StoneDeleted";
import { core } from "../../Core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { colors } from "../styles";
import {
  Alert, ScrollView,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { Icon } from "../components/Icon";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Navigation } from "react-native-navigation";
import {SettingsBackground} from "../components/SettingsBackground";
import {CLOUD} from "../../cloud/cloudAPI";
import {LOG, LOGe} from "../../logging/Log";
import {tell} from "../../logic/constellation/Tellers";
import {SortingManager} from "../../logic/SortingManager";
import {StoneUtil} from "../../util/StoneUtil";
import {ListEditableItems} from "../components/ListEditableItems";
import { IconButton } from "../components/IconButton";
import { OverlayUtil } from "../overlays/OverlayUtil";
import { Get } from "../../util/GetUtil";
import {STONE_TYPES} from "../../Enums";
import {xUtil} from "../../util/StandAloneUtil";
import {MINIMUM_REQUIRED_FIRMWARE_VERSION} from "../../ExternalConfig";


export class  DeviceOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;

  constructor(props) {
    super(props);

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return;
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return;
    }
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'deviceEdit')    {
      NavigationUtil.launchModal( "DeviceEdit",{sphereId: this.props.sphereId, stoneId: this.props.stoneId});
    }
  }

  componentDidMount() {
    let state = core.store.getState();

    if (state.app.hasSeenDeviceSettings === false) {
      core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenDeviceSettings: true } })
    }

    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();
      if (
        (state.spheres[this.props.sphereId] === undefined) ||
        (change.removeSphere         && change.removeSphere.sphereIds[this.props.sphereId]) ||
        (change.removeStone          && change.removeStone.stoneIds[this.props.stoneId])    ||
        (change.stoneChangeAbilities && change.stoneChangeAbilities.stoneIds[this.props.stoneId])
      ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        !change.removeStone &&
        (
          change.changeAppSettings ||
          change.stoneLocationUpdated && change.stoneLocationUpdated.stoneIds[this.props.stoneId] ||
          change.updateStoneConfig    && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        if (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId]) {
          this._updateNavBar();
        }
        this.forceUpdate();
        return
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }



  _updateNavBar() {
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }

  _getLockIcon(stone) {
    let wrapperStyle : ViewStyle = {
      width: 35,
      height: 35,
      position: 'absolute',
      bottom: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: "center"
    };
    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false && stone.config.locked === false) {
      return (
        <TouchableOpacity
          onPress={() => { core.eventBus.emit('showLockOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId })} }
          style={wrapperStyle}>
          <Icon name={"md-unlock"} color={colors.csBlueDarker.rgba(0.5)} size={30} />
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
    }
  }



  _getItems(stone: StoneData) {
    let items = [];

    let canSwitch = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    canSwitch = canSwitch && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION);

    items.push({type: 'explanation', label: "CROWNSTONE SETTINGS"});
    items.push({
      id: 'My Account',
      label: "Appearence",
      testID: 'Appearence',
      icon: <Icon name={'ion5-information-circle'} size={30} color={colors.purple.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate( "DeviceEditAppearence", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: "Change name, icon, etc.", below: true});
    items.push({
      id: 'abilities',
      label: lang("Abilities"),
      testID: 'Appearence',
      icon: <Icon name={'ios-school'} size={30} color={colors.csBlueLight.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("DeviceAbilities", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: "Enable dimming, switchcraft, etc.", below: true});
    items.push({
      id: 'behaviour',
      label: lang("Behaviour"),
      testID: 'Appearence',
      icon: <Icon name={'c1-brain'} size={30} color={colors.csBlue.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("DeviceSmartBehaviour", {sphereId: this.props.sphereId, stoneId: this.props.stoneId});
      }
    });
    items.push({type: 'explanation', label: "Turn on if/when ...", below: true});


    let location = Get.location(this.props.sphereId, stone.config.locationId);
    let locationLabel = lang("Not_in_a_room");
    if (location !== undefined) {
      locationLabel = location.config.name;
    }

    items.push({
      label: locationLabel,
      icon:  <Icon name="md-cube" size={25} color={colors.green.hex} />,
      type:  'navigation',
      style: {color: colors.blue.hex},
      callback: () => {
        OverlayUtil.callRoomSelectionOverlayForStonePlacement(this.props.sphereId, this.props.stoneId);
      }
    });
    items.push({type: 'explanation', label: "Move the Crownstone to another room", below: true});

    if (canSwitch) {
      items.push({
        id: 'lock',
        label: stone.config.locked ? "Unlock Crownstone switch" : "Lock Crownstone switch",
        testID: 'Appearence',
        icon: <Icon name={'md-lock'} size={30} color={colors.blue.hex}/>,
        type: 'navigation',
        callback: () => {
          if (stone.abilities.dimming.enabledTarget) {
            Alert.alert("Can't lock...", lang("You_can_only_lock_Crownst"), [{text:lang("OK")}])
            return;
          }
          if (stone.config.locked) {
            StoneUtil.lockCrownstone(this.props.sphereId, this.props.stoneId);
          } else {
            StoneUtil.unlockCrownstone(this.props.sphereId, this.props.stoneId);
          }
        }
      });
    }

    items.push({label: lang("DANGER"), type: 'explanation', below: false});
    items.push({
      label: "Remove Crownstone",
      mediumIcon: <Icon name="ios-trash" size={26} color={colors.red.hex} />,
      type: 'button',
      callback: () => {
        Alert.alert(
          lang("_Are_you_sure___Removing__header"),
          lang("_Are_you_sure___Removing__body"),
          [{text: lang("_Are_you_sure___Removing__left"), style: 'cancel'}, {
            text: lang("_Are_you_sure___Removing__right"), style:'destructive', onPress: () => {
              StoneUtil.remove.crownstone.now(this.props.sphereId, this.props.stoneId).catch((err) => {});
            }}]
        )
      }
    });
    items.push({label: lang("Removing_this_Crownstone_"),  type:'explanation', below:true});

    return items;
  }


  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return <StoneDeleted/>
    }

    return (
      <SettingsBackground>
        <ScrollView testID={'DeviceOverview_scrollview'}>
          <ListEditableItems items={this._getItems(stone)} />
        </ScrollView>
      </SettingsBackground>
    )
  }


}

function getTopBarProps(props) {
  const state = core.store.getState();
  const stone = state.spheres[props.sphereId].stones[props.stoneId];

  NAVBAR_PARAMS_CACHE = {
    title: stone.config.name,
    closeModal: true,
  }

  return NAVBAR_PARAMS_CACHE;
}



let NAVBAR_PARAMS_CACHE : topbarOptions = null;

