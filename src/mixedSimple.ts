import { Options } from "k6/options";
import { Counter } from "k6/metrics";
import * as profiles from "./profiles";
import { Scheduler } from "./scheduler";
import { startState } from "./models/news";

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    // buying: {
    //   executor: "constant-vus",
    //   exec: "buying",
    //   vus: 1,
    //   duration: "3m",
    //   tags: { scenario: "buying" },
    // },
    // browsing: {
    //   executor: "constant-vus",
    //   exec: "browsing",
    //   vus: 1,
    //   duration: "3m",
    //   tags: { scenario: "browsing" },
    // },
    news: {
      executor: "constant-vus",
      exec: "news",
      vus: 1,
      duration: "3m",
      tags: { scenario: "news" },
    },
  },
};

const itemsCheckedOutCounter = new Counter("items_checked_out");

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function buying() {
  profiles.buying(itemsCheckedOutCounter);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function browsing() {
  profiles.browsing();
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function news() {
  Scheduler.run(startState);
}
