import { group, sleep } from "k6";
import { Options } from "k6/options";
import http, { RefinedResponse, ResponseType } from "k6/http";

const HOST = __ENV.K6_HOST ?? "localhost";
const PORT = __ENV.K6_PORT ?? 80;
const BASE_URL = `http://${HOST}:${PORT}/`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
function noop(): void {}

export const options: Options = {
  vus: 50,
  duration: "10s",
};

function visitHomepage() {
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

function visitCatalogue(cb: () => void = noop) {
  group("visit catalogue", function () {
    http.get(BASE_URL + "category.html");
    http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "size?tags="],
      ["GET", BASE_URL + "tags"],
      ["GET", BASE_URL + "recommender"],
      ["GET", BASE_URL + "catalogue?page=1&size=6&tags="],
      ["GET", BASE_URL + "cart"],
    ]);
    cb();
  });
}

function visitUpdates(
  cb: (a: RefinedResponse<ResponseType | undefined>) => void = noop
) {
  group("visit updates", function () {
    http.get(BASE_URL);
    const response = http.batch([
      ["GET", BASE_URL + "topbar.html"],
      ["GET", BASE_URL + "navbar.html"],
      ["GET", BASE_URL + "footer.html"],
      ["GET", BASE_URL + "news"],
      ["GET", BASE_URL + "cart"],
    ]);
    cb(response[4]);
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function setup() {
  // TODO: Register the user using options.vus and
  // https://community.k6.io/t/how-do-i-parameterize-my-k6-test/26/2
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => {
  visitHomepage();
  visitCatalogue();
  visitUpdates();

  sleep(1);
};
