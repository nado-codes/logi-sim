import * as fs from "fs";
import path from "path";

export const loadJSON = (filePath: string): Record<string,any> => {
  const _path = path.resolve(filePath);

  if (!fs.existsSync(_path)) {
    throw new Error(`File at path ${_path} does not exist.`);
  }

  const fileData = fs.readFileSync(_path, "utf-8");
  const fileJson = JSON.parse(fileData);
  
  return fileJson;
}