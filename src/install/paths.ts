import * as os from "os";
import * as path from "path";

export function expandPath(inputPath: string): string {
  let expanded = inputPath;

  if (expanded.includes("%APPDATA%")) {
    const appData =
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    expanded = expanded.replace(/%APPDATA%/g, appData);
  }

  if (expanded.includes("%USERPROFILE%")) {
    expanded = expanded.replace(/%USERPROFILE%/g, os.homedir());
  }

  if (expanded.startsWith("~/") || expanded === "~") {
    expanded = path.join(os.homedir(), expanded.slice(1));
  }

  return path.normalize(expanded);
}

export function getAppDataPath(): string {
  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support");
  }
  return path.join(os.homedir(), ".config");
}

export function getCodeUserPath(): string {
  return path.join(getAppDataPath(), "Code", "User");
}
