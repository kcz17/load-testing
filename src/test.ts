import { sleep } from "k6";
import { Options } from "k6/options";
import * as actions from "./actions";

export const options: Options = {
  vus: 50,
  duration: "10s",
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function setup() {
  // TODO: Register the user using options.vus and
  // https://community.k6.io/t/how-do-i-parameterize-my-k6-test/26/2
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => {
  actions.visitHomepage();
  actions.visitCatalogue();
  actions.visitUpdates();

  sleep(1);
};
