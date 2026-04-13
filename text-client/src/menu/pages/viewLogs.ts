import { createMenuPage, IMenuPage } from "../menu";

import { highlight, logEntries } from "../../../../lib/src/utils/logUtils";

export const createViewLogsPage = (): IMenuPage => {
  return createMenuPage("Logs", false, [], () => {
    logEntries.forEach((logEntry) => {
      console.log(
        `Tick ${highlight.yellow(logEntry.tick + "")} | ${logEntry.entry}`,
      );
    });
  });
};
