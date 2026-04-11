import * as fs from "fs";
import path from "path";

export function loadConfig<T extends Record<string, any>>(
  configName: string,
  defaultConfig: T,
) {
  const _path = path.resolve(`config/${configName}-config.json`);

  if (!fs.existsSync(_path)) {
    fs.writeFileSync(_path, JSON.stringify(defaultConfig, null, 2), "utf-8");
  } else {
    const config = fs.readFileSync(_path, "utf-8");
    const configJson = JSON.parse(config);

    if (
      Object.keys(defaultConfig).some(
        (c) => !Object.keys(configJson).includes(c),
      )
    ) {
      const configWithDefault = {
        ...defaultConfig,
        ...configJson,
      };

      fs.writeFileSync(
        _path,
        JSON.stringify(configWithDefault, null, 2),
        "utf-8",
      );
    }
  }

  const config = fs.readFileSync(_path, "utf-8");
  return { ...defaultConfig, ...(JSON.parse(config) as T) };
}
