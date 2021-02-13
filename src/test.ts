import { fail, sleep } from "k6";
import { Options } from "k6/options";
import * as actions from "./actions";
import { RECOMMENDATION_CHECKOUT_PROBABILITY } from "./config";
import { randomElement } from "./helper";

// noinspection JSUnusedGlobalSymbols
export const options: Options = {
  vus: 10,
  duration: "5s",
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function setup() {
  // TODO: Register the user using options.vus and
  // https://community.k6.io/t/how-do-i-parameterize-my-k6-test/26/2
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => {
  actions.visitHomepage();
  actions.register();
  actions.visitUpdates();

  // Visit the catalogue page.
  let catalogue = actions.visitCatalogue();
  if (catalogue.itemIds.length === 0) {
    fail("expected catalogue contains items; actually received none");
  }

  // If a recommendation exists, visit the item, add the item to cart
  // with a specified probability, then return to the catalogue page.
  if (catalogue.recommendationId) {
    actions.visitItem(catalogue.recommendationId);

    if (Math.random() > RECOMMENDATION_CHECKOUT_PROBABILITY) {
      actions.addArbitraryItemToCart();
    }

    catalogue = actions.visitCatalogue();
    if (catalogue.itemIds.length === 0) {
      fail("expected catalogue contains items; actually received none");
    }
  }

  // Click on a random item on the catalogue page.
  actions.visitItem(randomElement(catalogue.itemIds));
  actions.addArbitraryItemToCart();
  actions.visitCart();
  actions.addPersonalDetails();

  sleep(1);
};
