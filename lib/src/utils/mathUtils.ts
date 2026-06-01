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

export const positionsAreEqual = (A: Pos3D, B: Pos3D) => {
  return A.x === B.x && A.y === B.y && A.z === B.z;
};

export const getDistanceBetweenPositions = (A: Pos3D, B: Pos3D): number => {
  const x2 = Math.abs(A.x - B.x) ^ 2;
  const y2 = Math.abs(A.y - B.y) ^ 2;
  const z2 = Math.abs(A.z - B.z) ^ 2;
  return Math.sqrt(x2 + y2 + z2);
};

let rng = seedrandom();

export const setGlobalSeed = (seed: string) => {
  rng = seedrandom(seed);
};

export const random = () => rng();
