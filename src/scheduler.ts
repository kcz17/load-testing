import { fail, sleep } from "k6";
import { Response } from "k6/http";
import { randomNumberBetweenIncl } from "./helper";
import { deleteCart } from "./actions";

/**
 * Represents a state in a user behaviour graph.
 */
export interface ModelState {
  /**
   * Runs the corresponding user action for the model state and decides the next
   * action.
   * @returns The next state for the scheduler to run.
   */
  run(): ModelState;
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
 * Decides whether a user should end their journey based on waiting times.
 *
 * @param responses - Responses which affect the user's decision.
 */
export function sampleShouldUserAttrite(responses: Response[]): boolean {
  if (responses.length === 0) {
    return false;
  }

  const maxResponseTime =
    Math.max(...responses.map((r) => r.timings.duration)) / 1000;

  // Sample attrition based on a linear line starting from ~10% chance of
  // attrition at 3s, rising to ~30% chance of attrition at 10s.
  return (
    maxResponseTime >= 3 &&
    Math.random() <= (2.86 * maxResponseTime + 1.43) / 100
  );
}

/**
 * Schedules {@link ModelState}s.
 */
export class Scheduler {
  static run(
    start: ModelState,
    waitTimeSampler: () => number = defaultWaitTimeSampler
  ): void {
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

      nextState = nextState.run();
    }

    // Delete the cart as the last action.
    deleteCart();
  }
}
