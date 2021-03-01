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
import http, { Response } from "k6/http";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL, ITEMS_FOR_CHECKOUT } from "./config";
import { randomElement } from "./helper";

export interface VisitHomepageResponse {
  readonly homepageResponse: Response;
  readonly catalogueResponse: Response;
  readonly cartResponse: Response;
}

/**
 * Loads the homepage without further clicks.
 */
export function visitHomepage(): VisitHomepageResponse {
  let response: VisitHomepageResponse;

  group("visit homepage", function () {
    const homepageResponse = http.get(BASE_URL);
    const batchedResponses = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "catalogue?size=5"],
      // Retrieving cart header should not block the rest of the execution.
      ["GET", BASE_URL + "cart", null, { timeout: "3s" }],
    ]);

    response = {
      homepageResponse: homepageResponse,
      catalogueResponse: batchedResponses[3],
      cartResponse: batchedResponses[4],
    };
  });

  // @ts-ignore: Disable use-before-assign warning as k6 (as of v.0.30.0) runs
  // the anonymous function synchronously.
  return response;
}

/**
 * Registers and logs in the user.
 */
export function register(): Response {
  const username = uuidv4();
  const password = "password";
  return http.post(
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

export interface VisitCatalogueResponse {
  readonly categoryResponse: Response;
  readonly catalogueResponse: Response;
  readonly tagsResponse: Response;
  readonly recommenderResponse: Response;
  readonly catalogueWithPageResponse: Response;
  readonly cartResponse: Response;
}

// noinspection JSUnusedAssignment
/**
 * Loads the catalogue page without further clicks.
 */
export function visitCatalogue(page = 1): VisitCatalogueResponse {
  let response: VisitCatalogueResponse;

  group("visit catalogue", function () {
    const categoryResponse = http.get(BASE_URL + "category.html");
    const batchedResponses = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "catalogue/size?tags="],
      ["GET", BASE_URL + "tags"],
      ["GET", BASE_URL + "recommender"],
      // @ts-ignore Allow use of http.url, which is missing from types.d.ts.
      // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51195
      ["GET", http.url`${BASE_URL}catalogue?page=${page}&size=6&tags=`],
      // Retrieving cart header should not block the rest of the execution.
      ["GET", BASE_URL + "cart", null, { timeout: "3s" }],
    ]);

    response = {
      categoryResponse: categoryResponse,
      catalogueResponse: batchedResponses[3],
      tagsResponse: batchedResponses[4],
      recommenderResponse: batchedResponses[5],
      catalogueWithPageResponse: batchedResponses[6],
      cartResponse: batchedResponses[7],
    };
  });

  // @ts-ignore: Disable use-before-assign warning as k6 (as of v.0.30.0) runs
  // the anonymous function synchronously.
  return response;
}

export interface ParsedCatalogueResponse {
  readonly itemIds: string[];
  readonly total: number;
  readonly recommendationId?: string;
}

export function parseCatalogueResponse(
  response: VisitCatalogueResponse
): ParsedCatalogueResponse {
  let itemIds: string[] = [];
  if (response.catalogueWithPageResponse.status === 200) {
    itemIds = response.catalogueWithPageResponse.json("#.id") as string[];
    if (itemIds.length === 0) {
      fail("expected catalogue contains items; actually received none");
    }
  }

  let total = 0;
  if (response.catalogueResponse.status === 200) {
    total = response.catalogueResponse.json("size") as number;
  }

  let recommendationId = undefined;
  if (response.recommenderResponse.status === 200) {
    recommendationId = response.recommenderResponse.json("id") as string;
  }

  return { itemIds, total, recommendationId };
}

export interface VisitUpdatesResponse {
  readonly newsStaticResponse: Response;
  readonly newsDBResponse: Response;
  readonly cartResponse: Response;
}

/**
 * Loads the news/updates page without further clicks.
 */
export function visitUpdates(): VisitUpdatesResponse {
  let response: VisitUpdatesResponse;

  group("visit updates", function () {
    const newsStaticResponse = http.get(BASE_URL + "news.html");
    const batchedResponses = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "news"],
      // Retrieving cart header should not block the rest of the execution.
      ["GET", BASE_URL + "cart", null, { timeout: "3s" }],
    ]);

    response = {
      newsStaticResponse: newsStaticResponse,
      newsDBResponse: batchedResponses[3],
      cartResponse: batchedResponses[4],
    };
  });

  // @ts-ignore: Disable use-before-assign warning as k6 (as of v.0.30.0) runs
  // the anonymous function synchronously.
  return response;
}

