type CrownstoneMode = "unknown" | "setup" | "operation" | "dfu"

/**
 * All methods which will send a command to a Crownstone and fail due to there not being a connection will throw error "NOT_CONNECTED"
 *
 * All methods which broadcast and are overwritten by the library (due to duplicate handling, or other reasons) will throw "BROADCAST_ABORTED"
 * Broadcasts are given 1.5s airtime total, each 0.25s, the broadcast payload updates to cycle packets that want to be broadcasted.
 * When the broadcast has had it's 1.5s airtime, the promise will resolve.
 */

interface BluenetPromiseWrapperProtocol {
  /**
   * Stop tracking ibeacons
   */
  clearTrackedBeacons()                                                 : Promise< void >,

  /**
   * This method assumes there is a connection to this Crownstone, it performs a factory reset via command
   * It leaves the Crownstone disconnected.
   * It can throw an error COULD_NOT_FACTORY_RESET if the return code is not success
   */
  commandFactoryReset(handle: string)                                   : Promise< void >,

  /**
   * This will connect to the Crownstone and return the mode. Possible modes are typed in CrownstoneMode.
   * If the connection is cancelled by the cancelConnectionRequest method, the error "CONNECTION_CANCELLED" is thrown
   * Other errors will be treated as bugs to solve (for now).
   *
   * @param handle           Handle or MAC address.
   * @param referenceId      The sphere ID.
   * @param highPriority
   */
  connect(handle: string, referenceId: string, highPriority?: boolean)  : Promise< CrownstoneMode >,

  /**
   * Cancels a connection request to the handle. Will return immediately and will not throw errors.
   * @param handle
   */
  cancelConnectionRequest(handle: string)                               : Promise< void >,

  /**
   * This sends the disconnect command to the Crownstone and performs a phoneDisconnect afterwards.
   * Leaves the Crownstone disconnected. Will not throw errors.
   * @param handle
   */
  disconnectCommand(handle: string)                                     : Promise< void >,

  getMACAddress(handle: string)                                         : Promise< string >,
  getFirmwareVersion(handle: string)                                    : Promise< string >,
  getBootloaderVersion(handle: string)                                  : Promise< string >,
  getHardwareVersion(handle: string)                                    : Promise< string >,

  finalizeFingerprint(sphereId: string, locationId: string)             : Promise< void >,

  /**
   * Returns when the BLE central has initialized (ready to scan/perform connections after boot)
   */
  isReady()                                                             : Promise< void >,
  isPeripheralReady()                                                   : Promise< void >,

  /**
   * Disconnect from the Crownstone from the phone's side. Used for Crownstones that are not in operation mode. Will not throw errors.
   * @param handle
   */
  phoneDisconnect(handle: string)                                       : Promise< void >,


  toggleSwitchState(handle: string, stateForOn)                         : Promise< number >,

  /**
   * Setups a Crownstone. Will leave the Crownstone disconnected and setupped.
   * @param handle
   * @param dataObject
   */
  setupCrownstone(handle: string, dataObject: setupData)                : Promise< void >,
  requestLocation()                                                     : Promise< locationType >,
  recover(handle: string)                                               : Promise< void >,
  clearFingerprintsPromise()                                            : Promise< void >,
  setKeySets(keySets)                                                   : Promise< void >,

  // Mesh
  multiSwitch(handle: string, arrayOfStoneSwitchPackets: any[])         : Promise< void >,

  // DFU
  /**
   * Will write the command to put in DFU mode. Will not directly disconnect from the Crownstone
   * @param handle
   */
  putInDFU(handle: string)                                              : Promise< void >,
  /**
   * Same as putInDFU
   * @param handle
   */
  setupPutInDFU(handle: string)                                         : Promise< void >,
  performDFU(handle: string, uri: string)                               : Promise< void >,

  /**
   * This will connect to the Crownstone, resolve if the Crownstone is NOT in dfu mode, try to start it in normal mode and leave disconnected.
   * Does not check if the new mode is operation mode.
   * @param handle
   */
  bootloaderToNormalMode(handle: string)                                : Promise< void >,

  clearErrors(handle: string, clearErrorJSON : clearErrorData)          : Promise< void >,
  restartCrownstone(handle: string)                                     : Promise< void >,
  setTime(handle: string, time : number)                                : Promise< void >,

  /**
   * Set time via broadcast.
   * 
   * @param time
   * @param sunriseSecondsSinceMidnight
   * @param sunsetSecondsSinceMidnight
   * @param referenceId                     The sphere ID.
   * @param enableTimeBasedNonce
   */
  setTimeViaBroadcast(
    time : number,
    sunriseSecondsSinceMidnight: number,
    sunsetSecondsSinceMidnight: number,
    referenceId: string,
    enableTimeBasedNonce: boolean
  )                                                                     : Promise< void >,
  meshSetTime(handle: string, time : number)                            : Promise< void >,
  getTime(handle: string)                                               : Promise< number >, // timestamp in seconds since epoch

