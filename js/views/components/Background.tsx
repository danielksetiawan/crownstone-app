
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';
import {
  KeyboardAvoidingView, Platform,
  View
} from "react-native";
// import { SafeAreaView } from 'react-navigation';

import {
  styles,
  screenHeight,
  topBarHeight,
  tabBarHeight,
  colors,
  screenWidth,
  updateScreenHeight
} from "../styles";
import { BackgroundImage  } from "./BackgroundImage";
import { NotificationLine } from "./NotificationLine";


export class Background extends Component<{
  hideNotifications?:        boolean,
  hideOrangeLine?:           boolean,
  orangeLineAboveStatusBar?: boolean,
  style?:                    any,
  hasNavBar?:                boolean,

  dimStatusBar?:      boolean,
  fullScreen?:        boolean,
  hasTopBar?:         boolean,
  image?:             any,
  topImage?:          any,
  keyboardAvoid?:     boolean,
}, any> {

  render() {
    let hasNavBar = false;
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      hasNavBar = true;
      height -= tabBarHeight;
    }

    let overrideStyle = this.props.style || {};
    return (
      <View style={{flex:1, backgroundColor: colors.csBlueDarker.hex}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height);
      }}>
        <KeyboardAvoidingView style={[styles.fullscreen, {height:height, overflow:"hidden", backgroundColor:"transparent"}, overrideStyle]} behavior={Platform.OS === 'ios' ? 'position' : undefined} enabled={this.props.keyboardAvoid || false}>
          { this.props.image    ? <BackgroundImage height={height} image={this.props.image} /> : undefined }
          { this.props.topImage ? <View style={[styles.fullscreen, {height:height, backgroundColor:"transparent"}]}>{this.props.topImage}</View> : undefined }
          <View style={[styles.fullscreen, {height:height}]}>
            { this.props.orangeLineAboveStatusBar && Platform.OS !== 'android' ? <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} /> : undefined }
            { this.props.dimStatusBar && Platform.OS !== 'android' ? <View style={styles.shadedStatusBar} /> : undefined }
            <NotificationLine notificationsVisible={!this.props.hideNotifications} hideOrangeLine={this.props.hideOrangeLine} />
            <View style={{flex:1, overflow:'hidden'}}>
              { this.props.children }
            </View>
            { hasNavBar ? <View style={{backgroundColor:colors.csBlueLightDesat.rgba(0.3), width:screenWidth, height:1}} /> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}