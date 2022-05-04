
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  View
} from "react-native";
// import { SafeAreaView } from 'react-navigation';

import {
  styles,
  screenHeight,
  tabBarHeight,
  colors,
  screenWidth,
  updateScreenHeight, availableScreenHeight, availableModalHeight
} from "../styles";
import { BackgroundImage  } from "./BackgroundImage";
import { NotificationLine } from "./NotificationLine";
import { CustomKeyboardAvoidingView } from "./CustomKeyboardAvoidingView";
import {SafeAreaProvider} from "react-native-safe-area-context";


export class Background extends Component<{
  hideNotifications?:        boolean,
  hideOrangeLine?:           boolean,
  orangeLineAboveStatusBar?: boolean,
  style?:                    any,
  hasNavBar?:                boolean,
  paddStatusBar?:            boolean,
  darkStatusBar?:            boolean,
  testID?: string,

  dimStatusBar?:      boolean,
  fullScreen?:        boolean,
  hasTopBar?:         boolean,
  image?:             any,
  topImage?:          any,
  keyboardAvoid?:     boolean,
}, any> {


  getHeight() : [number, boolean, boolean] {
    let hasTopBar = false;
    let hasTabBar = false;
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) { hasTopBar = true; }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) { hasTabBar = true; }
    if (hasTabBar && hasTopBar)       { height = availableScreenHeight;      }
    else if (hasTabBar && !hasTopBar) { height = screenHeight - tabBarHeight }
    else if (hasTopBar)               { height = availableModalHeight;       }
    return [height, hasTopBar, hasTabBar];
  }

  render() {
    let [backgroundHeight, hasTopBar, hasTabBar] = this.getHeight();
    let overrideStyle = this.props.style || {};

    return (
      <SafeAreaProvider style={{flex:1, backgroundColor: colors.csBlueDarker.hex}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height, hasTopBar, hasTabBar);
      }} testID={this.props.testID}>
        <CustomKeyboardAvoidingView style={{...styles.fullscreen, height:backgroundHeight, overflow:"hidden", backgroundColor:"transparent", ...overrideStyle}} behavior={Platform.OS === 'ios' ? 'position' : undefined} enabled={this.props.keyboardAvoid || false}>
          <BackgroundImage height={backgroundHeight} image={this.props.image} />
          <View style={[styles.fullscreen, {height:backgroundHeight}]}>
            <View style={{flex:1, overflow:'hidden'}}>
              { this.props.children }
            </View>
            { hasTabBar ? <View style={{backgroundColor:colors.csBlueLightDesat.rgba(0.3), width:screenWidth, height:1}} /> : null}
          </View>
        </CustomKeyboardAvoidingView>
      </SafeAreaProvider>
    );
  }
}
