// import { combineReducers } from "redux";
// import { getTime, refreshDefaults, update } from "../reducerUtil";
//
// let dimmingAbilityFormat : AbilityDimmingData = {
//   enabled: false,
//   enabledTarget: false,
//   cloudId: null,
//   softOnSpeed: 8,
//   syncedToCrownstone: true,
//   updatedAt: 0
// };
// let switchcraftAbilityFormat : AbilitySwitchcraftData = {
//   enabled: false,
//   enabledTarget: false,
//   cloudId: null,
//   syncedToCrownstone: true,
//   updatedAt: 0
// };
// let tapToToggleAbilityFormat : AbilityTapToToggleData = {
//   enabled: false,
//   enabledTarget: false,
//   cloudId: null,
//   rssiOffset: 0,
//   rssiOffsetTarget: 0,
//   syncedToCrownstone: true,
//   updatedAt: 0
// };
//
//
// let dimmingReducer = (state = dimmingAbilityFormat, action) => {
//   switch (action.type) {
//     case 'UPDATE_ABILITY_DIMMER_AS_SYNCED_FROM_CLOUD':
//       if (action.data) {
//         let newState = {...state};
//         newState.enabled            = update(action.data.enabled,       newState.enabled);
//         newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
//         newState.cloudId            = update(action.data.cloudId,       newState.cloudId);
//         newState.softOnSpeed        = update(action.data.softOnSpeed,   newState.softOnSpeed);
//         newState.syncedToCrownstone = true;
//         newState.updatedAt          = getTime(action.data.updatedAt);
//         return newState;
//       }
//       return state;
//     case 'UPDATE_ABILITY_DIMMER':
//       if (action.data) {
//         let newState = {...state};
//         newState.enabled            = update(action.data.enabled,       newState.enabled);
//         newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
//         newState.cloudId            = update(action.data.cloudId,       newState.cloudId);
//         newState.softOnSpeed        = update(action.data.softOnSpeed,   newState.softOnSpeed);
//         newState.syncedToCrownstone = false;
//         newState.updatedAt          = getTime(action.data.updatedAt);
//         return newState;
//       }
//       return state;
//     case "MARK_ABILITY_DIMMER_AS_SYNCED":
//       let newState = {...state};
//       newState.syncedToCrownstone = true;
//       return newState;
//     case "UPDATE_DIMMING_ABILITY_CLOUD_ID":
//       newState = {...state};
//       newState.cloudId = update(action.data.cloudId,       newState.cloudId);
//       return newState;
//     case "REFRESH_ABILITIES":
//       newState = {...state};
//       newState.syncedToCrownstone = false;
//       return newState;
//     case 'REFRESH_DEFAULTS':
//       return refreshDefaults(state, dimmingAbilityFormat);
//     default:
//       return state;
//   }
// };
//
//
// let switchcraftReducer = (state = switchcraftAbilityFormat, action) => {
//   switch (action.type) {
//     case 'UPDATE_ABILITY_SWITCHCRAFT_AS_SYNCED_FROM_CLOUD':
//       if (action.data) {
//         let newState = {...state};
//         newState.enabled            = update(action.data.enabled,       newState.enabled);
//         newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
//         newState.cloudId            = update(action.data.cloudId,       newState.cloudId);
//         newState.syncedToCrownstone = true;
//         newState.updatedAt          = getTime(action.data.updatedAt);
//         return newState;
//       }
//       return state;
//     case 'UPDATE_ABILITY_SWITCHCRAFT':
//       if (action.data) {
//         let newState = {...state};
//         newState.enabled            = update(action.data.enabled,       newState.enabled);
//         newState.enabledTarget      = update(action.data.enabledTarget, newState.enabledTarget);
//         newState.cloudId            = update(action.data.cloudId,       newState.cloudId);
//         newState.syncedToCrownstone = false;
//         newState.updatedAt          = getTime(action.data.updatedAt);
//         return newState;
//       }
//       return state;
//     case "MARK_ABILITY_SWITCHCRAFT_AS_SYNCED":
//       let newState = {...state};
//       newState.syncedToCrownstone = true;
//       return newState;
//     case "UPDATE_SWITCHCRAFT_ABILITY_CLOUD_ID":
//       newState = {...state};
//       newState.cloudId = update(action.data.cloudId,       newState.cloudId);
//       return newState;
//     case "REFRESH_ABILITIES":
//       newState = {...state};
//       newState.syncedToCrownstone = false;
//       return newState;
//     case 'REFRESH_DEFAULTS':
//       return refreshDefaults(state, switchcraftAbilityFormat);
//     default:
//       return state;
//   }
// };
//
//
// let tapToToggleReducer = (state = tapToToggleAbilityFormat, action) => {
//   switch (action.type) {
//     case 'UPDATE_ABILITY_TAP_TO_TOGGLE_AS_SYNCED_FROM_CLOUD':
//       if (action.data) {
//         let newState = {...state};
//         newState.enabled            = update(action.data.enabled,           newState.enabled);
//         newState.enabledTarget      = update(action.data.enabledTarget,     newState.enabledTarget);
//         newState.cloudId            = update(action.data.cloudId,           newState.cloudId);
//         newState.rssiOffset         = update(action.data.rssiOffset,        newState.rssiOffset);
//         newState.rssiOffsetTarget   = update(action.data.rssiOffsetTarget,  newState.rssiOffsetTarget);
//         newState.syncedToCrownstone = true;
//         newState.updatedAt          = getTime(action.data.updatedAt);
//         return newState;
//       }
//       return state;
//     case 'UPDATE_ABILITY_TAP_TO_TOGGLE':
//       if (action.data) {
//         let newState = {...state};
//         newState.enabled            = update(action.data.enabled,           newState.enabled);
//         newState.enabledTarget      = update(action.data.enabledTarget,     newState.enabledTarget);
//         newState.cloudId            = update(action.data.cloudId,           newState.cloudId);
//         newState.rssiOffset         = update(action.data.rssiOffset,        newState.rssiOffset);
//         newState.rssiOffsetTarget   = update(action.data.rssiOffsetTarget,  newState.rssiOffsetTarget);
//         newState.syncedToCrownstone = false;
//         newState.updatedAt          = getTime(action.data.updatedAt);
//         return newState;
//       }
//       return state;
//     case "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED":
//       let newState = {...state};
//       newState.syncedToCrownstone = true;
//       return newState;
//     case "UPDATE_TAP_TO_TOGGLE_ABILITY_CLOUD_ID":
//       newState = {...state};
//       newState.cloudId = update(action.data.cloudId,       newState.cloudId);
//       return newState;
//     case "REFRESH_ABILITIES":
//       newState = {...state};
//       newState.syncedToCrownstone = false;
//       return newState;
//     case 'REFRESH_DEFAULTS':
//       return refreshDefaults(state, tapToToggleAbilityFormat);
//     default:
//       return state;
//   }
// };
//
//
// export default combineReducers({
//   dimming:     dimmingReducer,
//   switchcraft: switchcraftReducer,
//   tapToToggle: tapToToggleReducer,
// });
