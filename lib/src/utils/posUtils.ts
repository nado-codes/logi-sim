import { Pos3D } from "../entities";

export const positionsAreEqual = (A: Pos3D, B: Pos3D) => {
  return A.x === B.x && A.y === B.y && A.z === B.z;
};

export const getDistanceBetweenPositions = (A: Pos3D, B: Pos3D): number => {
  const x2 = (A.x - B.x) ** 2;
  const y2 = (A.y - B.y) ** 2;
  const z2 = (A.z - B.z) ** 2;
  return Math.sqrt(x2 + y2 + z2);
};

export const getVectorBetweenPositions = (A: Pos3D, B: Pos3D): Pos3D => {
  return {
    x: B.x - A.x,
    y: B.y - A.y,
    z: B.z - A.z,
  };
};

export const normaliseVector = (vector: Pos3D): Pos3D => {
  const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
  if (magnitude === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
    z: vector.z / magnitude,
  };
};
