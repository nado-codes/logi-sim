export class Road {
  startX: Number = 0;
  startY: Number = 0;
  endX: Number = 0;
  endY: Number = 0;

  constructor(startX: Number, startY: Number, endX: Number, endY: Number) {
    if (startX == endX && startY == endY) {
      throw Error(
        `[ERROR] Roads need to go somewhere sX${startX} eX${endX} sY${startY} eY${endY}`,
      );
    } else if (startX != endX && startY != endY) {
      throw Error(
        `[ERROR] Roads need to be straight sX${startX} eX${endX} sY${startY} eY${endY}`,
      );
    }

    console.log(
      `[ROAD] Created road sX${startX} eX${endX} sY${startY} eY${endY}`,
    );
  }
}