  getSwitchState(handle: string)                                        : Promise< number >,
  setSwitchState(handle: string, state: number)                         : Promise< void >,
  lockSwitch(handle: string, lock : Boolean)                            : Promise< void >,
  allowDimming(handle: string, allow: Boolean)                          : Promise< void >,
  setSwitchCraft(handle: string, state: Boolean)                        : Promise< void >,

  sendNoOp(handle: string)                                              : Promise< void >,
  sendMeshNoOp(handle: string)                                          : Promise< void >,

  getTrackingState()                                                    : Promise< trackingState >,
  isDevelopmentEnvironment()                                            : Promise< boolean >,
  setupPulse(handle: string)                                            : Promise< void >,
  checkBroadcastAuthorization()                                         : Promise< string >,

  /**
   * Broadcast switch.
   * 
   * @param referenceId                     The sphere ID.
   * @param stoneId
   * @param switchState
   * @param autoExecute
   */
  broadcastSwitch(referenceId, stoneId, switchState, autoExecute)       : Promise< void >,

  /**
   * Broadcast behaviour settings.
   * 
   * @param referenceId                     The sphere ID.
   * @param enabled
   */
  broadcastBehaviourSettings(referenceId, enabled:boolean)              : Promise< void >,

  addBehaviour(handle: string, behaviour: behaviourTransfer)            : Promise<behaviourReply>,
  updateBehaviour(handle: string, behaviour: behaviourTransfer)         : Promise<behaviourReply>,
  removeBehaviour(handle: string, index: number)                        : Promise<behaviourReply>,
  getBehaviour(handle: string, index: number)                           : Promise<behaviourTransfer>,

  setTapToToggle(handle: string, enabled: boolean)                      : Promise<void>,
  setTapToToggleThresholdOffset(handle: string, rssiThresholdOffset: number): Promise<void>,
  getTapToToggleThresholdOffset(handle: string)                         : Promise< number >,
  setSoftOnSpeed(handle: string, speed: number)                         : Promise< void >,
  getSoftOnSpeed(handle: string)                                        : Promise< number >,

  syncBehaviours(handle: string, behaviours: behaviourTransfer[])       : Promise<behaviourTransfer[]>,
  getBehaviourMasterHash(behaviours: behaviourTransfer[])               : Promise<number>,
  getBehaviourMasterHashCRC(behaviours: behaviourTransfer[])            : Promise<number>,

  /**
   * If this returns true, we will not use the registerDevice/trackingNumbers/heartbeats but expect that the
   * device will broadcast its location changes in the background. This payload needs to be updated in the background as well.
   */
  canUseDynamicBackgroundBroadcasts()                                   : Promise<boolean>,

  // dev
  switchRelay(handle: string, state: number)                            : Promise< void >,
  switchDimmer(handle: string, state: number)                           : Promise< void >,
  getResetCounter(handle: string)                                       : Promise< number >,
  getSwitchcraftThreshold(handle: string)                               : Promise< number >,
  setSwitchcraftThreshold(handle: string, value: number)                : Promise< void >,
  getMaxChipTemp(handle: string)                                        : Promise< number >,
  setMaxChipTemp(handle: string, value: number)                         : Promise< void >,
  getDimmerCurrentThreshold(handle: string)                             : Promise< number >,
  setDimmerCurrentThreshold(handle: string, value: number)              : Promise< void >,
  getDimmerTempUpThreshold(handle: string)                              : Promise< number >,
  setDimmerTempUpThreshold(handle: string, value: number)               : Promise< void >,
  getDimmerTempDownThreshold(handle: string)                            : Promise< number >,
  setDimmerTempDownThreshold(handle: string, value: number)             : Promise< void >,
  getVoltageZero(handle: string)                                        : Promise< number >,
  setVoltageZero(handle: string, value: number)                         : Promise< void >,
  getCurrentZero(handle: string)                                        : Promise< number >,
  setCurrentZero(handle: string, value: number)                         : Promise< void >,
  getPowerZero(handle: string)                                          : Promise< number >,
  setPowerZero(handle: string, value: number)                           : Promise< void >,
  getVoltageMultiplier(handle: string)                                  : Promise< number >,
  setVoltageMultiplier(handle: string, value: number)                   : Promise< void >,
  getCurrentMultiplier(handle: string)                                  : Promise< number >,
  setCurrentMultiplier(handle: string, value: number)                   : Promise< void >,
  setUartState(handle: string, value: 0 | 1 | 3)                        : Promise< number >,
  getBehaviourDebugInformation(handle: string)                          : Promise< behaviourDebug >,

