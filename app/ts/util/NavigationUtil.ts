import {Navigation} from "react-native-navigation";
// import * as Sentry from "@sentry/react-native";
import {LOGd, LOGi, LOGw} from "../logging/Log";
import {core} from "../Core";

const BASE_TAB_NAME = "BASE_TAB";

interface views {
  [key: string]: componentInfo[]
}
interface activeView {
  [key: string]: string
}

interface componentInfo {
  id: string,
  name: string,
}

const OVERLAY_APPEARING_TIMEWINDOW = 2000; // 2seconds

/**
 * This class mimics the state of the navigation.
 *
 *
 * Overlays live on top of everything
 *
 * Modals can be layered and always live on top of views.
 *  their data model is an array of component arrays. Every modal can have it's own navigation stack.
 *
 * Views can be sorted with tabs. We have to maintain a number of stacks, one for each tab. If there are no tabs used, we
 *   fall back to the BASE_TAB_NAME
 *
 *
 */
class NavStateManager {
  activeModal : string = null;
  activeView : activeView = {};
  overlayNames = {};
  overlayId = {};

  expectedNewModals = [];

  modals : componentInfo[][] = [];
  views : views = {};

  overlayIncomingNames : string[]   = [];
  prematurelyClosedIncomingOverlays : Record<string, timestamp> = {};
  activeTab = null;

  baseTab = null;

  // ugly hack to ensure that android back buttons sometimes dismiss modals instead of going back in the history
  forcedRootModalStackViews = {};

  /**
   * Load the default initial tabname into the views so we have something to navigate from
   */
  setBaseTab() {
    this.views = {};

    if (this.views[BASE_TAB_NAME] === undefined) {
      this.views[BASE_TAB_NAME] = [];
    }
    this.activeTab = BASE_TAB_NAME;
    this.baseTab = BASE_TAB_NAME;
  }


  /**
   * A stack has loaded, prepare the view objects.
   * @param tabNames
   */
  prepareTabs(tabNames : string[]) {
    this.views = {};

    for (let i = 0; i < tabNames.length; i++) {
      if (this.views[tabNames[i]] === undefined) { this.views[tabNames[i]] = []; }
    }
    this.activeTab = tabNames[0];
    this.baseTab = tabNames[0];
  }

  /**
   * The pointer is on the base tab
   */
  isOnBaseTab() {
    return this.baseTab === this.activeTab;
  }


  switchTab(componentId, componentName) {
    if (this.activeTab === null) {
      this.baseTab = componentName;
    }

    this.activeTab = componentName;
    if (this.views[componentName] === undefined) {
      this.views[componentName] = [];
    }
  }

  tabIsLoaded(tabName) {
    return this.views[tabName] !== undefined;
  }


  /**
   * This returns the id of the active view. We call it component since it can also be a modal.
   */
  getActiveComponent() {
    LOGd.nav("NavStateManager: Getting the active component. ActiveModal=", this.activeModal, "activeView=", this.activeView);

    if (this.activeModal !== null) {
      return this.activeModal;
    }

    return this.activeView[this.activeTab];
  }


  /**
   * We get an appear of a view, check if it is already open, if so, reset the pointer and stack to that.
   * @param componentId
   * @param name
   */
  handleIfAlreadyOpen(componentId, name) {
    // check if this component is already open as a modal
    if (this.isModalIdAlreadyOpen(componentId)) {
      this.backTo(name);
      return true;
    }

    if (!this.activeTab) { return false; }


    // check if this component is already open as a view.
    if (this.isViewIdAlreadyOpen(componentId)) {
      this.backTo(name);
      return true;
    }
    return false;
  }

  isModalIdAlreadyOpen(componentId) {
    for (let i = 0; i < this.modals.length; i++) {
      for (let j = 0; j < this.modals[i].length; j++) {
        if (this.modals[i][j].id === componentId) {
          return true;
        }
      }
    }
    return false;
  }

