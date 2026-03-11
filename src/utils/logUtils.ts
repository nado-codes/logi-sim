export const logError = (text: string) => console.log(`\x1b[31m${text}\x1b[0m`); // red
export const logWarning = (text: string) =>
  console.log(`\x1b[33m${text}\x1b[0m`); // yellow
export const logInfo = (text: string) => console.log(`\x1b[36m${text}\x1b[0m`); // cyan
export const logSuccess = (text: string) =>
  console.log(`\x1b[32m${text}\x1b[0m`); // green

export enum Color {
  Red = "31m",
  Yellow = "33m",
  Cyan = "36m",
  Green = "32m",
  Blue = "34m",
  Magenta = "35m",
  White = "37m",
  Gray = "90m",
  BrightRed = "91m",
  BrightYellow = "93m",
  BrightCyan = "96m",
  BrightGreen = "92m",
}

export const highlight = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  white: (text: string) => `\x1b[37m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,

  brightRed: (text: string) => `\x1b[91m${text}\x1b[0m`,
  brightYellow: (text: string) => `\x1b[93m${text}\x1b[0m`,
  brightCyan: (text: string) => `\x1b[96m${text}\x1b[0m`,
  brightGreen: (text: string) => `\x1b[92m${text}\x1b[0m`,

  custom: (text: string, color: Color) => `\x1b[${color}${text}\x1b[0m`,
} as const;
