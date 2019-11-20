interface bchReturnType {
  data: any,
  viaMesh?: boolean
}


interface multiSwitchPayload {
  handle: string,
  stoneId: string,
  crownstoneId: string,
  commandUuid: string,
  state: number,
  intent: number,
  timestamp: number,
  options: batchCommandEntryOptions,
  timeout: number,
  attempts: number,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?)  : void,
    pending: boolean
  }
}

// key is sphereId
interface sphereMeshNetworks  {
  [propName: string] : meshNetworks
}

// key is meshNetwork
interface meshNetworks  {
  [propName: number] : meshTodo
}

interface connectionInfo  {
  sphereId :      string,
  stoneId:        string,
  stone:          any,
  meshNetworkId?: string,
  handle :        string,
}

interface meshTodo {
  keepAlive:      keepAlivePayload[],
  keepAliveState: keepAliveStatePayload[],
  multiSwitch:    multiSwitchPayload[]
}

type commandInterface = { commandName : 'toggle', stateForOn : number } |
  { commandName : 'multiSwitch', state : number, timeout : number, intent: number } |
  { commandName : 'getBootloaderVersion' } |
  { commandName : 'getFirmwareVersion' } |
  { commandName : 'getHardwareVersion' } |
  { commandName : 'keepAliveBatchCommand' } |
  { commandName : 'saveBehaviour', behaviour: behaviourTransfer } |
  { commandName : 'updateBehaviour', behaviour: behaviourTransfer } |
  { commandName : 'removeBehaviour', index: number } |
  { commandName : 'getBehaviour', index: number } |
  { commandName : 'commandFactoryReset' } |
  { commandName : 'sendNoOp' } |
  { commandName : 'sendMeshNoOp' } |
  { commandName : 'getTime' } |
  { commandName : 'meshSetTime', time: number } |
  { commandName : 'setTime', time: number } |
  { commandName : 'clearErrors', clearErrorJSON: any } |
  { commandName : 'clearSchedule', scheduleEntryIndex: number } |
  { commandName : 'lockSwitch',     value: boolean } |
  { commandName : 'setSwitchCraft', value: boolean } |
  { commandName : 'allowDimming',   value: boolean } |
  { commandName : 'setTapToToggle', value: boolean } |
  { commandName : 'setTapToToggleThresholdOffset', rssiOffset: number } |
  { commandName : 'setMeshChannel', channel: number } |
  { commandName : 'setupPulse'}

interface commandSummary {
  stone     : any,
  stoneId   : string,
  sphereId  : string,
  command   : commandInterface,
  priority  : boolean,
  attempts  : number,
  options   : batchCommandEntryOptions,
}


interface batchCommands  {
  [propName: string] : batchCommandEntry
}

// keys are sphereIds
interface directCommands  {
  [propName: string] : batchCommandEntry[]
}

interface batchCommandEntry {
  priority:    boolean,
  handle:      string,
  sphereId:    string,
  stoneId:     string,
  timestamp:   number,
  attempts:    number,
  options:     batchCommandEntryOptions,
  command:     commandInterface,
  commandUuid: string,
  cleanup():   void,
  promise:{
    resolve(any?) : void,
    reject(any?) :  void,
    pending:        boolean,
  }
}

interface batchCommandEntryOptions {
  keepConnectionOpen?: boolean,
  keepConnectionOpenTimeout?: number, // ms
  onlyAllowDirectCommand?: boolean,
}

interface incomingAdvertisementTopics {
  sphereId: string,
  stoneId: string,
  topic: string,
}

interface crownstoneTopicData {
  handle: string,
  stone: any,
  stoneId: stoneId,
  sphereId: sphereId,
  rssi: number,
  meshNetworkId?: string
}

interface targetData {
  [propName: stoneId]: sphereId
}