export const clamp = (value: number, min: number, max: number) => {
  if (max <= min) {
    throw Error(
      `[CLAMP ERROR]: max must be greater than min (v: ${value}, mn: ${min}, mx: ${max})`,
    );
  }
  return Math.min(Math.max(min, value), max);
};

export function sum(array: number[]) {
  return array.reduce((a, c) => a + c, 0);
}
