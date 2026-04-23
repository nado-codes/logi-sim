import { highlight } from "@logisim/lib/utils";
import { IMenuPage, createMenuPage } from "../menu";
import axios from "axios";

export const createViewLogsPage = (apiBaseUrl: string): IMenuPage => {
  return createMenuPage("Logs", false, [], async () => {
    try {
      const logs = (await axios.get(`${apiBaseUrl}/logs`)).data;

      logs.forEach((logEntry: any) => {
        console.log(
          `${highlight.yellow(logEntry.timestamp + "")} | ${logEntry.entry}`,
        );
      });
    } catch (error) {
      console.log(highlight.error(`Failed to load logs: ${error}`));
    }
  });
};
