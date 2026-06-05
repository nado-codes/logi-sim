import { Pos3D } from "../entities";
import seedrandom from "seedrandom";

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

let rng = seedrandom();

export const setGlobalSeed = (seed: string) => {
  rng = seedrandom(seed);
};

export const random = () => rng();
