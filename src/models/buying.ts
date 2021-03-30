import { Counter } from "k6/metrics";
import { endState, ModelState, sampleShouldUserAttrite } from "../scheduler";
import * as actions from "../actions";
import { check, fail, sleep } from "k6";
import { randomElement, randomNumberBetweenIncl } from "../helper";
import { getCredentials } from "../credentials";

/**
 * Keeps track of session state in order to handle user behaviour edge cases
 * which cannot be represented by a user behaviour graph.
 */
export class User {
  isLoggedIn = false;
  itemsCheckedOut = 0;
  recommendationsCheckedOut = 0;

  hasItemsInCart(): boolean {
    return this.itemsCheckedOut > 0;
  }
}

export class BuyingContext {
  hasVisitedRecommendation = false;

  constructor(
    public user: User,
    private itemsCheckedOutCounter: Counter,
    private recommendationsCheckedOutCounter: Counter,
    private attritionCounter: Counter
  ) {}

  incrementItemsCheckedOutCounter(quantity: number): void {
    this.itemsCheckedOutCounter.add(quantity);
  }

  incrementRecommendationsCheckedOutCounter(quantity: number): void {
    this.recommendationsCheckedOutCounter.add(quantity);
  }

  incrementAttritionCounter(state: string): void {
    this.attritionCounter.add(1, { scenario: "buying", state });
  }
}

class HomepageState implements ModelState {
  constructor(private context: BuyingContext) {}

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

    return new CatalogueState(this.context);
  }
}

class CatalogueState implements ModelState {
  constructor(private context: BuyingContext) {}

  run(): ModelState {
    const res = actions.visitCatalogue();

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(res, {
      "category.html loads": (r) => r.categoryResponse.status === 200,
      "tags load": (r) => r.tagsResponse.status === 200,
      "catalogue items load": (r) => r.catalogueWithPageResponse.status === 200,
    });
    if (!isResponseNormal) return endState;

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

    if (catalogue.recommendationId && !this.context.hasVisitedRecommendation) {
      this.context.hasVisitedRecommendation = true;
      return new RecommendationDetourState(
        this.context,
        catalogue.recommendationId,
        this
      );
    }

    const BROWSES_ITEM_PROBABILITY = 0.8;
    if (Math.random() <= BROWSES_ITEM_PROBABILITY) {
      return new ItemState(this.context, randomElement(catalogue.itemIds));
    } else {
      // The user does not wish to browse more items, so go to the checkout if
      // they have added items to cart. Otherwise, leave the website.
      return this.context.user.hasItemsInCart()
        ? new VisitCartState(this.context)
        : endState;
    }
  }
}

class ItemState implements ModelState {
  constructor(private context: BuyingContext, private itemId: string) {}

  run(): ModelState {
    const res = actions.visitItem(this.itemId);

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(res, {
      "item.html loads": (r) => r.itemStaticResponse.status === 200,
      "item loads": (r) => r.itemDBResponse.status === 200,
    });
    if (!isResponseNormal) return endState;

    const shouldUserAttrite = sampleShouldUserAttrite([
      res.itemStaticResponse,
      res.itemDBResponse,
    ]);
    if (shouldUserAttrite) {
      this.context.incrementAttritionCounter("item");
      return endState;
    }

    // User looks at the item and decides whether to check out the item.
    sleep(randomNumberBetweenIncl(1, 2));
    const CHECK_OUT_PROBABILITY = 0.8;
    if (Math.random() <= CHECK_OUT_PROBABILITY) {
      const addRes = actions.addArbitraryItemToCart();
      if (!check(addRes, { "item adds to cart": (r) => r.status === 201 })) {
        return endState;
      }

      if (sampleShouldUserAttrite([addRes])) {
        this.context.incrementAttritionCounter("item_add");
        return endState;
      }
      this.context.user.itemsCheckedOut++;
    }

    const RETURN_TO_CATALOGUE_PROBABILITY = 0.2;
    if (Math.random() <= RETURN_TO_CATALOGUE_PROBABILITY) {
      return new CatalogueState(this.context);
    } else {
      // The user does not wish to return to catalogue, so go to the checkout if
      // they have added items to cart. Otherwise, leave the website.
      return this.context.user.hasItemsInCart()
        ? new VisitCartState(this.context)
        : endState;
    }
  }
}

