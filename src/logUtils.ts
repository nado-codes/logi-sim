export const logError = (text: string) => console.log(`\x1b[31m${text}\x1b[0m`); // red
export const logWarning = (text: string) =>
  console.log(`\x1b[33m${text}\x1b[0m`); // yellow
export const logInfo = (text: string) => console.log(`\x1b[36m${text}\x1b[0m`); // cyan
export const logSuccess = (text: string) =>
  console.log(`\x1b[32m${text}\x1b[0m`); // green

export const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
export const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
