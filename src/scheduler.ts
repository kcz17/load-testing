import { fail, sleep } from "k6";
import { randomNumberBetweenIncl } from "./helper";

/**
 * Keeps track of session state in order to handle user behaviour edge cases
 * which cannot be represented by a user behaviour graph.
 */
export class User {
  is_logged_in = false;
  is_personal_details_added = false;
  cart_total = 0.0;
}

/**
 * Represents a state in a user behaviour graph.
 */
export interface ModelState {
  /**
   * Runs the corresponding user action for the model state and decides the next
   * action.
   * @returns The next state for the scheduler to run.
   */
  run(user: User): ModelState;
}

/**
 * Signals that no further states must be run. The EndState itself must not be
 * run.
 */
export const endState: ModelState = {
  run(): ModelState {
    fail("Scheduler called endState.run(); expected no further behaviour.");
  },
};

// We expect a mean time of five seconds per page is a sensible estimate
// across the entire website.
export const defaultWaitTimeSampler = (): number =>
  randomNumberBetweenIncl(2, 7);

/**
 * Schedules {@link ModelState}s.
 */
export class Scheduler {
  static run(
    start: ModelState,
    waitTimeSampler: () => number = defaultWaitTimeSampler
  ): void {
    const user = new User();

    let nextState = start;
    let hasStarted = false;
    while (nextState !== endState) {
      // Skip waiting on the first iteration. Sleep before running the state as
      // we do not want to sleep after receiving an EndState.
      if (hasStarted) {
        sleep(waitTimeSampler());
      } else {
        hasStarted = true;
      }

      nextState = nextState.run(user);
    }
  }
}