class VisitCartState implements ModelState {
  constructor(private context: BuyingContext) {}

  run(): ModelState {
    if (!this.context.user.hasItemsInCart()) {
      fail(
        "VisitCartState.run() expected user to have items in cart; no items added."
      );
    }

    const res = actions.visitCart();

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(res, {
      "basket.html loads": (r) => r.basketResponse.status === 200,
      "card loads": (r) => r.cardResponse.status === 200,
      "address loads": (r) => r.addressResponse.status === 200,
      "cart items load": (r) => r.cartResponse.status === 200,
    });
    if (!isResponseNormal) return endState;

    const shouldUserAttrite = sampleShouldUserAttrite([
      res.basketResponse,
      res.cardResponse,
      res.addressResponse,
      res.cartResponse,
    ]);
    if (shouldUserAttrite) {
      this.context.incrementAttritionCounter("cart");
      return endState;
    }

    // If the user hasn't been previously logged in and added their personal
    // details, do so now.
    if (!this.context.user.isLoggedIn) {
      const credentials = getCredentials(__VU);
      const res = actions.login(credentials.username, credentials.password);
      const isResponseNormal = check(res, {
        "logged in successfully": (r) => r.status === 200,
      });
      if (!isResponseNormal) return endState;

      if (sampleShouldUserAttrite([res])) {
        this.context.incrementAttritionCounter("cart_login");
        return endState;
      }

      this.context.user.isLoggedIn = true;
    }

    return new CheckOutCartState(this.context);
  }
}

class CheckOutCartState implements ModelState {
  constructor(private context: BuyingContext) {}

  run(): ModelState {
    const res = actions.checkOutCart();

    const isResponseNormal = check(res, {
      "order is created": (r) => r.ordersResponse.status === 201,
      "cart is emptied": (r) => r.cartResponse.status === 202,
    });

    if (isResponseNormal) {
      this.context.incrementItemsCheckedOutCounter(
        this.context.user.itemsCheckedOut
      );
      this.context.incrementRecommendationsCheckedOutCounter(
        this.context.user.recommendationsCheckedOut
      );
    }

    return endState;
  }
}

class RecommendationDetourState implements ModelState {
  constructor(
    private context: BuyingContext,
    private itemId: string,
    private nextState: ModelState
  ) {}

  run(): ModelState {
    const res = actions.visitItem(this.itemId);

    // The user gives up if essential page items do not load.
    const isResponseNormal = check(res, {
      "item.html loads": (r) => r.itemStaticResponse.status === 200,
      "item loads": (r) => r.itemDBResponse.status === 200,
    });
    if (!isResponseNormal) return endState;

    const shouldUserAttrite = sampleShouldUserAttrite([
      res.itemStaticResponse,
      res.itemDBResponse,
    ]);
    if (shouldUserAttrite) {
      this.context.incrementAttritionCounter("recommendation");
      return endState;
    }

    // User looks at the item and decides whether to check out the item.
    sleep(randomNumberBetweenIncl(1, 2));
    const RECOMMENDATION_CHECKOUT_PROBABILITY = 0.8;
    if (Math.random() <= RECOMMENDATION_CHECKOUT_PROBABILITY) {
      const addRes = actions.addArbitraryItemToCart();
      if (!check(addRes, { "item adds to cart": (r) => r.status === 201 })) {
        return endState;
      }

      if (sampleShouldUserAttrite([addRes])) {
        this.context.incrementAttritionCounter("recommendation_add");
        return endState;
      }
      this.context.user.recommendationsCheckedOut++;
      this.context.user.itemsCheckedOut++;
    }

    return this.nextState;
  }
}

export const BuyingStartState = HomepageState;
