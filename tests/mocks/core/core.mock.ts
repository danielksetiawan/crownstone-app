import { eventBus } from "../../../js/util/EventBus";
import { createStore } from "redux";
import { batchActions, enableBatching } from "../../../js/router/store/reducers/BatchReducer";
import CrownstoneReducer                from '../../../js/router/store/reducer'

import { mockNativeBus } from "../nativeBus.mock";
let nativeBus = mockNativeBus()


export function mockCore() {
  const store = createStore(enableBatching(CrownstoneReducer))
  // @ts-ignore
  store.batchDispatch = (actions) => { return batchActions(store, actions); };

  let bleState = {
    bleAvailable: true,
    bleBroadcastAvailable: true,
  };
  let mockedCore =  {
    eventBus: eventBus,
    nativeBus: nativeBus,
    state: bleState,
    store: store,
    resetMocks: () => {
      eventBus.clearAllEvents();
      nativeBus.clearAllEvents();
      store.dispatch({ type: "TESTS_CLEAR_STORE" });
      bleState.bleAvailable = true;
      bleState.bleBroadcastAvailable = true;
    }
  }

  jest.mock("../../../js/core", () => {
    return { core: mockedCore };
  })

  return mockedCore;
}
