import { Options } from "k6/options";
import { Counter } from "k6/metrics";
import { Scheduler } from "./scheduler";
import { BrowsingContext, BrowsingStartState } from "./models/browsing";
import { NewsContext, NewsStartState } from "./models/news";
import { BuyingContext, BuyingStartState, User } from "./models/buying";

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    scenario: {
      executor: "externally-controlled",
      exec: "scenario",
      // vus will be ramped up externally.
      vus: 0,
      // maxVUs is higher than the VUs to be trained with.
      maxVUs: 100,
      // Duration is higher than the training duration.
      duration: "60m",
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
  // The externally-controlled runner only allows for one scenario, so we
  // sample scenarios based on probabilities corresponding to
  // mixedConstantRamping.ts.
  const probabilityBuying = 1 / 3.5;
  const probabilityBrowsing = 2 / 3.5;
  // @ts-ignore Include unused variable for visibility.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const probabilityNews = 0.5 / 3.5;

  const sampler = Math.random();
  if (sampler <= probabilityBuying) {
    buying();
  } else if (sampler <= probabilityBuying + probabilityBrowsing) {
    browsing();
  } else {
    news();
  }
}

function buying(): void {
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

function browsing(): void {
  Scheduler.run(new BrowsingStartState(new BrowsingContext(attritionCounter)));
}

function news(): void {
  Scheduler.run(new NewsStartState(new NewsContext(attritionCounter)));
}
