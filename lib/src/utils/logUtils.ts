import { Vector3 } from "../entities";
import { Color } from "./color";

interface LogEntry {
  timestamp: string;
  entry: string;
}

export const logEntries: LogEntry[] = [];

const log = (entry: string) => {
  console.log(entry);

  const now = new Date(Date.now());

  const hours = now.getHours(); // 0-23
  const minutes = now.getMinutes(); // 0-59
  const seconds = now.getSeconds(); // 0-59

  logEntries.push({ timestamp: `${hours}:${minutes}:${seconds}`, entry });
};
export const logError = (text: string | number) => {
  const entry = `\x1b[31m${text}\x1b[0m`; // red
  log(entry);
};
export const logWarning = (text: string | number) => {
  const entry = `\x1b[33m${text}\x1b[0m`; // yellow
  log(entry);
};
export const logInfo = (text: string | number) => {
  const entry = `\x1b[36m${text}\x1b[0m`; // cyan
  log(entry);
};
export const logSuccess = (text: string | number) => {
  const entry = `\x1b[32m${text}\x1b[0m`; // green
  log(entry);
};

export const positionToString = (position: Vector3) =>
  `(${position.x},${position.y},${position.z})`;

export const highlight = {
  red: (text: string | number) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string | number) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string | number) => `\x1b[36m${text}\x1b[0m`,
  green: (text: string | number) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string | number) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string | number) => `\x1b[35m${text}\x1b[0m`,
  white: (text: string | number) => `\x1b[37m${text}\x1b[0m`,
  gray: (text: string | number) => `\x1b[90m${text}\x1b[0m`,

  brightRed: (text: string | number) => `\x1b[91m${text}\x1b[0m`,
  brightYellow: (text: string | number) => `\x1b[93m${text}\x1b[0m`,
  brightCyan: (text: string | number | number) => `\x1b[96m${text}\x1b[0m`,
  brightGreen: (text: string | number) => `\x1b[92m${text}\x1b[0m`,

  custom: (text: string | number, color: Color) =>
    `\x1b[${color}${text}\x1b[0m`,
  success: (text: string | number) => highlight.green(text),
  error: (text: string | number) => highlight.red(text),
  warning: (text: string | number) => highlight.yellow(text),
} as const;
