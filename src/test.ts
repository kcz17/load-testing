import { sleep } from "k6";
import { Options } from "k6/options";
import * as actions from "./actions";
import {
  BROWSES_ITEM_PROBABILITY,
  RECOMMENDATION_CHECKOUT_PROBABILITY,
} from "./config";
import { randomElement, randomNumberBetweenIncl } from "./helper";
import { Counter } from "k6/metrics";

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    buying: {
      executor: "ramping-vus",
      exec: "buying",
      startVUs: 0,
      gracefulRampDown: "1s",
      stages: [
        { duration: "15s", target: 20 },
        { duration: "30s", target: 100 },
        { duration: "40s", target: 100 },
        { duration: "20s", target: 20 },
        { duration: "1s", target: 100 },
        { duration: "20s", target: 100 },
        { duration: "1s", target: 10 },
        { duration: "20s", target: 10 },
      ],
      tags: { scenario: "buying" },
    },
    browsing: {
      executor: "ramping-vus",
      exec: "browsing",
      startVUs: 0,
      gracefulRampDown: "1s",
      stages: [
        { duration: "15s", target: 40 },
        { duration: "30s", target: 200 },
        { duration: "40s", target: 200 },
        { duration: "20s", target: 40 },
        { duration: "1s", target: 200 },
        { duration: "20s", target: 200 },
        { duration: "1s", target: 20 },
        { duration: "20s", target: 20 },
      ],
      tags: { scenario: "browsing" },
    },
    news: {
      executor: "ramping-vus",
      exec: "news",
      startVUs: 0,
      gracefulRampDown: "1s",
      stages: [
        { duration: "15s", target: 10 },
        { duration: "30s", target: 50 },
        { duration: "40s", target: 50 },
        { duration: "20s", target: 10 },
        { duration: "1s", target: 50 },
        { duration: "20s", target: 50 },
        { duration: "1s", target: 5 },
        { duration: "20s", target: 5 },
      ],
      tags: { scenario: "news" },
    },
  },
};

const itemsCheckedOutCounter = new Counter("items_checked_out");

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function buying() {
  let itemsCheckedOut = 0;

  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(1, 2));

  actions.register();
  sleep(randomNumberBetweenIncl(1, 2));

  // If a recommendation exists, visit the item, add the item to cart
  // with a specified probability, then return to the catalogue page.
  let catalogue = actions.visitCatalogue();
  if (catalogue.recommendationId) {
    sleep(randomNumberBetweenIncl(1, 2));

    actions.visitItem(catalogue.recommendationId);
    sleep(randomNumberBetweenIncl(1, 2));

    if (Math.random() <= RECOMMENDATION_CHECKOUT_PROBABILITY) {
      actions.addArbitraryItemToCart();
      itemsCheckedOut++;
    }

    catalogue = actions.visitCatalogue();
  }

  // Click on a random item on the catalogue page.
  actions.visitItem(randomElement(catalogue.itemIds));
  sleep(randomNumberBetweenIncl(1, 2));

  actions.addArbitraryItemToCart();
  sleep(randomNumberBetweenIncl(1, 2));
  itemsCheckedOut++;

  actions.visitCart();
  sleep(randomNumberBetweenIncl(1, 2));

  actions.addPersonalDetails();
  sleep(randomNumberBetweenIncl(1, 2));

  actions.checkOutCart();
  sleep(randomNumberBetweenIncl(1, 2));
  itemsCheckedOutCounter.add(itemsCheckedOut);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function browsing() {
  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(1, 2));

  let catalogue = actions.visitCatalogue();
  sleep(randomNumberBetweenIncl(1, 2));

  // Calculate the number of pages.
  const pages = Math.ceil(catalogue.total / catalogue.itemIds.length);
  for (let page = 1; page <= pages; page++) {
    catalogue = actions.visitCatalogue(page);
    sleep(randomNumberBetweenIncl(1, 2));

    while (Math.random() <= BROWSES_ITEM_PROBABILITY) {
      actions.visitItem(randomElement(catalogue.itemIds));
      sleep(randomNumberBetweenIncl(1, 2));
      catalogue = actions.visitCatalogue(page);
    }
  }

  sleep(1);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function news() {
  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(1, 2));

  actions.visitUpdates();
  sleep(randomNumberBetweenIncl(1, 2));
}
