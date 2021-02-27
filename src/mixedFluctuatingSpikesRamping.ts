import { Options } from "k6/options";
import { Counter } from "k6/metrics";
import * as profiles from "./profiles";
import { Scheduler } from "./scheduler";
import { HomepageState } from "./models/news";

const GLOBAL_SCALE = 250;
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
      stages: [
        { duration: "15s", target: scaleBuying(2) },
        { duration: "30s", target: scaleBuying(10) },
        { duration: "40s", target: scaleBuying(10) },
        { duration: "20s", target: scaleBuying(2) },
        { duration: "1s", target: scaleBuying(10) },
        { duration: "200s", target: scaleBuying(10) },
        { duration: "1s", target: scaleBuying(1) },
        { duration: "20s", target: scaleBuying(1) },
      ],
      tags: { scenario: "buying" },
    },
    browsing: {
      executor: "ramping-vus",
      exec: "browsing",
      startVUs: 0,
      gracefulRampDown: "0s",
      stages: [
        { duration: "15s", target: scaleBrowsing(2) },
        { duration: "30s", target: scaleBrowsing(10) },
        { duration: "40s", target: scaleBrowsing(10) },
        { duration: "20s", target: scaleBrowsing(2) },
        { duration: "1s", target: scaleBrowsing(10) },
        { duration: "200s", target: scaleBrowsing(10) },
        { duration: "1s", target: scaleBrowsing(1) },
        { duration: "20s", target: scaleBrowsing(1) },
      ],
      tags: { scenario: "browsing" },
    },
    news: {
      executor: "ramping-vus",
      exec: "news",
      startVUs: 0,
      gracefulRampDown: "0s",
      stages: [
        { duration: "15s", target: scaleNews(2) },
        { duration: "30s", target: scaleNews(10) },
        { duration: "40s", target: scaleNews(10) },
        { duration: "20s", target: scaleNews(2) },
        { duration: "1s", target: scaleNews(10) },
        { duration: "200s", target: scaleNews(10) },
        { duration: "1s", target: scaleNews(1) },
        { duration: "20s", target: scaleNews(1) },
      ],
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
  Scheduler.run(new HomepageState());
}
