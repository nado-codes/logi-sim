import * as fs from "fs";
import path from "path";

export function loadConfig<T>(CONFIG_PATH: string, defaultConfig: T) {
  const _path = path.resolve(CONFIG_PATH);

  if (!fs.existsSync(_path)) {
    fs.writeFileSync(_path, JSON.stringify(defaultConfig, null, 2), "utf-8");
  }

  const config = fs.readFileSync(_path, "utf-8");
  return { ...defaultConfig, ...(JSON.parse(config) as T) };
}
