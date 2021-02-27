import * as actions from "../actions";
import { EndState, ModelState } from "../scheduler";

export class HomepageState implements ModelState {
  run(): ModelState {
    actions.visitHomepage();
    return new NewsState();
  }
}

class NewsState implements ModelState {
  run(): ModelState {
    actions.visitUpdates();
    return new EndState();
  }
}
