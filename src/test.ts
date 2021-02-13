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
      vus: 5,
      duration: "10s",
      tags: { scenario: "buying" },
    },
    browsing: {
      executor: "constant-vus",
      exec: "browsing",
      vus: 5,
      duration: "10s",
      tags: { scenario: "browsing" },
    },
    news: {
      executor: "constant-vus",
      exec: "news",
      vus: 5,
      duration: "10s",
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
  actions.register();
  actions.visitUpdates();
  let catalogue = actions.visitCatalogue();

  // If a recommendation exists, visit the item, add the item to cart
  // with a specified probability, then return to the catalogue page.
  if (catalogue.recommendationId) {
    actions.visitItem(catalogue.recommendationId);

    if (Math.random() <= RECOMMENDATION_CHECKOUT_PROBABILITY) {
      actions.addArbitraryItemToCart();
    }

    catalogue = actions.visitCatalogue();
  }

  // Click on a random item on the catalogue page.
  actions.visitItem(randomElement(catalogue.itemIds));
  actions.addArbitraryItemToCart();
  actions.visitCart();
  actions.addPersonalDetails();
  actions.checkOutCart();

  sleep(1);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function browsing() {
  actions.visitHomepage();

  let catalogue = actions.visitCatalogue();

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
  actions.visitUpdates();
  sleep(1);
}
