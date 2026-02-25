export const logError = (text: string) => console.log(`\x1b[31m${text}\x1b[0m`); // red
export const logWarning = (text: string) =>
  console.log(`\x1b[33m${text}\x1b[0m`); // yellow
export const logInfo = (text: string) => console.log(`\x1b[36m${text}\x1b[0m`); // cyan
export const logSuccess = (text: string) =>
  console.log(`\x1b[32m${text}\x1b[0m`); // green

export const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  white: (text: string) => `\x1b[37m${text}\x1b[0m`,
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,

  // Bright variants if you want them
  brightRed: (text: string) => `\x1b[91m${text}\x1b[0m`,
  brightYellow: (text: string) => `\x1b[93m${text}\x1b[0m`,
  brightCyan: (text: string) => `\x1b[96m${text}\x1b[0m`,
  brightGreen: (text: string) => `\x1b[92m${text}\x1b[0m`,
} as const;