  turnOnMesh(handle: string, arrayOfStoneIds: number[])                 : Promise< void >,

  /**
   * Broadcast turn on.
   * 
   * @param referenceId                     The sphere ID.
   * @param stoneId
   * @param autoExecute
   */
  turnOnBroadcast(referenceId, stoneId, autoExecute)                    : Promise< void >,
  setSunTimesViaConnection(handle: string, sunriseSecondsSinceMidnight : number, sunsetSecondsSinceMidnight : number) : Promise< void >,

  registerTrackedDevice(
    handle: string,
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number)                                                  : Promise< void >,

  trackedDeviceHeartbeat(
    handle: string,
    trackingNumber:number,
    locationUID:number,
    deviceToken:number,
    ttlMinutes:number)                                                  : Promise< void >,

  /**
   * Broadcast update tracked device.
   * 
   * @param referenceId                     The sphere ID.
   */
  broadcastUpdateTrackedDevice(
    referenceId: string,
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number)                                                  : Promise< void >,

  getCrownstoneUptime(handle: string)                                   : Promise<number>,
  getMinSchedulerFreeSpace(handle: string)                              : Promise<number>,
  getLastResetReason(handle: string)                                    : Promise<ResetReason>,
  getGPREGRET(handle: string)                                           : Promise<GPREGRET[]>,
  getAdcChannelSwaps(handle: string)                                    : Promise<AdcSwapCount>,
  getAdcRestarts(handle: string)                                        : Promise<AdcRestart>,
  getSwitchHistory(handle: string)                                      : Promise<SwitchHistory[]>,
  getPowerSamples(handle: string, type : PowersampleDataType)           : Promise<PowerSamples[]>,

  getUICR(handle: string)                                               : Promise<UICRData>
  
  setUartKey(handle: string, uartKey: string)                           : Promise<void>,

  // all methods that use the hubData pathway, can be rejected with error "HUB_REPLY_TIMEOUT" if the response in not quick enough.
  transferHubTokenAndCloudId(handle: string, hubToken: string, cloudId: string) : Promise<HubDataReply>,
  requestCloudId(handle: string)                                        : Promise<HubDataReply>,
  factoryResetHub(handle: string)                                       : Promise<HubDataReply>,
  factoryResetHubOnly(handle: string)                                   : Promise<HubDataReply>,
}

interface UICRData {
  board          : number, 
  productType    : number, 
  region         : number, 
  productFamily  : number, 
  reserved1      : number, 

  hardwarePatch  : number, 
  hardwareMinor  : number, 
  hardwareMajor  : number, 
  reserved2      : number, 

  productHousing : number, 
  productionWeek : number, 
  productionYear : number,
  reserved3      : number, 
}

interface GPREGRET {
  counter?:           number,
  brownout?:          boolean,
  dfuMode?:           boolean,
  storageRecovered?:  boolean,
  raw:                number,
}
interface ResetReason {
  resetPin:       boolean,
  watchdog:       boolean,
  softReset:      boolean,
  lockup:         boolean,
  gpio:           boolean,
  lpComp:         boolean,
  debugInterface: boolean,
  nfc:            boolean,
  raw:            number,
}
interface AdcSwapCount {
  swapCount: number,
  timestamp: number,
}
interface AdcRestart {
  restartCount: number,
  timestamp:    number,
}
interface SwitchHistory {
  timestamp:     number,
  switchCommand: number,
  switchState:   number,
  sourceData:    number,
  sourceId:      number,
  sourceType:    number,
  viaMesh:       boolean,
}
interface PowerSamples {
  type:           number,
  index:          number,
  count:          number,
  timestamp:      number,
  delay:          number,
  sampleInterval: number,
  offset:         number,
  multiplier:     number,
  samples:        number[],
}

interface behaviourDebug {
  time                : number
  sunrise             : number
  sunset              : number
  overrideState       : number
  behaviourState      : number
  aggregatedState     : number
  dimmerPowered       : number
  behaviourEnabled    : number
  activeBehaviours    : boolean[]
  activeEndConditions : boolean[]
  behavioursInTimeoutPeriod: boolean[]
  storedBehaviours    : boolean[]
  presenceProfile_0   : boolean[]
  presenceProfile_1   : boolean[]
  presenceProfile_2   : boolean[]
  presenceProfile_3   : boolean[]
  presenceProfile_4   : boolean[]
  presenceProfile_5   : boolean[]
  presenceProfile_6   : boolean[]
  presenceProfile_7   : boolean[]
  presenceProfile_8   : boolean[]
}

type deviceType = 'undefined' | 'plug' | 'guidestone' | 'builtin' | 'crownstoneUSB' | 'builtinOne' | 'hub'

