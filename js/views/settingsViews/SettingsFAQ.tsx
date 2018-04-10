import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Platform,
  Linking,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {Actions} from "react-native-router-flux";
import {colors, screenWidth} from "../styles";
import {IconButton} from "../components/IconButton";

export class SettingsFAQ extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "FAQ",
    }
  };

  _getItems() {
    let items = [];

    let appStoreLabel = "App Store";
    if (Platform.OS === 'android') {
      appStoreLabel = "Play Store";
    }

    items.push({
      type:'largeExplanation',
      label:"Frequently Asked Questions\n\nHow do I ...",
    })

    items.push({
      type:'collapsable',
      label:"... add a Crownstone?",
      content:"You just have to hold it close if the Crownstone is in setup mode:\n\n" +
      "- Go to the Sphere Overview\n  (with the room bubbles)\n" +
      "- Hold the phone physically close to the Crownstone you want to add.\n" +
      "- Select the blue bubble.\n" +
      "- Tap the blue Crownstone icon to add it.",
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label:"... add someone to my Sphere?",
      content:"If you're an Admin or Member you can invite people.\n\n" +
      "- Go to the Settings -> Spheres\n" +
      "- Select the Sphere you want to add people to.\n" +
      "- Select 'Invite someone new'",
      contentHeight: 145
    });


    items.push({
      type:'collapsable',
      label:"... move a Crownstone to a room?",
      content:"Moving the Crownstone is done in the Crownstone overview:\n\n" +
      "- Go to the Sphere Overview\n  (with the room bubbles)\n" +
      "- Tap the bubble containing your Crownstone.\n" +
      "- Select the Crownstone you want to move.\n" +
      "- Tap 'Located in' in the top right corner.",
      contentHeight: 175
    });


    items.push({
      type:'collapsable',
      label:"... dim with my Crownstone?",
      content:"Make sure dimming is enabled on the Crownstone:\n\n" +
      "- Make sure you are an Admin.\n" +
      "- Go to the Sphere Overview\n    (with the room bubbles)\n" +
      "- Tap on a room.\n" +
      "- Select the Crownstone you want to dim.\n" +
      "- Tap 'Edit' in the top right corner.\n" +
      "- Enable the Allow Dimming switch.",
      contentHeight: 200
    });

    items.push({
      type:'collapsable',
      label:"... use indoor localization?",
      content:"Indoor localization on room level works when you have 4 or more Crownstones. If you have less than 4, you can use home enter/exit and near/far. You set these rules per Crownstone.\n\n" +
      "- Go to the Sphere Overview\n    (with the room bubbles)\n" +
      "- Tap on a room.\n" +
      "- Select a Crownstone.\n" +
      "- Swipe the Crownstone overview left to go to the Behaviours.\n",
      contentHeight: 235
    });

    items.push({
      type:'collapsable',
      label:"... use schedules?",
      content:"These can be found in the Crownstone overview.\n\n" +
      "- Go to the Sphere Overview\n    (with the room bubbles)\n" +
      "- Tap on a room.\n" +
      "- Select a Crownstone.\n" +
      "- Swipe the Crownstone overview left twice to go to the Schedules.\n",
      contentHeight: 175
    });


    items.push({
      type:'largeExplanation',
      label:"What to do if ...",
    });

    items.push({
      type:'collapsable',
      label:"... a new Crownstone won't show up.",
      content:"Make sure the Crownstone is powered and that you're close to it. " +
      "During setup mode the Crownstone is transmitting very quietly so other people can't claim your Crownstones!\n\n" +
      "If it still won't show up, you may want to try the recovery procedure (see 'what to do if I want to recover a Crownstone' below).",
      contentHeight: 175
    });

    items.push({
      type:'collapsable',
      label:"... a Crownstone is on 'Searching'.",
      content:"Ensure there is power on the Crownstone and that you can reach it.\n\n" +
      "If you're near (within a meter) and it is still on 'Searching' you may want to try the recovery procedure (see 'what to do if I want to recover a Crownstone' below).",
      contentHeight: 155
    });

    let label = "If that fails, quit the app (double tap home button and swipe it up to really close it).\n";
    if (Platform.OS === 'android') {
      label = "If that fails, quit the app (Go to the side menu and select force quit).\n";
    }
    items.push({
      type:'collapsable',
      label:"... the setup process fails.",
      content:"Retry a few times.\n\n" +
      "If that fails, turn your bluetooth off and on.\n\n" +
      label +
      "Check if there are updates available in the " + appStoreLabel + ".\n\n" +
      "Certain Android phones have issues with Bluetooth. If you have a different phone available, log in there with your account and use that phone to do the setup.",
      contentHeight: 245
    });

    items.push({
      type:'collapsable',
      label:"... a Crownstone toggles unexpectedly.",
      content:"This could happen due to Tap-to-Toggle. If this is the case, you can retrain or disable it.\n\n" +
      "Room enter and room exit behaviour is currently not accounting for multiple users. We are working hard on much smarter behaviour that will solve this issue.\n\n" +
      "Sphere enter and sphere exit require you to be in range of the Crownstones as well as the app running in the background.",
      contentHeight: 225
    });


    label = "- Go to the Settings\n- Tap on Recover a Crownstone";
    if (Platform.OS === 'android') {
      label = "- Tap on Recover a Crownstone in the side menu\n";
    }
    items.push({
      type:'collapsable',
      label:"... I want to recover a Crownstone.",
      content: label +
      "- Follow the instructions.\n" +
      "- If something goes wrong, read the error message. It explains what is going on.",
      contentHeight: 175
    });


    items.push({
      type:'largeExplanation',
      label:"More help is available on the website",
    })

    items.push({
      id:'Help',
      label:'Help',
      type:'navigation',
      icon: <IconButton name={'ios-cloudy'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.green.hex }}/>,
      callback: () => {
        Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {});
      }
    });

    items.push({
      type:'spacer',
    })

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <View style={{backgroundColor: colors.csOrange.hex, height: 1, width:screenWidth}} />
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </Background>
    );
  }
}
