import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("MessageInbox", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View, TextStyle
} from "react-native";


import {
  availableModalHeight,
  background,
  colors,
  screenHeight,
  screenWidth, statusBarHeight,
  styles, topBarHeight
} from "../styles";
import {IconButton} from "../components/IconButton";
import {ListEditableItems} from "../components/ListEditableItems";
import {MessageEntry} from "./MessageEntry";
import {MessageCenter} from "../../backgroundProcesses/MessageCenter";
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { ViewStateWatcher } from "../components/ViewStateWatcher";
import { Navigation } from "react-native-navigation";
import { Background } from "../components/Background";
import {Component} from "react";
import {Get} from "../../util/GetUtil";


export class MessageInbox extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let title =  lang("Messages");
    if (activeSphere && state.spheres[activeSphere]) {
      let sphere = state.spheres[activeSphere];
      title +=  lang("_in_",sphere.config.name);
    }

    return TopBarUtil.getOptions({title: title, closeModal: true});
  }


  messageReadStateWatcher: MessageReadStateWatcher;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);
    this.messageReadStateWatcher = new MessageReadStateWatcher();
    this.init();
  }

  init() {
    let activeSphere = this._setActiveSphere();
    if (activeSphere) {
      let state = core.store.getState();
      let sphere = state.spheres[activeSphere];
      if (sphere.state.newMessageFound) {
        MessageCenter.newMessageStateInSphere(activeSphere, false);
      }
    }
  }


  _setActiveSphere() {
    // set the active sphere if needed and setup the object variables.
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;

    let sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name > state.spheres[a].config.name ? 1 : -1});

    // handle the case where we deleted a sphere that was active.
    if (state.spheres[activeSphere] === undefined) {
      activeSphere = null;
    }
    if (activeSphere === null && sphereIds.length > 0) {
      core.store.dispatch({type:"SET_ACTIVE_SPHERE", data: {activeSphere: sphereIds[0]}});
      return sphereIds[0];
    }

    return activeSphere;
  }



  componentDidMount() {
    this.checkForMessages();
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.changeStones       ||
        change.changeMessage      ||
        change.updateActiveSphere ||
        change.changeSphereState
      ) {
        this.checkForMessages();
        this.forceUpdate();
      }
    });
  }

  checkForMessages() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    if (activeSphere) {
      let sphere = state.spheres[activeSphere];
      if (sphere.state.newMessageFound) {
        Navigation.mergeOptions(this.props.componentId, {
          bottomTab: {
            badge: '1'
          }
        });
      }
    }
  }

  clearMessageBadge() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    if (activeSphere) {
      MessageCenter.newMessageStateInSphere(activeSphere, false);
    }
    Navigation.mergeOptions(this.props.componentId, {
      bottomTab: {
        badge: ''
      }
    });
  }


  componentWillUnmount() {
    this.clearMessageBadge();
    this.unsubscribeStoreEvents();
  }

  _getMessages() {
    let items = [];

    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;

    let sphere = state.spheres[activeSphereId];

    let messageIds = Object.keys(sphere.messages);
    if (messageIds.length > 0) {
      items.push({label: lang("MESSAGES"), type: 'explanation',  below:false});

      let messages = [];

      messageIds.forEach((messageId) => {
        messages.push({message: sphere.messages[messageId], id: messageId});
      });

      messages.sort((a,b) => { return b.message.config.updatedAt - a.message.config.updatedAt; });
      messages.forEach((messageData) => {
        let message = messageData.message;
        let backgroundColor = colors.white.rgba(0.75);
        let read = true;
        if (message.received[state.user.userId] && message.read[state.user.userId] === undefined) {
          read = false;
          backgroundColor = colors.green.hex;
        }

        items.push({__item:
          <LifeCycleView
            style={[styles.listView,{backgroundColor: backgroundColor, paddingRight:0, paddingLeft:0}]}
            layout={(event) => {
              let {y, height} = event.nativeEvent.layout;
              this.messageReadStateWatcher.setMessagePosition(messageData.id, y, height);
              console.log("setting messageId", message.config.content)
            }}
            unmount={() => {

            }}
          >
            <MessageEntry
              removeBadgeCallback={() => { this.clearMessageBadge(); }}
              message={message}
              read={read}
              messageId={messageData.id}
              sphere={sphere}
              sphereId={activeSphereId}
              self={state.user}
              size={45}
              deleteMessage={ () => { core.store.dispatch({type:'REMOVE_MESSAGE', sphereId: activeSphereId, messageId: messageData.id}) }}
            />
          </LifeCycleView>
        })
      });
    }

    return items;
  }

  render() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;
    let messageExplanationStyle : TextStyle = {
      color: colors.csBlueDarker.hex,
      textAlign: 'center',
      paddingLeft: 30,
      backgroundColor:"transparent",
      paddingRight: 30,
      fontWeight: 'bold',
      fontStyle:'italic'
    };

    if (activeSphere && state.spheres[activeSphere]) {
      let sphere = state.spheres[activeSphere];

      let stonesAvailable = Object.keys(sphere.stones).length > 0;
      if (stonesAvailable) {
        let iconSize = 0.14*screenHeight;
        let items = this._getMessages();

        let iconButton = (
          <TouchableOpacity
            onPress={() => { NavigationUtil.launchModal( "MessageAdd",{ sphereId: activeSphere }); }}
          >
            <IconButton
              name="ios-mail"
              size={iconSize*0.85}
              color="#fff"
              addIcon={true}
              buttonSize={iconSize}
              buttonStyle={{backgroundColor:colors.csBlueDark.hex, borderRadius: 0.2*iconSize}}
            />
          </TouchableOpacity>
        );

        let headerText = <Text style={textStyle.specification}>{ lang("You_can_leave_messages_in") }</Text>;

        let scrollView;
        if (items.length > 0) {
          scrollView = (
            <ScrollView
              onScroll={(event) => {
                this.messageReadStateWatcher.scrollView(event.nativeEvent.contentOffset.y+statusBarHeight);
              }}
              scrollEventThrottle={32}
              contentContainerStyle={{flexGrow:1, minHeight: availableModalHeight,  width: screenWidth, alignItems:'center'}}
            >
              <View style={{height: 0.3*iconSize}} />
              { headerText }
              <View style={{height: 0.4*iconSize}} />
              { iconButton }
              <View style={{height: 0.1*iconSize}} />
              <ListEditableItems key="empty" items={items} style={{width:screenWidth}} onLayout={(event) => {
                this.messageReadStateWatcher.setMessageStartPosition(event.nativeEvent.layout.y);
              }} />
              <View style={{height: 0.4*iconSize}} />
            </ScrollView>
          );
        }
        else {
          scrollView = (
            <ScrollView style={{height: availableModalHeight, width: screenWidth}}>
              <View style={{flex:1, minHeight: availableModalHeight, width: screenWidth, alignItems:'center'}}>
                <View style={{height: 0.3*iconSize}} />
                { headerText }
                <View style={{height: 0.4*iconSize}} />
                { iconButton }
                <View style={{height: 0.6*iconSize}} />
                <Text style={messageExplanationStyle}>{ lang("Tap_the_envelope_icon_to_") }</Text>
                <View style={{flex:2}} />
              </View>
            </ScrollView>
          );
        }

        return (
          <Background fullScreen={true} image={background.main}>
            <ViewStateWatcher componentId={ this.props.componentId } onBlur={ () => { this.clearMessageBadge(); }} />
            { scrollView }
          </Background>
        );
      }
      else {
        return (
          <Background fullScreen={true} image={background.main}>
            <ViewStateWatcher componentId={ this.props.componentId } onBlur={ () => { this.clearMessageBadge(); }} />
            <View style={{flex:1}} />
            <Text style={messageExplanationStyle}>{ lang("Add_some_Crownstones_to_u") }</Text>
            <View style={{flex:1}} />
          </Background>
        );
      }
    }
    else {
      return (
        <Background fullScreen={true} image={background.main}>
          <ViewStateWatcher componentId={ this.props.componentId } onBlur={ () => { this.clearMessageBadge(); }} />
          <View style={{flex:1}} />
          <Text style={messageExplanationStyle}>{ lang("Add_a_Sphere_to_use_messa") }</Text>
          <View style={{flex:1}} />
        </Background>
      );
    }
  }
}


