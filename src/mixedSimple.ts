import { Options } from "k6/options";
import { Counter } from "k6/metrics";
import { Scheduler } from "./scheduler";
import { BrowsingContext, BrowsingStartState } from "./models/browsing";
import { NewsContext, NewsStartState } from "./models/news";
import { BuyingStartState, BuyingContext, User } from "./models/buying";

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    buying: {
      executor: "constant-vus",
      exec: "buying",
      vus: 1,
      duration: "3m",
      tags: { scenario: "buying" },
    },
    browsing: {
      executor: "constant-vus",
      exec: "browsing",
      vus: 1,
      duration: "3m",
      tags: { scenario: "browsing" },
    },
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
const recommendationsCheckedOutCounter = new Counter(
  "recommendations_checked_out"
);
const attritionCounter = new Counter("attrition");

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function buying() {
  Scheduler.run(
    new BuyingStartState(
      new BuyingContext(
        new User(),
        itemsCheckedOutCounter,
        recommendationsCheckedOutCounter,
        attritionCounter
      )
    )
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function browsing() {
  Scheduler.run(new BrowsingStartState(new BrowsingContext(attritionCounter)));
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function news() {
  Scheduler.run(new NewsStartState(new NewsContext(attritionCounter)));
}
