import { ICompanyEntity } from "../entities/company";
import { IContract } from "../entities/contract";
import { IWorldEntity, WorldEntityType } from "../entities/entity";
import { GEOGRAPHY_TYPE, IGeographicEntity } from "../entities/geography";
import { CONSUMER_TYPE } from "../entities/locations/consumer";
import { IBaseLocation, LOCATION_TYPE } from "../entities/locations/location";
import { ITruck, IVehicle, VEHICLE_TYPE } from "../entities/truck";
import { IWorldState } from "../entities/world";
import { Color, highlight } from "../utils/logUtils";
import { getCompanyById, getCompanyByIdOrNull } from "./companies";
import { getContractByLocationIdOrNull } from "./contracts";
import { getWorldEntityByPositionOrNull } from "./entities";
import {
  getLocationByIdOrNull,
  getLocationByPositionOrNull,
} from "./locations/locations";
import { getTruckByPositionOrNull } from "./trucks";

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
      map += "_";
    }

    if (spaces > 0) {
      spaces--;
    }
  }

  return map;
};