  isViewNameAlreadyOpen(name) : boolean {
    if (!this.activeTab) { return false; }

    for (let i = 0; i < this.views[this.activeTab].length; i++) {
      if (this.views[this.activeTab][i].name === name) {
        return true;
      }
    }
    return false;
  }

  isViewIdAlreadyOpen(componentId) : boolean {
    if (!this.activeTab) { return false; }

    for (let i = 0; i < this.views[this.activeTab].length; i++) {
      if (this.views[this.activeTab][i].id === componentId) {
        return true;
      }
    }
    return false;
  }

  addView(componentId : string, name : string) {
    if (this.handleIfAlreadyOpen(componentId, name)) { return; }

    LOGi.nav("NavStateManager: addView: incoming data", componentId, name);
    LOGi.nav("NavStateManager: addView: activeTab: ", this.activeTab);
    LOGi.nav("NavStateManager: addView: views:", this.views, "Modals:", this.modals, "overlayNames:", this.overlayNames, "overlayIncomingNames:", this.overlayIncomingNames, 'prematurelyClosedIncomingOverlays:', this.prematurelyClosedIncomingOverlays);

    if (this.prematurelyClosedIncomingOverlays[name]) {
      LOGi.nav("NavStateManager: addView: this overlay was expected to come in and was already closed before it opened.", name);
      if (Date.now() - this.prematurelyClosedIncomingOverlays[name] < OVERLAY_APPEARING_TIMEWINDOW) {
        LOGi.nav("NavStateManager: addView: expected overlay appeared in less than 2 seconds. This is correct, returning addView function now.", name);
        this._removeOverlay(name);
        return;
      }
      delete this.prematurelyClosedIncomingOverlays[name];
      LOGw.nav("NavStateManager: addView: expected overlay appeared after more than 2 seconds. This should not have happened. Cleaning up and resuming addView method..", name);
    }

    if (this.overlayIncomingNames.length > 0 && this.overlayIncomingNames.indexOf(name) !== -1) {
      let overlayIndex = this.overlayIncomingNames.indexOf(name);
      this.overlayIncomingNames.splice(overlayIndex,1);

      // overlays will be closed by their OWN id, it is not tracked by the activeView.
      // we use this layer to catch incoming overlay views so that they do not contaminate the underlaying modal and view stacks.
      this.overlayNames[name] = {id:componentId, name: name};
      this.overlayId[componentId] = {id:componentId, name: name};
    }
    else if (this.expectedNewModals.indexOf(name) !== -1) {
      this.modals.push([])
      lastItem(this.modals).push({id:componentId, name: name});
      this.activeModal = componentId;
      this.expectedNewModals.splice(this.expectedNewModals.indexOf(name),1)
    }
    else if (this.modals.length > 0) {
      lastItem(this.modals).push({id:componentId, name: name});
      this.activeModal = componentId;
    }
    else {
      // No modals, just in case, set it back to null.
      this.activeModal = null;

      // if the root view has not loaded yet and another view comes in first,
      // this is probably a race condition and we'll ignore the intervening view
      if (this.baseTab !== BASE_TAB_NAME) {
        if (
          name !== this.baseTab &&                   // if this view is not the actual base tab.
          this.activeTab === this.baseTab &&         // this is only valid if we are actually on the base tab
          this.isViewNameAlreadyOpen(this.baseTab) === false // if the base tab itself has not loaded yet
        ) {
          LOGw.nav("NavStateManager: IGNORE PROBABLE RACE CONDITION.", this.baseTab, componentId, name);
          return;
        }
      }
      this.views[this.activeTab].push({id:componentId, name: name});
      this.activeView[this.activeTab] = componentId;
    }

    LOGi.nav("NavStateManager: addView: After processing Views::", this.views, "Modals:", this.modals, "overlays:", this.overlayNames)
  }

  isTargetViewNameCurrentlyActive(targetName) {
    if (lastItem(this.views[this.activeTab]).name === targetName) {
      return true;
    }
  }

