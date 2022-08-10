import * as React from 'react';
import {Image, TextStyle, TouchableOpacity, View, Text, Alert} from "react-native";
import {colors, screenWidth, tabBarHeight} from "../styles";
import DeviceInfo from "react-native-device-info";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { SPHERE_ID_STORE } from "../main/SphereOverview";
import { core } from "../../Core";
import {HighlightableWhiteIcon} from "../components/animated/HighlightableIcon";
import {useDatabaseChange} from "../components/hooks/databaseHooks";
import {Get} from "../../util/GetUtil";
import {HighlightableLabel} from "../components/animated/HighlightableLabel";
import { MenuNotificationUtil } from "../../util/MenuNotificationUtil";
import { DataUtil, enoughCrownstonesForIndoorLocalization } from "../../util/DataUtil";
import { FingerprintUtil } from "../../util/FingerprintUtil";
import {MessageCenter} from "../../backgroundProcesses/MessageCenter";

export function SphereOverviewSideBar(props) {
  useDatabaseChange(['updateActiveSphere', 'changeSphereState', 'changeStones', "changeFingerprint", 'changeLocations', 'stoneLocationUpdated', 'changeMessage']);
  let factor = 0.25;

  const state = core.store.getState();
  let amountOfSpheres = Object.keys(state.spheres).length;

  let blinkLocalizationIcon = false;
  let activeSphere = Get.activeSphere();

  if (activeSphere) {
    blinkLocalizationIcon = MenuNotificationUtil.isThereALocalizationAlert(activeSphere.id);
  }

  let blinkBehaviour = false;
  let blinkAdding    = Object.keys(activeSphere.locations).length == 0 || Object.keys(activeSphere.stones).length == 0;
  let badgeLocalization = !blinkLocalizationIcon && MenuNotificationUtil.isThereALocalizationBadge(activeSphere.id);
  let badgeMessages = MessageCenter.getUnreadMessages(activeSphere.id);

  return (
    <View style={{flex:1, backgroundColor: colors.csBlue.hex, paddingLeft:25}}>
      <View style={{height:50}}/>
      <Image source={require('../../../assets/images/crownstoneLogo.png')} style={{width:factor * 300, height: factor*300, tintColor: colors.white.hex}}/>
      <View style={{height:50}}/>

      <SideMenuLink
        closeSideMenu={props.closeSideMenu}
        label={"Add items"}
        callback={() => { NavigationUtil.launchModal( "AddItemsToSphere",{sphereId: SPHERE_ID_STORE.activeSphereId}); }}
        size={23}
        icon={'md-add-circle'}
        highlight={blinkAdding}
      />
      <SideMenuLink
        closeSideMenu={props.closeSideMenu}
        label={"Localization"}
        callback={() => {
          if (
            DataUtil.inSphere(SPHERE_ID_STORE.activeSphereId) &&
            enoughCrownstonesForIndoorLocalization(SPHERE_ID_STORE.activeSphereId) &&
            FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(SPHERE_ID_STORE.activeSphereId)
          ) {
            NavigationUtil.launchModal( "SetupLocalization",{sphereId: SPHERE_ID_STORE.activeSphereId, isModal: true});
          }
          else {
            NavigationUtil.launchModal( "LocalizationMenu",{sphereId: SPHERE_ID_STORE.activeSphereId});
          }
        }}
        size={22}
        icon={'c1-locationPin1'}
        highlight={blinkLocalizationIcon}
        badge={badgeLocalization}
      />
      <SideMenuLink
        closeSideMenu={props.closeSideMenu}
        label={"Behaviour"}
        callback={() => { NavigationUtil.launchModal( "BehaviourMenu",{sphereId: SPHERE_ID_STORE.activeSphereId}); }}
        size={22}
        icon={'c1-brain'}
        highlight={blinkBehaviour}
      />
      <SideMenuLink
        closeSideMenu={props.closeSideMenu}
        label={"Messages"}
        callback={() => { NavigationUtil.launchModal( "MessageInbox",{sphereId: SPHERE_ID_STORE.activeSphereId}); }}
        size={21}
        icon={'zo-email'}
        badge={badgeMessages}
      />
      <View style={{height:50}}/>
      {
        amountOfSpheres > 1 &&
          <SideMenuLink closeSideMenu={props.closeSideMenu} label={"Change sphere"} callback={() => { core.eventBus.emit("VIEW_SPHERES"); }} size={22} icon={'c1-house'} />
      }
      {
        DataUtil.isDeveloper() &&
          <SideMenuLink closeSideMenu={props.closeSideMenu} label={"Developer"} callback={() => { Alert.alert("TODO", "implement") }} size={22} icon={'ios-bug'}/>
      }
      <View style={{flex:1}}/>
      <Text style={{color: colors.white.rgba(0.5)}}>{"App v"+DeviceInfo.getReadableVersion()}</Text>
      <View style={{height: tabBarHeight + 5}} />
    </View>
  );
}


function SideMenuLink(props: {closeSideMenu:() => void, label: string, callback: () => void, size: number, icon: string, highlight?: boolean, badge?: BadgeIndicator}) {
  let linkStyle : TextStyle = {
    color: colors.white.hex,
    fontSize: 20,
    fontWeight: '400',
    paddingLeft:15,
  }
  return (
    <TouchableOpacity style={{flexDirection:'row', height:50, alignItems:'center'}} onPress={() => {
      props.closeSideMenu();
      props.callback();
    }}>
      <View style={{width: 25, height:50, justifyContent:'center', alignItems:'center'}}>
        <HighlightableWhiteIcon name={props.icon} size={props.size} enabled={props.highlight} quick={true} badge={props.badge}/>
      </View>
      <HighlightableLabel width={0.75*screenWidth} height={50} style={linkStyle} label={props.label} enabled={props.highlight} quick={true}></HighlightableLabel>
    </TouchableOpacity>
  );
}
