import { Options } from "k6/options";
import { NUM_SEEDED_USERS } from "./config";
import { getCredentials } from "./credentials";
import * as actions from "./actions";
import { check, fail } from "k6";

// To seed all users at once, set MAX_VUS to NUM_SEEDED_USERS.
const MAX_VUS = 100;

const iterations = NUM_SEEDED_USERS / MAX_VUS;
if (iterations % 1 != 0) {
  throw `NUM_SEEDED_USERS must divide MAX_VUS cleanly.`;
}

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    seed: {
      executor: "per-vu-iterations",
      exec: "seed",
      vus: MAX_VUS,
      iterations: iterations,
      maxDuration: "1h30m",
    },
  },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function seed() {
  const id = __ITER * MAX_VUS + __VU - 1;
  const credentials = getCredentials(id);

  const registerRes = actions.register(
    credentials.username,
    credentials.password
  );
  const isRegisteredSuccessfully = !check(registerRes, {
    "registers successfully": (r) => r.status === 200,
  });
  if (isRegisteredSuccessfully) {
    fail(`Could not register ID ${id}`);
  }

  const res = actions.addPersonalDetails();
  const isResponseNormal = check(res, {
    "address added successfully": (r) => r.addressesResponse.status === 200,
    "card added successfully": (r) => r.cardsResponse.status === 200,
  });
  if (!isResponseNormal) {
    fail(`Could not add personal details for ${id}`);
  }
}