class LifeCycleView extends Component<any, any> {

  constructor(props) {
    super(props);
  }

  componentWillUnmount() {
    if (this.props.unmount) {
      this.props.unmount();
    }
  }

  componentDidMount() {
    if (this.props.mount) {
      this.props.mount();
    }
  }

  render() {
    return (
      <View onLayout={(event) => { if (this.props.layout) { this.props.layout(event); }}} style={this.props.style} testID={this.props.testID}>
        {this.props.children}
      </View>
    );
  }

}


class MessageReadStateWatcher {

  messageStartY       = Infinity;

  offset   = 0;
  messages = {};

  constructor() {}

  removeMessageId(messageId) {

  }

  setMessageStartPosition(messageStartY) {
    this.messageStartY = messageStartY;
  }


  setMessagePosition(messageId, y, height) {
    if (this.messages[messageId]) {

    }

    this.messages[messageId] = {y: y, height: height, inView: false};
    this.isInView(messageId);
  }

  scrollView(newOffset) {
    this.offset = newOffset;
    this.evaluateAllMessages();
  }

  evaluateAllMessages() {
    for (let messageId in this.messages) {
      this.isInView(messageId);
    }
  }


  isInView(messageId) {
    let viewMessagesPageStart = this.messageStartY + this.offset;
    let viewPageEnd           = screenHeight + this.offset;

    if (this.messages[messageId]) {
      // get the percentage of the message that is in view
      let message = this.messages[messageId];
      let messageHeight = message.height;
      let pageY = message.y + this.messageStartY;
      let viewY = pageY - this.offset;
      let messageData = Get.message(core.store.getState().app.activeSphere, messageId);
      if (messageData.config.content !== "Hello World XY 6") {
        return;
      }

      if (viewY >= viewMessagesPageStart && viewY < viewPageEnd) {
        // it is in the view
        let percentageInView = ((viewY + messageHeight) - viewPageEnd) / messageHeight;
        console.log('viewPageStart', Math.round(viewMessagesPageStart), 'offset', Math.round(this.offset), 'viewPageEnd', Math.round(viewPageEnd),"IN VIEW", messageData.config.content, viewY, message.y, percentageInView)
      }
      else {
        console.log('viewPageStart', Math.round(viewMessagesPageStart), 'offset', Math.round(this.offset), 'viewPageEnd', Math.round(viewPageEnd),"IN VIEW", messageData.config.content, viewY, message.y, false)
      }
    }
  }
}


export const textStyle = StyleSheet.create({
  title: {
    color:colors.csBlueDarker.hex,
    fontSize:30,
    paddingBottom:10,
    fontWeight:'bold'
  },
  explanation: {
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    paddingLeft:25,
    paddingRight:25,
  },
  case: {
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
  },
  value: {
    color:colors.csBlueDarker.hex,
    textAlign:'center',
    fontSize:15,
    fontWeight:'bold'
  },
  specification: {
    backgroundColor:"transparent",
    color:colors.csBlueDarker.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:15,
    padding:15,
    fontWeight:'bold'
  },
});