  getCurrentlyActiveComponentData() {
    if (this.modals.length > 0) {
      return lastItem(lastItem(this.modals));
    }

    if (this.views[this.activeTab].length === 0) {
      return null;
    }
    return lastItem(this.views[this.activeTab]);
  }

  getCurrentlyActiveViewData() {
    if (this.views[this.activeTab].length === 0) {
      return null;
    }
    return lastItem(this.views[this.activeTab]);
  }

  popView() {
    LOGi.nav("NavStateManager: Will popView on tab", this.activeTab, "views:", this.views);
    if (this.views[this.activeTab].length > 0) {
      this.views[this.activeTab].pop();
      this.activeView[this.activeTab] = lastItem(this.views[this.activeTab]).id;
    }
    else {
      LOGw.nav("NavStateManager: Maybe something is wrong during popView?");
      console.warn("NavStateManager: Maybe something is wrong during popView?")
    }
  }

  pop() {
    if (this.modals.length > 0) {
      if (lastItem(this.modals).length > 0) {
        lastItem(this.modals).pop();
      }
      else {
        LOGw.nav("NavStateManager: Maybe wanted to dismiss the modal?");
        console.warn("NavStateManager: Maybe wanted to dismiss the modal?");
      }
    }
    else {
      if (this.views[this.activeTab].length > 0) {
        this.views[this.activeTab].pop();
      }
      else {
        LOGw.nav("NavStateManager: Maybe something is wrong during pop?");
        console.warn("NavStateManager: Maybe something is wrong during pop?");
      }
    }

    this._setActiveIds();
  }

  _setActiveIds() {
    if (this.modals.length > 0) {
      if (lastItem(this.modals).length > 0) {
        this.activeModal = lastItem(lastItem(this.modals)).id;
      }
      else {
        LOGw.nav("NavStateManager: Maybe wanted to dismiss the modal?");
        console.warn("NavStateManager: Maybe wanted to dismiss the modal?");
      }
    }
    else {
      this.activeModal = null;
      this.forcedRootModalStackViews = {};

      if (this.views[this.activeTab].length > 0) {
        this.activeView[this.activeTab] = lastItem(this.views[this.activeTab]).id;
      }
      else {
        LOGw.nav("NavStateManager: Maybe something is wrong during _setActiveIds?");
        console.warn("NavStateManager: Maybe something is wrong during _setActiveIds?");
      }
    }
  }

  _getModalId() : string {
    LOGi.nav(JSON.stringify(this.modals), this.activeModal);
    return this.activeModal;
  }

  _getViewId() {
    if (this.views[this.activeTab].length > 0) {
     return lastItem(this.views[this.activeTab]).id;
    }
    else {
      LOGw.nav("NavStateManager: Maybe something is wrong during _getViewId?");
      console.warn("NavStateManager: Maybe something is wrong during _getViewId?");
    }
  }

  setForcedModalStackRoot(viewName) {
    this.forcedRootModalStackViews[viewName] = true;
  }

  expectModal(targetName) {
    this.expectedNewModals.push(targetName);
  }

  // modalActive() {
  //   this.modals.push([]);
  // }

  modalDismissed() {
    this.modals.pop();
    this._setActiveIds();
  }

  showOverlay(targetName) {
    if (this.overlayIncomingNames.indexOf(targetName) === -1) {
      this.overlayIncomingNames.push(targetName);
    }
    delete this.prematurelyClosedIncomingOverlays[targetName];
  }

  closeOverlay(componentId) {
    LOGi.nav("NavStateManager: will close this overlay: componentId:", componentId, "overlayId:", this.overlayId);
    if (this.overlayId[componentId] !== undefined) {
      LOGi.nav("NavStateManager: actually closing names:", this.overlayNames);
      let name = this.overlayId[componentId].name;
      delete this.overlayId[componentId];
      delete this.overlayNames[name];
    }
    else if (this.overlayIncomingNames.indexOf(componentId) !== -1) {
      LOGi.nav("NavStateManager: Cancelling the opening of the overlay:", componentId, "If it appears in the next 2 seconds it will be discarded immediately.");
      this.prematurelyClosedIncomingOverlays[componentId] = Date.now();
    }
  }

