import * as actions from "../actions";
import { endState, ModelState, sampleShouldUserAttrite } from "../scheduler";
import { check } from "k6";
import { randomElement } from "../helper";
import { Counter } from "k6/metrics";

export class BrowsingContext {
  constructor(private attritionCounter: Counter) {}

  incrementAttritionCounter(state: string): void {
    this.attritionCounter.add(1, { scenario: "browsing", state });
  }
}

class HomepageState implements ModelState {
  constructor(private context: BrowsingContext) {}

  run(): ModelState {
    const res = actions.visitHomepage();

    const isResponseNormal = check(res.homepageResponse, {
      "index.html loads": (r) => r.status === 200,
    });
    if (!isResponseNormal) {
      return endState;
    }

    if (sampleShouldUserAttrite([res.homepageResponse])) {
      this.context.incrementAttritionCounter("homepage");
      return endState;
    }

    return new CatalogueState(this.context);
  }
}

class CatalogueState implements ModelState {
  constructor(private context: BrowsingContext) {}

  run(): ModelState {
    const res = actions.visitCatalogue();

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(res, {
      "category.html loads": (r) => r.categoryResponse.status === 200,
      "tags load": (r) => r.tagsResponse.status === 200,
      "catalogue items load": (r) => r.catalogueWithPageResponse.status === 200,
    });
    if (!isResponseNormal) {
      return endState;
    }

    const shouldUserAttrite = sampleShouldUserAttrite([
      res.categoryResponse,
      res.tagsResponse,
      res.catalogueWithPageResponse,
    ]);
    if (shouldUserAttrite) {
      this.context.incrementAttritionCounter("catalogue");
      return endState;
    }

    const catalogue = actions.parseCatalogueResponse(res);
    const catalogueHasErr = !check(catalogue.hasItemParsingError, {
      "catalogue items parsed correctly": (hasErr) => !hasErr,
    });
    if (catalogueHasErr) {
      this.context.incrementAttritionCounter("catalogue_parsing_error");
      return endState;
    }

    const BROWSES_ITEM_PROBABILITY = 0.3;
    if (Math.random() <= BROWSES_ITEM_PROBABILITY) {
      return new ItemState(this.context, randomElement(catalogue.itemIds));
    } else {
      return endState;
    }
  }
}

class ItemState implements ModelState {
  constructor(private context: BrowsingContext, private itemId: string) {}

  run(): ModelState {
    const res = actions.visitItem(this.itemId);

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(res, {
      "item.html loads": (r) => r.itemStaticResponse.status === 200,
      "item loads": (r) => r.itemDBResponse.status === 200,
    });
    if (!isResponseNormal) {
      return endState;
    }

    const shouldUserAttrite = sampleShouldUserAttrite([
      res.itemStaticResponse,
      res.itemDBResponse,
    ]);
    if (shouldUserAttrite) {
      this.context.incrementAttritionCounter("item");
      return endState;
    }

    const RETURN_TO_CATALOGUE_PROBABILITY = 0.5;
    if (Math.random() <= RETURN_TO_CATALOGUE_PROBABILITY) {
      return new CatalogueState(this.context);
    } else {
      return endState;
    }
  }
}

export const BrowsingStartState = HomepageState;