export interface VisitItemResponse {
  readonly itemStaticResponse: Response;
  readonly itemDBResponse: Response;
  readonly recommenderResponse: Response;
  readonly catalogueResponse: Response;
  readonly cartResponse: Response;
}

/**
 * Loads an item's page without further clicks.
 */
export function visitItem(id: string): VisitItemResponse {
  let response: VisitItemResponse;

  group("visit item", function () {
    const itemStaticResponse = http.get(
      // @ts-ignore Allow use of http.url, which is missing from types.d.ts.
      // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51195
      http.url`${BASE_URL}detail.html?id=${id}`
    );
    const batchedResponses = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      // @ts-ignore Allow use of http.url, which is missing from types.d.ts.
      // See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51195
      ["GET", http.url`${BASE_URL}catalogue/${id}`],
      ["GET", BASE_URL + "recommender"],
      ["GET", BASE_URL + "catalogue?size=3"],
      // Retrieving cart header should not block the rest of the execution.
      ["GET", BASE_URL + "cart", null, { timeout: "3s" }],
    ]);

    response = {
      itemStaticResponse: itemStaticResponse,
      itemDBResponse: batchedResponses[3],
      recommenderResponse: batchedResponses[4],
      catalogueResponse: batchedResponses[5],
      cartResponse: batchedResponses[6],
    };
  });

  // @ts-ignore: Disable use-before-assign warning as k6 (as of v.0.30.0) runs
  // the anonymous function synchronously.
  return response;
}

/**
 * Adds an item from {@link ITEMS_FOR_CHECKOUT} to the cart, simulating the
 * check out of a desired item. We hardcode the items for checkout to prevent
 * a Sock Shop bug where the checkout has a maximum allowed value. We choose
 * from more than one item to mitigate potential caching effects.
 */
export function addArbitraryItemToCart(): Response {
  const item = randomElement(ITEMS_FOR_CHECKOUT);
  return http.post(BASE_URL + "cart", JSON.stringify({ id: item.id }), {
    headers: { "Content-Type": "application/json" },
  });
}

export interface VisitCartResponse {
  readonly basketResponse: Response;
  readonly cartHeaderResponse: Response;
  readonly cardResponse: Response;
  readonly addressResponse: Response;
  readonly catalogueResponse: Response;
  readonly cartResponse: Response;
}

/**
 * Loads the cart page without further clicks.
 */
export function visitCart(): VisitCartResponse {
  let response: VisitCartResponse;

  group("visit cart", function () {
    const staticResponse = http.get(BASE_URL + "basket.html");
    const batchedResponses = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "cart", null, { timeout: "3s" }],
      ["GET", BASE_URL + "card"],
      ["GET", BASE_URL + "address"],
      ["GET", BASE_URL + "catalogue?size=3"],
      // Retrieving cart header should not block the rest of the execution.
      ["GET", BASE_URL + "cart"],
    ]);

    response = {
      basketResponse: staticResponse,
      cartHeaderResponse: batchedResponses[3],
      cardResponse: batchedResponses[4],
      addressResponse: batchedResponses[5],
      catalogueResponse: batchedResponses[6],
      cartResponse: batchedResponses[7],
    };
  });

  // @ts-ignore: Disable use-before-assign warning as k6 (as of v.0.30.0) runs
  // the anonymous function synchronously.
  return response;
}

export interface AddPersonalDetailsResponse {
  addressesResponse: Response;
  cardsResponse: Response;
}

/**
 * Adds address and card details for the user.
 */
export function addPersonalDetails(): AddPersonalDetailsResponse {
  const addressesResponse = http.post(
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

  const cardsResponse = http.post(
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

  return { addressesResponse, cardsResponse };
}

export interface CheckOutCartResponse {
  ordersResponse: Response;
  cartResponse: Response;
}

/**
 * Checks out the cart, ensuring that Sock Shop's "bug" of requiring personal
 * details to be filled out is fulfilled.
 */
export function checkOutCart(): CheckOutCartResponse {
  const ordersResponse = http.post(BASE_URL + "orders");
  const cartResponse = http.del(BASE_URL + "cart");
  return { ordersResponse, cartResponse };
}
