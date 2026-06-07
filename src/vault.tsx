import { getPreferenceValues } from "@raycast/api";
import { homedir } from "os";
import { join } from "path";
import Store from "./store";
import checkInstall from "./check-install";

interface Preferences {
  passwordStoreDir?: string;
}

export default function Command() {
  const { passwordStoreDir } = getPreferenceValues<Preferences>();
  const storepath =
    passwordStoreDir?.trim() || join(homedir(), ".password-store");

  checkInstall();

  return <Store storepath={storepath} />;
}
