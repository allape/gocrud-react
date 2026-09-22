export type FalseToStop = false | boolean | void;

export type Promisable<T> = T | Promise<T>;

export function cut(value: string, sep: string = ":"): [string, string] {
  const index = value.indexOf(sep);
  if (index === -1) {
    return [value, ""];
  }
  return [value.slice(0, index), value.slice(index + 1)];
}
