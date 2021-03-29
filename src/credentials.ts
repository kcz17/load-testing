import { NUM_SEEDED_USERS } from "./config";

const USERNAME_PREFIX = "seededuser";
const PASSWORD = "seededuser";

export interface Credentials {
  readonly username: string;
  readonly password: string;
}

export function getCredentials(id: number): Credentials {
  const userId = Math.round(id);
  if (userId < 0 || userId >= NUM_SEEDED_USERS) {
    throw `expected id in getCredentials(id) in [0, ${NUM_SEEDED_USERS}); got id = ${id}`;
  }

  return {
    username: `${USERNAME_PREFIX}${id}`,
    password: PASSWORD,
  };
}
