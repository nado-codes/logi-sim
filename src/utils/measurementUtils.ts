import { loadConfig } from "./configUtils";

interface IMeasurementConfig {
  distanceUnit: string;
  weightUnit: string;
  tickUnit: string;
  currency: string;
  distanceScale: number;
}

const defaultConfig: IMeasurementConfig = {
  distanceUnit: "km",
  weightUnit: "kg",
  tickUnit: "hr",
  currency: "$",
  distanceScale: 0.1,
};

export const measurementConfig = loadConfig("measurement", defaultConfig);
