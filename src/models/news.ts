import * as actions from "../actions";
import { endState, ModelState, sampleShouldUserAttrite } from "../scheduler";
import { check } from "k6";
import { Counter } from "k6/metrics";

export class NewsContext {
  constructor(private attritionCounter: Counter) {}

  incrementAttritionCounter(state: string): void {
    this.attritionCounter.add(1, { scenario: "news", state });
  }
}

class HomepageState implements ModelState {
  constructor(private context: NewsContext) {}

  run(): ModelState {
    const res = actions.visitHomepage().homepageResponse;
    const isResponseNormal = check(res, {
      "index.html loads": (r) => r.status === 200,
    });
    if (!isResponseNormal) {
      return endState;
    }

    if (sampleShouldUserAttrite([res])) {
      this.context.incrementAttritionCounter("homepage");
      return endState;
    }

    return new NewsState(this.context);
  }
}

class NewsState implements ModelState {
  constructor(private context: NewsContext) {}

  run(): ModelState {
    const res = actions.visitUpdates();
    check(res, {
      "news.html loads": (r) => r.newsStaticResponse.status === 200,
      "news entries load": (r) => r.newsDBResponse.status === 200,
    });
    if (sampleShouldUserAttrite([res.newsStaticResponse, res.newsDBResponse])) {
      this.context.incrementAttritionCounter("news");
    }
    return endState;
  }
}

export const NewsStartState = HomepageState;
