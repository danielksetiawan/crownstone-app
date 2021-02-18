// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetCrownstoneUptime extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getCrownstoneUptime");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getCrownstoneUptime(this.handle);
  }
  
}

