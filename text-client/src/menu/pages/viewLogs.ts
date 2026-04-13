import { logEntries, highlight } from "@logisim/lib/utils";
import { IMenuPage, createMenuPage } from "../menu";

export const createViewLogsPage = (): IMenuPage => {
  return createMenuPage("Logs", false, [], () => {
    logEntries.forEach((logEntry) => {
      console.log(
        `Tick ${highlight.yellow(logEntry.timestamp + "")} | ${logEntry.entry}`,
      );
    });
  });
};
