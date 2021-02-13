/**
 * Returns a random element from an array.
 */
export function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomNumberBetweenIncl(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
