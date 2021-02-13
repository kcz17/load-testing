/**
 * @file Provides functions modelling the user's browser requests to backend
 * endpoints when actions such as page loads and button presses are performed.
 * Only XHR requests are modelled: we assume other resources served from the
 * frontend are insignificant, particularly due to frontend caching.
 *
 * It is up to the caller to decide whether each function is being called
 * appropriately in a user cycle and that Sock Shop's bugs will not be
 * encountered.
 */

import { fail, group } from "k6";
import http from "k6/http";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL, ITEMS_FOR_CHECKOUT } from "./config";
import { randomElement } from "./helper";

/**
 * Loads the homepage without further clicks.
 */
export function visitHomepage(): void {
  group("visit homepage", function () {
    http.get(BASE_URL);
    http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "catalogue?size=5"],
      ["GET", BASE_URL + "cart"],
    ]);
  });
}

/**
 * Registers and logs in the user.
 */
export function register(): void {
  const username = uuidv4();
  const password = "password";
  http.post(
    BASE_URL + "register",
    JSON.stringify({
      username: username,
      password: password,
      email: `${username}@example.com`,
      firstName: username,
      lastName: username,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

export interface CatalogueResponse {
  readonly itemIds: string[];
  readonly total: number;
  readonly recommendationId?: string;
}

// noinspection JSUnusedAssignment
/**
 * Loads the catalogue page without further clicks.
 */
export function visitCatalogue(page = 1): CatalogueResponse {
  let catalogueResponse: CatalogueResponse;

  group("visit catalogue", function () {
    http.get(BASE_URL + "category.html");
    const response = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "catalogue/size?tags="],
      ["GET", BASE_URL + "tags"],
      ["GET", BASE_URL + "recommender"],
      // @ts-ignore Allow use of http.url, which is missing from types.d.ts.
      // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51195
      ["GET", http.url`${BASE_URL}catalogue?page=${page}&size=6&tags=`],
      ["GET", BASE_URL + "cart"],
    ]);

    let itemIds: string[] = [];
    if (response[6].status === 200) {
      itemIds = response[6].json("#.id") as string[];
      if (itemIds.length === 0) {
        fail("expected catalogue contains items; actually received none");
      }
    }

    let total = 0;
    if (response[3].status === 200) {
      total = response[5].json("size") as number;
    }

    let recommendationId = undefined;
    if (response[5].status === 200) {
      recommendationId = response[5].json("id") as string;
    }

    catalogueResponse = { itemIds, total, recommendationId };
  });

  // @ts-ignore: Disable use-before-assign warning as k6 (as of v.0.30.0) runs
  // the anonymous function synchronously.
  return catalogueResponse;
}

/**
 * Loads the news/updates page without further clicks.
 */
export function visitUpdates(): void {
  group("visit updates", function () {
    http.get(BASE_URL + "news.html");
    http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "news"],
      ["GET", BASE_URL + "cart"],
    ]);
  });
}

/**
 * Loads an item's page without further clicks.
 */
export function visitItem(id: string): void {
  group("visit item", function () {
    // @ts-ignore Allow use of http.url, which is missing from types.d.ts.
    // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51195
    http.get(http.url`${BASE_URL}detail.html?id=${id}`);
    http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      // @ts-ignore Allow use of http.url, which is missing from types.d.ts.
      // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51195
      ["GET", http.url`${BASE_URL}catalogue/${id}`],
      ["GET", BASE_URL + "recommender"],
      ["GET", BASE_URL + "catalogue?size=3"],
      ["GET", BASE_URL + "cart"],
    ]);
  });
}

/**
 * Adds an item from {@link ITEMS_FOR_CHECKOUT} to the cart, simulating the
 * check out of a desired item. We hardcode the items for checkout to prevent
 * a Sock Shop bug where the checkout has a maximum allowed value. We choose
 * from more than one item to mitigate potential caching effects.
 */
export function addArbitraryItemToCart(): void {
  const itemId = randomElement(ITEMS_FOR_CHECKOUT);
  http.post(BASE_URL + "cart", JSON.stringify({ id: itemId }), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Loads the cart page without further clicks.
 */
export function visitCart(): void {
  group("visit cart", function () {
    http.get(BASE_URL + "basket.html");
    http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "cart"],
      ["GET", BASE_URL + "card"],
      ["GET", BASE_URL + "address"],
      ["GET", BASE_URL + "catalogue?size=3"],
      ["GET", BASE_URL + "cart"],
    ]);
  });
}

/**
 * Adds address and card details for the user.
 */
export function addPersonalDetails(): void {
  http.post(
    BASE_URL + "addresses",
    JSON.stringify({
      number: "1",
      street: "1",
      city: "1",
      postcode: "1",
      country: "1",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  http.post(
    BASE_URL + "cards",
    JSON.stringify({
      longNum: "1234123412341234",
      expires: "01/25",
      ccv: "123",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Checks out the cart, ensuring that Sock Shop's "bug" of requiring personal
 * details to be filled out is fulfilled.
 */
export function checkOutCart(): void {
  http.post(BASE_URL + "orders");
  http.del(BASE_URL + "cart");
}
