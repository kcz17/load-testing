import * as actions from "../actions";
import { endState, ModelState } from "../scheduler";
import { check } from "k6";
import { randomElement } from "../helper";

const homepageState: ModelState = {
  run(): ModelState {
    const isResponseNormal = check(actions.visitHomepage().homepageResponse, {
      "index.html loads": (r) => r.status === 200,
    });

    return isResponseNormal ? catalogueState : endState;
  },
};

const catalogueState: ModelState = {
  run(): ModelState {
    const response = actions.visitCatalogue();

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(response, {
      "category.html loads": (r) => r.categoryResponse.status === 200,
      "tags load": (r) => r.tagsResponse.status === 200,
      "catalogue items load": (r) => r.catalogueWithPageResponse.status === 200,
    });
    if (!isResponseNormal) {
      return endState;
    }

    const catalogue = actions.parseCatalogueResponse(response);

    const BROWSES_ITEM_PROBABILITY = 0.3;
    if (Math.random() <= BROWSES_ITEM_PROBABILITY) {
      return new ItemState(randomElement(catalogue.itemIds));
    } else {
      return endState;
    }
  },
};

class ItemState implements ModelState {
  constructor(private itemId: string) {}

  run(): ModelState {
    const response = actions.visitItem(this.itemId);

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(response, {
      "item.html loads": (r) => r.itemStaticResponse.status === 200,
      "item loads": (r) => r.itemDBResponse.status === 200,
    });
    if (!isResponseNormal) {
      return endState;
    }

    const RETURN_TO_CATALOGUE_PROBABILITY = 0.5;
    if (Math.random() <= RETURN_TO_CATALOGUE_PROBABILITY) {
      return catalogueState;
    } else {
      return endState;
    }
  }
}

export const startState = homepageState;
