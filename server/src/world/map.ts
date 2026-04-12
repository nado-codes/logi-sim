import {
  ICompanyEntity,
  WorldEntityType,
  GEOGRAPHY_TYPE,
  IGeographicEntity,
  CONSUMER_TYPE,
  IBaseLocation,
  LOCATION_TYPE,
  IVehicle,
  VEHICLE_TYPE,
  IWorldState,
  Color,
  highlight,
} from "@logisim/lib";
import { loadConfig } from "../utils/configUtils";
import { getCompanyByIdOrNull } from "./companies";
import { getContractByLocationIdOrNull } from "./contracts";
import { getWorldEntityByPositionOrNull } from "./entities";
import { loadGeographyConfig } from "./geographies";
import { loadTownConfig } from "./locations/consumers/towns";
import { getLocationByIdOrNull } from "./locations/locations";

interface IMapConfig {
  highlightArableLand: boolean;
  highlightTownRadius: boolean;
}

const defaultConfig: IMapConfig = {
  highlightArableLand: true,
  highlightTownRadius: true,
};

const mapConfig = loadConfig("map", defaultConfig);
const geographyConfig = loadGeographyConfig();
const townConfig = loadTownConfig();

type TagDefinition = {
  tag: string;
  color: Color;
};

type MapEntityType =
  | GEOGRAPHY_TYPE
  | LOCATION_TYPE
  | CONSUMER_TYPE
  | VEHICLE_TYPE;

export const TagDictionary: Record<MapEntityType, TagDefinition> = {
  Coastline: { tag: "🏖️", color: Color.Yellow },
  Water: { tag: "🌊", color: Color.Blue },
  Mountain: { tag: "⛰️🏞️", color: Color.Gray },
  ResourceDeposit: { tag: "💎🌲", color: Color.White },
  Producer: { tag: "🌾", color: Color.Cyan },
  Processor: { tag: "🏭", color: Color.Yellow },
  Consumer: { tag: "XX", color: Color.Red },
  Sink: { tag: "XX", color: Color.White },
  Town: { tag: "🏠🏪🏠", color: Color.Red },
  Truck: { tag: "🚚🚛", color: Color.White },
};

export const getMap = (state: IWorldState) => {
  const worldPositions = [
    ...state.getLocations().map((l) => l.position),
    ...state.geographies.map((g) => g.position),
    ...state.trucks.map((t) => t.position),
  ];
  const allWater = state.geographies.filter(
    (g) => g.geographyType === GEOGRAPHY_TYPE.Water,
  );
  const allTowns = state
    .getLocations()
    .filter((l) => l.locationType === LOCATION_TYPE.Town);

  if (worldPositions.length <= 0) {
    return "";
  }

  const maxPosition = worldPositions.reduce((a, c) => Math.max(a, c));

  let map = "";
  let spaces = 0;

  for (var pos = 0; pos <= maxPosition; pos++) {
    const entityAtPos = getWorldEntityByPositionOrNull(state, pos);

    if (entityAtPos) {
      if (entityAtPos.type === WorldEntityType.Geography) {
        const geographyAtPos = entityAtPos as IGeographicEntity;
        const geographyTag = TagDictionary[geographyAtPos.geographyType].tag;

        map += geographyTag;
        spaces += 1;
      } else if (entityAtPos.type === WorldEntityType.Location) {
        const locationAtPos = entityAtPos as IBaseLocation;
        const contract = getContractByLocationIdOrNull(state, locationAtPos.id);
        const locationTag = TagDictionary[locationAtPos.locationType].tag;

        map += `${contract ? "📜" : ""} ${locationTag}`;
        spaces += locationTag.length + (contract ? 1 : 0);
      } else if (entityAtPos.type === WorldEntityType.Vehicle) {
        const vehicleAtPos = entityAtPos as IVehicle;

        const hasResources = vehicleAtPos.storage.resourceCount > 0;
        const destination = getLocationByIdOrNull(
          state,
          vehicleAtPos.destinationId,
        );
        const isMovingLeft =
          !destination?.position ||
          destination?.position < vehicleAtPos.position;
        const vehicleTags = Array.from(
          TagDictionary[vehicleAtPos.vehicleType].tag,
        );
        const directionTag = destination ? (isMovingLeft ? `◀ ` : ` ▶`) : "";
        const vehicleTag = `${isMovingLeft ? directionTag : ""}${hasResources ? vehicleTags[1] : vehicleTags[0]}${!isMovingLeft ? directionTag : ""}`;

        map += vehicleTag;
        spaces += vehicleTag.length;
      }

      const entityCompany = getCompanyByIdOrNull(
        state,
        (entityAtPos as ICompanyEntity).companyId,
      );
      map += ` ${entityCompany ? highlight.custom("■", entityCompany.color) : ""}`;
      spaces += entityCompany ? 2 : 0;

      const entityDebug = `${entityAtPos.debugMessage ? highlight.yellow("[" + entityAtPos.debugMessage + "]") : ""}`;
      map += ` ${entityDebug}`;
      const debugMessageLength = entityAtPos.debugMessage?.length ?? 0;
      spaces += debugMessageLength > 0 ? 1 + debugMessageLength : 0;
    } else if (spaces <= 0) {
      if (
        allWater.some(
          (w) => Math.abs(w.position - pos) < geographyConfig.arableLandRadius,
        ) &&
        mapConfig.highlightArableLand
      ) {
        map += highlight.cyan("_");
      } else if (
        allTowns.some(
          (t) => Math.abs(t.position - pos) < townConfig.townCatchmentRadius,
        ) &&
        mapConfig.highlightArableLand
      ) {
        map += highlight.green("_");
      } else {
        map += "_";
      }
    }

    if (spaces > 0) {
      spaces--;
    }
  }

  return map;
};
