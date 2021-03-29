import { Options } from "k6/options";
import { Counter } from "k6/metrics";
import { Scheduler } from "./scheduler";
import { BrowsingContext, BrowsingStartState } from "./models/browsing";
import { NewsContext, NewsStartState } from "./models/news";
import { BuyingContext, BuyingStartState, User } from "./models/buying";

const GLOBAL_SCALE = 15;
const RAMP_UP_TIME = "10s";
const CONSTANT_TIME = "5m";
const scaleBuying = (target: number) => Math.floor(GLOBAL_SCALE * target);
const scaleBrowsing = (target: number) => Math.floor(2 * GLOBAL_SCALE * target);
const scaleNews = (target: number) => Math.floor(0.5 * GLOBAL_SCALE * target);

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    buying: {
      executor: "ramping-vus",
      exec: "buying",
      startVUs: 0,
      gracefulRampDown: "0s",
      gracefulStop: "0s",
      stages: [
        { duration: RAMP_UP_TIME, target: scaleBuying(10) },
        { duration: CONSTANT_TIME, target: scaleBuying(10) },
      ],
      tags: { scenario: "buying" },
    },
    browsing: {
      executor: "ramping-vus",
      exec: "browsing",
      startVUs: 0,
      gracefulRampDown: "0s",
      gracefulStop: "0s",
      stages: [
        { duration: RAMP_UP_TIME, target: scaleBrowsing(10) },
        { duration: CONSTANT_TIME, target: scaleBrowsing(10) },
      ],
      tags: { scenario: "browsing" },
    },
    news: {
      executor: "ramping-vus",
      exec: "news",
      startVUs: 0,
      gracefulRampDown: "0s",
      gracefulStop: "0s",
      stages: [
        { duration: RAMP_UP_TIME, target: scaleNews(10) },
        { duration: CONSTANT_TIME, target: scaleNews(10) },
      ],
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
