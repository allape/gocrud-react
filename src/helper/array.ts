export function newSet<T = unknown>(values: T[]): T[] {
  return Array.from(new Set(values));
}
