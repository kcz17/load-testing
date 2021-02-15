import { sleep } from "k6";
import { Options } from "k6/options";
import * as actions from "./actions";
import {
  BROWSES_ITEM_PROBABILITY,
  RECOMMENDATION_CHECKOUT_PROBABILITY,
} from "./config";
import { randomElement, randomNumberBetweenIncl } from "./helper";

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  scenarios: {
    buying: {
      executor: "constant-vus",
      exec: "buying",
      vus: 2,
      duration: "20s",
      tags: { scenario: "buying" },
    },
    browsing: {
      executor: "constant-vus",
      exec: "browsing",
      vus: 4,
      duration: "20s",
      tags: { scenario: "browsing" },
    },
    news: {
      executor: "constant-vus",
      exec: "news",
      vus: 2,
      duration: "20s",
      tags: { scenario: "news" },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function setup() {
  // TODO: Register the user using options.vus and
  // https://community.k6.io/t/how-do-i-parameterize-my-k6-test/26/2
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function buying() {
  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(2, 5));

  actions.register();
  sleep(randomNumberBetweenIncl(1, 2));

  // If a recommendation exists, visit the item, add the item to cart
  // with a specified probability, then return to the catalogue page.
  let catalogue = actions.visitCatalogue();
  if (catalogue.recommendationId) {
    sleep(randomNumberBetweenIncl(1, 2));

    actions.visitItem(catalogue.recommendationId);
    sleep(randomNumberBetweenIncl(2, 5));

    if (Math.random() <= RECOMMENDATION_CHECKOUT_PROBABILITY) {
      actions.addArbitraryItemToCart();
    }

    catalogue = actions.visitCatalogue();
  }

  // Click on a random item on the catalogue page.
  actions.visitItem(randomElement(catalogue.itemIds));
  sleep(randomNumberBetweenIncl(2, 5));
  actions.addArbitraryItemToCart();
  sleep(randomNumberBetweenIncl(2, 5));
  actions.visitCart();
  sleep(randomNumberBetweenIncl(2, 5));
  actions.addPersonalDetails();
  sleep(randomNumberBetweenIncl(2, 5));
  actions.checkOutCart();
  sleep(randomNumberBetweenIncl(2, 5));
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function browsing() {
  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(2, 5));

  let catalogue = actions.visitCatalogue();
  sleep(randomNumberBetweenIncl(2, 5));

  // Calculate the number of pages.
  const pages = Math.ceil(catalogue.total / catalogue.itemIds.length);
  for (let page = 1; page <= pages; page++) {
    catalogue = actions.visitCatalogue(page);
    sleep(randomNumberBetweenIncl(3, 7));

    while (Math.random() <= BROWSES_ITEM_PROBABILITY) {
      actions.visitItem(randomElement(catalogue.itemIds));
      sleep(randomNumberBetweenIncl(3, 7));
      catalogue = actions.visitCatalogue(page);
    }
  }

  sleep(1);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function news() {
  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(2, 5));
  actions.visitUpdates();
  sleep(randomNumberBetweenIncl(2, 5));
}
