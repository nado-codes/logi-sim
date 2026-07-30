import * as fs from "fs";
import path from "path";

export function loadJSON<T extends Record<string, any>>(
  fileName: string,
  defaultData: T,
): Record<string, any> {
  const _path = path.resolve(`data/${fileName}.json`);

  if (!fs.existsSync(_path)) {
    fs.writeFileSync(_path, JSON.stringify(defaultData, null, 2), "utf-8");
  } else {
    const data = fs.readFileSync(_path, "utf-8");
    const dataJson = JSON.parse(data);

    if (
      Object.keys(defaultData).some((c) => !Object.keys(dataJson).includes(c))
    ) {
      const dataWithDefault = {
        ...defaultData,
        ...dataJson,
      };

      fs.writeFileSync(
        _path,
        JSON.stringify(dataWithDefault, null, 2),
        "utf-8",
      );
    }
  }

  const data = fs.readFileSync(_path, "utf-8");
  return { ...defaultData, ...(JSON.parse(data) as T) };
}