  _removeOverlay(componentId) {
    delete this.prematurelyClosedIncomingOverlays[componentId];
    let index = this.overlayIncomingNames.indexOf(componentId);
    if (index !== -1) {
      this.overlayIncomingNames.splice(index,1);
    }
  }

  isThisOverlayOpen(targetName) {
    LOGi.nav("NavStateManager: @isThisOverlayOpen Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames, "overlayIncomingNames", this.overlayIncomingNames, "prematurelyClosedIncomingOverlays", this.prematurelyClosedIncomingOverlays);
    let open = this.overlayNames[targetName] !== undefined;
    let incoming = this.overlayIncomingNames.indexOf(targetName) !== -1;
    let closed = this.prematurelyClosedIncomingOverlays[targetName] !== undefined;

    if (open)                { return true; }
    if (incoming && !closed) { return true; }

    return false;
  }

  allModalsDismissed() {
    this.modals = [];
    this._setActiveIds();
  }

  setRoot() {
    this.baseTab      = null;
    this.activeTab    = null;
    this.activeView   = {};
    this.modals       = [];
    this.views        = {};
  }

  resetState() {
    LOGi.nav("NavStateManager: RESETTING STATE");
    this.activeModal = null;
    this.activeView  = {};
    this.overlayNames = {};
    this.overlayId = {};
    this.modals = [];
    this.views = {};
    this.overlayIncomingNames = [];
    this.activeTab = null;
    this.baseTab = null;
  }

  backTo(name) : string {
    let targetId = null;
    let spliceTarget = null;
    if (this.modals.length > 0) {
      let toplevelModal = lastItem(this.modals);

      for (let i = toplevelModal.length -1; i >= 0; i--) {
        if (toplevelModal[i].name === name) {
          targetId = toplevelModal[i].id;
          spliceTarget = i + 1; // we want to keep the target, and remove the rest.
          break;
        }
      }

      this.activeModal = targetId;

      if (spliceTarget !== null) {
        lastItem(this.modals).splice(spliceTarget);
      }
    }
    else {
      if (this.views[this.activeTab].length > 0) {
        for (let i = this.views[this.activeTab].length -1; i >= 0; i--) {
          if (this.views[this.activeTab][i].name === name) {
            targetId = this.views[this.activeTab][i].id;
            spliceTarget = i + 1; // we want to keep the target, and remove the rest.
            break;
          }
        }

        this.activeView[this.activeTab] = targetId;

        if (spliceTarget !== null) {
          this.views[this.activeTab].splice(spliceTarget)
        }
      }
      else {
        LOGw.nav("NavStateManager: Maybe something is wrong during backTo? activeTab", this.activeTab, this.views);
        console.warn("NavStateManager: Maybe something is wrong during backTo?", this.activeTab, this.views);
      }
    }

    if (targetId === null) {
      this._setActiveIds();
    }

    LOGi.nav("NavStateManager: IN BACK TO active: ", this.activeTab);
    LOGi.nav("NavStateManager: IN BACK TO Views:", this.views, "Modals:", this.modals, "overlays:", this.overlayNames);

    return targetId;
  }

  isOverlayOpen() {
    return Object.keys(this.overlayId).length > 0;
  }

  areModalsOpen() {
    return this.modals.length > 0;
  }

  /**
   * This will return true if a base modal is open with this name.
   * Base modals are the views at the beginning of the modal stack.
   * @param modalName
   */
  isModalViewNameOpen(modalName) {
    if (this.modals.length > 0) {
      for (let i = 0; i < this.modals.length; i++) {
        if (this.modals[i].length > 0) {
          if (this.modals[i][0].name === modalName) {
            return true;
          }
        }
      }
    }
    return false;
  }

  canGoBack() {
    if (this.modals.length > 0) {
      let lastModalStack = lastItem(this.modals);
      if (lastModalStack.length > 1) {
        if (this.forcedRootModalStackViews[lastItem(lastModalStack).name]) {
          return false;
        }
        return true;
      }
      else {
        return false;
      }
    }
    else {
      if (this.views[this.activeTab].length > 1) {
        return true;
      }
      else {
        return false;
      }
    }
  }
}

export const NavState = new NavStateManager();

let loadNamesFromStack = (stack) => {
  if (stack && stack.bottomTabs && stack.bottomTabs.children) {
    stack.bottomTabs.children.forEach((child) => {
      if (child && child.stack && child.stack.children) {
        tabBarComponentNames.push(child.stack.children[0].component.name);
      }
    })
  }
};

let tabBarComponentNames = [];
export let topBarComponentNames = [];


// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidAppearListener(({ componentId, componentName }) => {
  core.eventBus.emit("VIEW_DID_APPEAR", componentId);
  if (topBarComponentNames.indexOf(componentName) === -1) {
    LOGi.nav("VIEW DID APPEAR", componentId, componentName);
    if (tabBarComponentNames.indexOf(componentName) !== -1) {
      NavState.switchTab(componentId, componentName);
    }
    NavState.addView(componentId, componentName);
  }
});

