export function negate<T extends (this: any, ...args: any[]) => boolean>(predicate: T): T {
  return function (this: any, ...args: any[]) {
    return !predicate.apply(this, args);
  } as T;
}
