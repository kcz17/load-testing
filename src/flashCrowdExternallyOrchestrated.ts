import { Options } from "k6/options";
import { Counter } from "k6/metrics";
import { Scheduler } from "./scheduler";
import { BrowsingContext, BrowsingStartState } from "./models/browsing";
import { NewsContext, NewsStartState } from "./models/news";
import { BuyingContext, BuyingStartState, User } from "./models/buying";

const MIN_VUS = Number(__ENV.MIN_VUS ?? 100);
const MAX_VUS = Number(__ENV.MAX_VUS ?? 300);
const TROUGH_TIME = __ENV.TROUGH_TIME ?? "2m";
const RAMP_TIME = __ENV.RAMP_TIME ?? "2m";
const PEAK_TIME = __ENV.PEAK_TIME ?? "2m";

const OUTPUT_PATH = __ENV.K6_OUTPUT_PATH ?? "";
if (OUTPUT_PATH == "") {
  throw new Error("OUTPUT_PATH environment variable must be specified.");
}

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    buying: {
      executor: "ramping-vus",
      exec: "scenario",
      startVUs: 0,
      gracefulRampDown: "0s",
      gracefulStop: "0s",
      stages: [
        { duration: TROUGH_TIME, target: MIN_VUS },
        { duration: RAMP_TIME, target: MAX_VUS },
        { duration: PEAK_TIME, target: MAX_VUS },
        { duration: RAMP_TIME, target: MIN_VUS },
        { duration: TROUGH_TIME, target: MIN_VUS },
        { duration: RAMP_TIME, target: MAX_VUS },
        { duration: PEAK_TIME, target: MAX_VUS },
        { duration: RAMP_TIME, target: MIN_VUS },
        { duration: TROUGH_TIME, target: MIN_VUS },
      ],
    },
  },
};

const itemsCheckedOutCounter = new Counter("items_checked_out");
const recommendationsCheckedOutCounter = new Counter(
  "recommendations_checked_out"
);
const attritionCounter = new Counter("attrition");

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function scenario() {
  const probabilityBuying = 2 / 7;
  const probabilityBrowsing = 4 / 7;
  // @ts-ignore Include unused variable for visibility.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const probabilityNews = 1 / 7;

  const sampler = (__VU % 7) / 7;
  if (sampler < probabilityBuying) {
    buying();
  } else if (sampler < probabilityBuying + probabilityBrowsing) {
    browsing();
  } else {
    news();
  }
}

function buying() {
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

function browsing() {
  Scheduler.run(new BrowsingStartState(new BrowsingContext(attritionCounter)));
}

function news() {
  Scheduler.run(new NewsStartState(new NewsContext(attritionCounter)));
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function handleSummary(data: unknown) {
  const output: Record<string, string> = {};
  output[OUTPUT_PATH] = JSON.stringify(data);
  return output;
}
