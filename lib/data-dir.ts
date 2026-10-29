import fs from "node:fs";

/** One plain sentence if the data folder cannot be used, otherwise null. Never throws and never prints a stack trace. */
export function dataDirProblem(dir: string): string | null {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return null;
  } catch {
    return `The data folder "${dir}" is missing or not writable, so enquiries and listings cannot be saved. Set MIRAS_DATA_DIR to a folder this user can write to.`;
  }
}