// Listen for componentDidAppear screen events
Navigation.events().registerComponentDidDisappearListener(({ componentId, componentName }) => {
  core.eventBus.emit("VIEW_DID_DISAPPEAR", componentId);
  LOGi.nav("VIEW DID DISAPPEAR", componentId, componentName);
});



export const NavigationUtil = {

  /**
   * this will ensure the overlays will not be opened doubly.
   * @param target
   * @param props
   */
  showOverlay(target, props) {
    // // addSentryLog("showOverlay", target);
    LOGi.nav("NavigationUtil: I WANT TO SHOW THIS OVERLAY", target);
    LOGi.nav("NavigationUtil: is this overlay open?", target, NavState.isThisOverlayOpen(target));

    if (NavState.isThisOverlayOpen(target)) {
      return;
    }

    NavState.showOverlay(target);

    LOGi.nav("WILL SHOW NOW", target);
    Navigation.showOverlay({
      component: {
        id: target,
        name: target,
        passProps: props,
        options: {
          layout: {
            componentBackgroundColor: "transparent",
          },
          overlay: {
            interceptTouchOutside: true,
            handleKeyboardEvents: true,
          },
          statusBar: {
            drawBehind: true,
          },
        }
      },
    })
  },

  closeOverlay(componentId) {
    NavState.closeOverlay(componentId);
    Navigation.dismissOverlay(componentId);
  },


  init() {
    NavState.resetState();
  },

  setRoot(rootStack : StackData) {
    // we add a timeout to ensure that there are no raceconditions when
    setTimeout(() => {
      // // addSentryLog("rootStack", "stack");

      // reset the NavState
      NavState.setRoot();

      LOGi.nav("NavigationUtil: -------------------------- SET ROOT", rootStack);
      // check if we have a tabBar setup.
      tabBarComponentNames = [];
      loadNamesFromStack(rootStack);
      if (tabBarComponentNames.length === 0) {
        NavState.setBaseTab();
      }
      else {
        NavState.prepareTabs(tabBarComponentNames);
      }

      LOGi.nav("NavigationUtil: This is the tabBarComponentNames", tabBarComponentNames);

      Navigation.setRoot({ root: rootStack });
    }, 25);
  },


  launchModal: function(target, props = {}) {
    // // addSentryLog("launchModal", target);
    LOGi.nav("NavigationUtil: Navigating from", NavState.activeView, "to", target, props);
    NavState.expectModal(target);
    // NavState.modalActive();
    Navigation.showModal({
      stack:{
        children: [
          { component: { name: target, passProps: props }}
        ],
        options: {
          modal: {
            swipeToDismiss: false,
          }
        }
      }
    })
  },


  isModalOpen(viewName) {
    return NavState.isModalViewNameOpen(viewName);
  },

  setForcedModalStackRoot(viewName) {
    NavState.setForcedModalStackRoot(viewName)
  },

  dismissModal: function() {
    LOGi.nav("NavigationUtil: CALLING dismissModal start");
    let backFrom = NavState.getActiveComponent();
    LOGi.nav("NavigationUtil: CALLING dismissModal on", backFrom);
    // addSentryLog("dismissModal", backFrom);
    NavState.modalDismissed();
    return Navigation.dismissModal(backFrom)
      .then(() => {
        LOGi.nav("NavigationUtil: DISMISS Going back from ", backFrom, " success!")
      })
      .catch((err) => {
        LOGw.nav("NavigationUtil: DISMISS Going back from ", backFrom, " FAILED!", err?.message)
      });
  },

  dismissModalAndBack: async function() {
    // addSentryLog("dismissModalAndBack", "null");
    await NavigationUtil.baseStackBack();
    NavigationUtil.dismissModal();
  },


  dismissAllModals: function() {
    // addSentryLog("dismissAllModals", "null");
    LOGi.nav("NavigationUtil: Closing all modals");
    Navigation.dismissAllModals();
    NavState.allModalsDismissed();
  },


  dismissModalAndNavigate(target,props) {
    // addSentryLog("dismissModalAndNavigate", target);
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissModal()
  },

  dismissModalAndNavigateFromModal(target,props) {
    // addSentryLog("dismissModalAndNavigateFromModal", target);
    NavigationUtil.dismissModal();
    NavigationUtil.navigateFromUnderlyingModal(target, props);
  },


  dismissAllModalsAndNavigate(target,props) {
    // addSentryLog("dismissAllModalsAndNavigate", target);
    NavigationUtil.navigateFromUnderlyingStack(target, props);
    NavigationUtil.dismissAllModals()
  },

  /**
   * This wil enable (true) or disable (false) the gesture used on ios to swipe to go back on the active view.
   * @param state
   */
  setViewBackSwipeEnabled(state) {
    let componentId = NavState.getActiveComponent();
    LOGi.info("NavigationUtil: MergeOptions 1");
    Navigation.mergeOptions(componentId, {popGesture: state});
  },


  /**
   * This method is meant to call a view from a modal or an overlay. It will handle not knowing which tab you're on gracefully.
   * @param livesOnTab
   * @param target
   * @param props
   */
  navigateSafely: function(livesOnTab : string, target : string, props : any) {
    // addSentryLog("navigateSafely", target);

    if (!NavState.tabIsLoaded(livesOnTab)) {
      // if not, ignore.
      return;
    }

    if (NavState.areModalsOpen()) {
      NavigationUtil.dismissAllModals();
    }

    if (NavState.activeTab !== livesOnTab) {
      // go to the tab
      NavigationUtil.navigateToTabName(livesOnTab);
    }

    let currentlyActiveView = NavState.getCurrentlyActiveViewData();
    if (currentlyActiveView.name === target) {
      // update view with new params
      NavigationUtil.back();
      NavigationUtil.navigate(target, props);
    }
    else {
      if (NavState.isViewNameAlreadyOpen(target)) {
        // go back to the view
        NavigationUtil.backTo(target);
        NavigationUtil.back();
        NavigationUtil.navigate(target, props);
      }
      else {
        // navigate to the view
        NavigationUtil.navigate(target, props);
      }
    }
  },

  navigate: function(target : string, props = {}) {
    let activeView = NavState.getActiveComponent();
    if (activeView === target) {
      LOGi.nav("NavigationUtil: Ignoring duplicate navigate");
      return;
    }

    // addSentryLog("navigate", target);
    LOGi.nav("NavigationUtil: Navigating from",activeView, "to", target, props);
    Navigation.push(activeView, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },

  navigateTab: function(currentTabIndex) {
    let activeView = NavState.getActiveComponent();
    LOGi.nav("NavigationUtil: Navigating from ",activeView, "to tab index", currentTabIndex);
    LOGi.info("NavigationUtil: MergeOptions 2");
    Navigation.mergeOptions(activeView, {
      bottomTabs: {
        currentTabIndex: currentTabIndex
      }
    });
  },


  navigateFromUnderlyingModal(target, props) {
    LOGi.nav("NavigationUtil: UNDERLYING MODAL");
    let goFrom = NavState._getModalId();
    // addSentryLog("navigateFromUnderlyingModal", target);
    LOGi.nav("NavigationUtil: navigateFromUnderlyingModal from", goFrom, "to", target);
    Navigation.push(goFrom, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },

  navigateFromUnderlyingStack(target, props) {
    let goFrom = NavState._getViewId();
    // addSentryLog("navigateFromUnderlyingStack", target);
    LOGi.nav("NavigationUtil: Navigating from", goFrom, "to", target);
    Navigation.push(goFrom, {
      component: {
        id: target,
        name: target,
        passProps: props,
      },
    });
  },


  navigateToBaseTab() {
    // addSentryLog("navigateToBaseTab", "null");
    NavigationUtil.navigateToTab(0)
  },

  navigateToTabName(tabName) {
    // addSentryLog("navigateToTabName", tabName);

    let tabIndex = tabBarComponentNames.indexOf(tabName);
    if (tabIndex !== -1) {
      NavigationUtil.navigateToTab(tabIndex)
    }
  },

  navigateToTab(tabIndex) {
    // addSentryLog("back", tabIndex);

    if (NavState.baseTab && NavState.baseTab !== BASE_TAB_NAME) {
      LOGi.nav(tabBarComponentNames, tabIndex);
      NavState.activeTab = tabBarComponentNames[tabIndex];
      LOGi.info("NavigationUtil: MergeOptions 3");
      Navigation.mergeOptions('bottomTabs', {
        bottomTabs: {
          currentTabIndex: tabIndex
        }
      });
    }
  },


  back() {
    LOGi.nav("NavigationUtil: CALLING BACK");
    let backFrom = NavState.getActiveComponent();
    NavState.pop();

    // addSentryLog("back", backFrom);
    return Navigation.pop(backFrom)
      .then(() => {
        LOGi.nav("NavigationUtil: Going back from ", backFrom, " success!")
      })
      .catch((err) => {
        LOGw.nav("NavigationUtil: Going back from ", backFrom, " FAILED!", err?.message)
      })
  },


  async baseStackBack() {
    let backFrom = NavState._getViewId();
    // addSentryLog("baseStackBack", backFrom);
    LOGi.nav("NavigationUtil: Going back baseStackBack", backFrom);
    try {
      await Navigation.pop(backFrom);
      LOGi.nav("NavigationUtil: Going back baseStackBack ", backFrom, " done on the native side, updating state...");
      NavState.popView();
      LOGi.nav("NavigationUtil: Going back baseStackBack ", backFrom, " success!");
    }
    catch (err) {
      LOGw.nav("NavigationUtil: Going back baseStackBack ", backFrom, " FAILED!", err?.message);
    }
  },


  backTo(target) {
    // addSentryLog("backTo", target);
    let componentId = NavState.backTo(target);
    if (componentId) {
      Navigation.popTo(componentId)
    }
    else {
      throw new Error("CAN NOT FIND THIS COMPONENT " + target);
    }
  },
};

/**
 * quickly get the last item in an array. This should clean up the code a bit since:
 * this.modals[this.modal.length - 1][this.modals[this.modal.length - 1].length -1] is very ugly and unclear
 * lastItem(lastItem(this.modals)) is much compacter.
 *
 * It is also typed to catch most errors.
 * @param arr
 */
function lastItem<T>(arr : T[]) : T {
  return arr[arr.length - 1];
}
