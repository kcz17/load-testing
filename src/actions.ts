/**
 * @file Provides functions modelling the user's browser requests to backend
 * endpoints when actions such as page loads and button presses are performed.
 * Only XHR requests are modelled: we assume other resources served from the
 * frontend are insignificant, particularly due to frontend caching.
 *
 * Some visit functions, like {@link visitCatalogue}, may take in a callback
 * function as a parameter which will be called once k6/http activities are
 * complete. This allows additional actions to be performed with the data
 * made available after these k6/http activities are complete.
 *
 * Callback functions must only pass relevant data back to the callee.
 */

import { group } from "k6";
import http, { RefinedResponse, ResponseType } from "k6/http";
import { BASE_URL } from "./config";

/**
 * Placeholder for response callbacks.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop(): void {}

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

export interface CatalogueResponse {
  readonly recommenderResponse: RefinedResponse<ResponseType | undefined>;
}

export function visitCatalogue(
  responseHandler: (response: CatalogueResponse) => void = noop
): void {
  group("visit catalogue", function () {
    http.get(BASE_URL + "category.html");
    const response = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "size?tags="],
      ["GET", BASE_URL + "tags"],
      ["GET", BASE_URL + "recommender"],
      ["GET", BASE_URL + "catalogue?page=1&size=6&tags="],
      ["GET", BASE_URL + "cart"],
    ]);

    responseHandler({
      recommenderResponse: response[5],
    });
  });
}

export function visitUpdates(): void {
  group("visit updates", function () {
    http.get(BASE_URL);
    http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "news"],
      ["GET", BASE_URL + "cart"],
    ]);
  });
}
