
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Wrapup", key)(a,b,c,d,e);
}
import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  TouchableOpacity,
  Text,
  View, ScrollView, Alert
} from "react-native";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenWidth,
} from "../../styles";
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { NavigationUtil, NavState } from "../../../util/NavigationUtil";
import { WeekDayList, WeekDayListLarge } from "../../components/WeekDayList";
import { xUtil } from "../../../util/StandAloneUtil";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { Icon } from "../../components/Icon";
import { BehaviourSubmitButton } from "./supportComponents/BehaviourSubmitButton";
import { BEHAVIOUR_TYPES } from "../../../router/store/reducers/stoneSubReducers/rules";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class DeviceSmartBehaviour_Wrapup extends LiveComponent<{sphereId: string, stoneId: string, rule: string, twilightRule: boolean, ruleId?: string}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "When to do this?"});
  }


  rule : AicoreBehaviour | AicoreTwilight;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;

    let activeDays      = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true };
    let conflictingDays = { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null, Sun: null };
    if (this.props.ruleId) {
      let rule = stone.rules[this.props.ruleId];
      if (rule) {
        activeDays = rule.activeDays;
      }
    }

    this.state = { activeDays: activeDays, conflictingDays: conflictingDays };

    if (this.props.twilightRule) {
      // @ts-ignore
      this.rule = new AicoreTwilight(this.props.rule);
    }
    else {
      // @ts-ignore
      this.rule = new AicoreBehaviour(this.props.rule);
    }
  }

  _storeRule() {
    let ruleId = this.props.ruleId || xUtil.getUUID();
    core.store.dispatch({
      type: this.props.ruleId ? "UPDATE_STONE_RULE" : "ADD_STONE_RULE",
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      ruleId: ruleId,
      data: {
        type: this.props.twilightRule ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour,
        data: this.props.rule,
        activeDays: this.state.activeDays,
      }
    });

    return ruleId;
  }

  getOptionContext() {
    if (!this.rule.hasNoOptions()) {
      // @ts-ignore
      if (this.rule.rule.options.type === "SPHERE_PRESENCE_AFTER") {
        return (
          <Text style={deviceStyles.specification}>{ lang("After_this_behaviour__I_w") }</Text>
        );
      }
      else {
        // in room
        return (
          <Text style={deviceStyles.specification}>{ lang("I_wont_turn_off_as_long_a") }</Text>
        );
      }
    }
  }

  submit() {
    let days = Object.keys(this.state.activeDays);
    let atleastOneDay = false;
    for (let i = 0; i < days.length; i++) {
      if (this.state.activeDays[days[i]] === true) {
        atleastOneDay = true;
        break;
      }
    }

    if (!atleastOneDay) {
      Alert.alert(
        lang("_Never___Please_pick_at_l_header"),
        lang("_Never___Please_pick_at_l_body"),
        [{text:lang("_Never___Please_pick_at_l_left")}])
      return;
    }

    this._storeRule();

    NavigationUtil.dismissModal();
  }


  _getConflictingDays() {
      let state = core.store.getState();
      let sphere = state.spheres[this.props.sphereId];
      let stone = sphere.stones[this.props.stoneId];
      let ruleIds = Object.keys(stone.rules);

      let behaviourDays = {
        Mon: false,
        Tue: false,
        Wed: false,
        Thu: false,
        Fri: false,
        Sat: false,
        Sun: false,
      };

      let dayIndices = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
      ];

      // for (let i = 0; i < ruleIds.length; i++) {
      //   let ruleId = ruleIds[i];
      //   let rule = stone.rules[ruleId];
      //   if (ruleId !== this.props.ruleId) {
      //     if (this.props.twilightRule  && rule.type !== BEHAVIOUR_TYPES.twilight) { continue; }
      //     if (!this.props.twilightRule && rule.type === BEHAVIOUR_TYPES.twilight) { continue; }
      //
      //     for (let j = 0; j < 7; j++) {
      //       behaviourDays[dayIndices[j]] = behaviourDays[dayIndices[j]] || rule.activeDays[dayIndices[j]];
      //     }
      //   }
      // }
      //
      // let availableDays = 0;
      // for (let i = 0; i < 7; i++) {
      //   availableDays += behaviourDays[dayIndices[i]] ? 1 : 0;
      //   behaviourDays[dayIndices[i]] = false;
      // }

      let constructor = this.props.twilightRule ? AicoreTwilight : AicoreBehaviour;
      let isOverlapping = false;
      for (let i = 0; i < ruleIds.length; i++) {
        let ruleId = ruleIds[i];
        let rule = stone.rules[ruleId];
        if (ruleId !== this.props.ruleId) {
          if (this.props.twilightRule  && rule.type !== BEHAVIOUR_TYPES.twilight) { continue; }
          if (!this.props.twilightRule && rule.type === BEHAVIOUR_TYPES.twilight) { continue; }

          let ruleInstance = new constructor(rule.data);
          if (this.rule.isOverlappingWith(ruleInstance.rule, this.props.sphereId)) {
            isOverlapping = true;
            for (let j = 0; j < 7; j++) {
              behaviourDays[dayIndices[j]] = behaviourDays[dayIndices[j]] || rule.activeDays[dayIndices[j]];
            }
          }
        }
      }

      let overlappingDays = 0;
      for (let i = 0; i < 7; i++) {



        overlappingDays += behaviourDays[dayIndices[i]] ? 1 : 0;
      }

      return overlappingDays;
  }


  render() {
    let header = "Every day?"
    if (this.props.ruleId) {
      header = "When do I do this?"
    }

    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableModalHeight, alignItems:'center', paddingTop:30}}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_days_below_to_let") }</Text>

            <View style={{flex:1}} />
            <WeekDayListLarge
              data={this.state.activeDays}
              tight={true}
              darkTheme={false}
              onChange={(fullData, day) => { this.setState({activeDays: fullData}); }}
            />

            <View style={{flex:1}} />
            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <BehaviourSubmitButton callback={() => { this.submit() }} label={lang("Thats_it_")} />
              <View style={{flex:1}} />
            </View>
            <View style={{height: 30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}
