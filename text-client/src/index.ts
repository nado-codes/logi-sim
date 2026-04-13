//import { world } from "..";
//import { createMenu } from "../menus/menu";
import axios from "axios";
import { createMenu } from "./menu/menu";

const apiBaseUrl = `http://localhost:3001/api`;
const main = async () => {
  console.log("client started ");

  console.log("fetching player company...");
  // TODO: Phase 6 — replace with proper user→company lookup after login
  const TEMP_PLAYER_COMPANY_NAME = "NadoCo Logistics";
  try {
    const playerCompanyResp = await axios.get(
      `${apiBaseUrl}/company/name/${TEMP_PLAYER_COMPANY_NAME}`,
    );

    if (!playerCompanyResp) {
      throw Error(`Failed to fetch player company`);
    }

    const playerCompany = playerCompanyResp.data;

    console.log("fetched player company:", playerCompanyResp.data);

    const menu = createMenu(
      () => {
        menu.show();
      },
      { companyId: playerCompany.id },
    );
    menu.show();
  } catch (error) {
    console.error(error);
  }

  // .. connect to the server and fetch player information
};
main();
