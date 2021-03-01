import { Options } from "k6/options";
import { Counter } from "k6/metrics";
import { Scheduler } from "./scheduler";
import { BrowsingContext, BrowsingStartState } from "./models/browsing";
import { NewsContext, NewsStartState } from "./models/news";
import { BuyingContext, BuyingStartState, User } from "./models/buying";

const GLOBAL_SCALE = 0.2;
const scaleBuying = (target: number) => Math.floor(GLOBAL_SCALE * target);
const scaleBrowsing = (target: number) => Math.floor(2 * GLOBAL_SCALE * target);
const scaleNews = (target: number) => Math.floor(0.5 * GLOBAL_SCALE * target);

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    buying: {
      executor: "ramping-arrival-rate",
      exec: "buying",
      preAllocatedVUs: 3 * scaleBuying(100),
      maxVUs: 3000,
      startRate: scaleBuying(10),
      stages: [
        { duration: "30s", target: scaleBuying(10) },
        { duration: "200s", target: scaleBuying(10) },
        { duration: "20s", target: scaleBuying(1) },
      ],
      tags: { scenario: "buying" },
    },
    browsing: {
      executor: "ramping-arrival-rate",
      exec: "browsing",
      preAllocatedVUs: 3 * scaleBrowsing(100),
      maxVUs: 3000,
      startRate: scaleBrowsing(10),
      stages: [
        { duration: "30s", target: scaleBrowsing(10) },
        { duration: "200s", target: scaleBrowsing(10) },
        { duration: "20s", target: scaleBrowsing(1) },
      ],
      tags: { scenario: "browsing" },
    },
    news: {
      executor: "ramping-arrival-rate",
      exec: "news",
      preAllocatedVUs: 3 * scaleNews(100),
      maxVUs: 3000,
      startRate: scaleNews(10),
      stages: [
        { duration: "30s", target: scaleNews(10) },
        { duration: "200s", target: scaleNews(10) },
        { duration: "20s", target: scaleNews(1) },
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