interface crownstoneServiceData {
  opCode?                   : number, // unencrypted type (optional)
  dataType?                 : number, // encrypted type (optional)
  stateOfExternalCrownstone : boolean,
  alternativeState          : boolean,
  hasError                  : boolean,
  setupMode                 : boolean,
  hubMode                   : boolean,
  crownstoneId              : number, // [0 .. 255]
  switchState               : number, // [0 .. 228]
  flagsBitmask?             : number, // bitmask (optional)
  temperature               : number, // °C
  powerFactor               : number, // [-1.0 .. 1.0] __not 0__ (default 1.0)
  powerUsageReal            : number, // W
  powerUsageApparent        : number, // VA
  accumulatedEnergy         : number, // J
  timestamp                 : number, // reconstructed timestamp, -1 if not available, uint16 counter when time is not set

  // bitmask flags
  dimmerReady               : boolean,
  dimmingAllowed            : boolean,
  switchLocked              : boolean,
  timeSet                   : boolean,
  switchCraftEnabled        : boolean,
  tapToToggleEnabled        : boolean,
  behaviourOverridden       : boolean,

  // alternative state items
  assetFiltersCRC           : number,
  assetFiltersMasterVersion : number,
  behaviourEnabled          : boolean,
  behaviourMasterHash       : number,

  hubData                   : number[],

  uartAlive                 : boolean,
  uartAliveEncrypted        : boolean,
  uartEncryptionRequiredByCrownstone : boolean,
  uartEncryptionRequiredByHub        : boolean,
  hubHasBeenSetup           : boolean,
  hubHasInternet            : boolean,
  hubHasError               : boolean,

  deviceType                : deviceType,
  rssiOfExternalCrownstone  : number, // Set to 0 when not external service data.
  errorMode                 : boolean, // True when service data is of type error.
  errors                    : errorData, // Has to be correct when errorMode is true.
  uniqueElement             : number // Partial timestamp, counter, etc. Is this required?


}

interface crownstoneAdvertisementSummary {
  handle : string,
  rssi   : number,
}


interface crownstoneBaseAdvertisement {
  handle              : string,
  name                : string,
  rssi                : number,
  referenceId         : string, // The sphere ID. Only required when advertisement is validated and crownstone is in normal mode
  isInDFUMode         : boolean,
}


interface crownstoneAdvertisement extends crownstoneBaseAdvertisement {
  serviceData         : crownstoneServiceData // must always be present
}


interface ibeaconPackage {
  id    : string, // uuid + "_Maj:" + string(major) + "_Min:" + string(minor)
  uuid  : string, // this is the iBeacon UUID in uppercase: "E621E1F8-C36C-495A-93FC-0C247A3E6E5F"
  major : string, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
  minor : string, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
  rssi  : number,
  referenceId  : string, // The sphere ID, as given in trackIBeacon().
}


// expected response from getErrors
interface errorData {
  overCurrent       : boolean
  overCurrentDimmer : boolean
  temperatureChip   : boolean
  temperatureDimmer : boolean
  dimmerOnFailure   : boolean
  dimmerOffFailure  : boolean
  bitMask           : number // For debug
}


interface clearErrorData {
  overCurrent       : boolean
  overCurrentDimmer : boolean
  temperatureChip   : boolean
  temperatureDimmer : boolean
  dimmerOnFailure   : boolean
  dimmerOffFailure  : boolean
}


interface locationType {
  latitude:  number,
  longitude: number,
}


interface trackingState {
  isMonitoring: boolean, // this means that the lib thinks is it tracking ibeacons, not perse in range. Methods like pauseTracking would stop monitoring. Is used for diagnostics.
  isRanging:    boolean, // this means at least one ibeacon (that is being monitored) is in range and should be generating ibeacon events. If true, the lib thinks it should be sending events, not if it actually is.
}

interface nearestStone  {
  handle    : string,
  rssi      : number,
  setupMode : boolean
  dfuMode   : boolean
  verified  : boolean
}

interface keySet  {
  adminKey:        string,
  memberKey:       string,
  basicKey:        string,
  localizationKey: string,
  serviceDataKey:  string,
  referenceId:     string, // The sphere ID.
  iBeaconUuid:     string,
}

interface crownstoneModes {
  setupMode: boolean,
  dfuMode: boolean,
}

interface setupData {
  crownstoneId:       number,
  sphereId:           number,
  adminKey:           string,
  memberKey:          string,
  basicKey:           string,
  localizationKey:    string,
  serviceDataKey:     string,
  meshNetworkKey:     string,
  meshApplicationKey: string,
  meshDeviceKey:      string,
  ibeaconUUID:        string,
  ibeaconMajor:       number,
  ibeaconMinor:       number,
}

