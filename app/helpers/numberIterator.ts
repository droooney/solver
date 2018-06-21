Number.prototype[Symbol.iterator] = function* (): Iterator<number> {
  if (!Number.isInteger(+this) || this < 0) {
    throw new Error('Cannot iterate over float and negative numbers');
  }

  for (let i = 0; i < this; i++) {
    yield i;
  }
};

interface Number {
  [Symbol.iterator]: () => Iterator<number>;
}
