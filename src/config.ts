const HOST = __ENV.K6_HOST ?? "localhost";
const PORT = __ENV.K6_PORT ?? 80;
export const BASE_URL = `http://${HOST}:${PORT}/`;

export const NUM_SEEDED_USERS = 1000;

interface Item {
  readonly id: string;
  readonly price: number;
}

// We hardcode items which can be ordered to overcome a bug where carts with
// value >=$99.99 cannot be checked out.
export const ITEMS_FOR_CHECKOUT: Item[] = [
  { id: "510a0d7e-8e83-4193-b483-e27e09ddc34d", price: 15.0 },
  { id: "837ab141-399e-4c1f-9abc-bace40296bac", price: 15.0 },
  { id: "819e1fbf-8b7e-4f6d-811f-693534916a8b", price: 18.0 },
];
