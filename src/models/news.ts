import * as actions from "../actions";
import { endState, ModelState } from "../scheduler";
import { check } from "k6";

const homepageState: ModelState = {
  run(): ModelState {
    const isResponseNormal = check(actions.visitHomepage().homepageResponse, {
      "index.html loads": (r) => r.status === 200,
    });

    return isResponseNormal ? newsState : endState;
  },
};

const newsState: ModelState = {
  run(): ModelState {
    check(actions.visitUpdates(), {
      "news.html loads": (r) => r.newsStaticResponse.status === 200,
      "news entries load": (r) => r.newsDBResponse.status === 200,
    });
    return endState;
  },
};

export const startState = homepageState;
