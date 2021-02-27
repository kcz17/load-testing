import { Counter } from "k6/metrics";
import * as actions from "./actions";
import { sleep } from "k6";
import { randomElement, randomNumberBetweenIncl } from "./helper";
import {
  BROWSES_ITEM_PROBABILITY,
  RECOMMENDATION_CHECKOUT_PROBABILITY,
} from "./config";

export function buying(itemsCheckedOutCounter: Counter): void {
  let itemsCheckedOut = 0;

  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(1, 2));

  actions.register();
  sleep(randomNumberBetweenIncl(1, 2));

  // If a recommendation exists, visit the item, add the item to cart
  // with a specified probability, then return to the catalogue page.
  let catalogue = actions.parseCatalogueResponse(actions.visitCatalogue());
  if (catalogue.recommendationId) {
    sleep(randomNumberBetweenIncl(1, 2));

    actions.visitItem(catalogue.recommendationId);
    sleep(randomNumberBetweenIncl(1, 2));

    if (Math.random() <= RECOMMENDATION_CHECKOUT_PROBABILITY) {
      actions.addArbitraryItemToCart();
      itemsCheckedOut++;
    }

    catalogue = actions.parseCatalogueResponse(actions.visitCatalogue());
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

export function browsing(): void {
  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(1, 2));

  let catalogue = actions.parseCatalogueResponse(actions.visitCatalogue());
  sleep(randomNumberBetweenIncl(1, 2));

  // Calculate the number of pages.
  const pages = Math.ceil(catalogue.total / catalogue.itemIds.length);
  for (let page = 1; page <= pages; page++) {
    catalogue = actions.parseCatalogueResponse(actions.visitCatalogue(page));
    sleep(randomNumberBetweenIncl(1, 2));

    while (Math.random() <= BROWSES_ITEM_PROBABILITY) {
      actions.visitItem(randomElement(catalogue.itemIds));
      sleep(randomNumberBetweenIncl(1, 2));
      catalogue = actions.parseCatalogueResponse(actions.visitCatalogue(page));
    }
  }

  sleep(1);
}

export function news(): void {
  actions.visitHomepage();
  sleep(randomNumberBetweenIncl(1, 2));

  actions.visitUpdates();
  sleep(randomNumberBetweenIncl(1, 2));
}
