import { homedir } from "node:os";
import { join } from "node:path";
import { getPreferenceValues } from "@raycast/api";
import { useEffect } from "react";
import checkInstall from "./vault/presentation/check-install";
import Store from "./vault/presentation/store";

interface Preferences {
  passwordStoreDir?: string;
}

export default function Command() {
  const { passwordStoreDir } = getPreferenceValues<Preferences>();
  const storepath =
    passwordStoreDir?.trim() || join(homedir(), ".password-store");

  useEffect(() => {
    checkInstall();
  }, []);

  return <Store storepath={storepath} />;
}
