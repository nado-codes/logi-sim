import { loadConfig } from "./utils/configUtils";

interface ISystemConfig {
  tickRateMS: number;
  hourTicks: number;
  hourMS: number;
  dayTicks: number;
  dayMS: number;
  weekTicks: number;
  weekMS: number;
  monthTicks: number;
  monthMS: number;
  yearTicks: number;
  yearMS: number;
}

const defaultTickRateMS = 500;
const defaultDayTicks = 10;
const defaultConfig: ISystemConfig = {
  tickRateMS: defaultTickRateMS,
  hourTicks: defaultDayTicks / 24,
  hourMS: (defaultDayTicks * defaultTickRateMS) / 24,
  dayTicks: defaultDayTicks,
  dayMS: defaultDayTicks * defaultTickRateMS,
  weekTicks: defaultDayTicks * 7,
  weekMS: defaultDayTicks * defaultTickRateMS * 7,
  monthTicks: defaultDayTicks * 28,
  monthMS: defaultDayTicks * defaultTickRateMS * 28,
  yearTicks: defaultDayTicks * 365,
  yearMS: defaultDayTicks * defaultTickRateMS * 365,
};

export const loadSystemConfig = () => loadConfig("system", defaultConfig);
