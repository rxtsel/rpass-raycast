import { getPreferenceValues } from "@raycast/api";
import { setGpgExecutablePath, setRpassExecutablePath } from "./rpass-client";

interface Preferences {
  rpassExecutablePath?: string;
  gpgExecutablePath?: string;
}

export function configureRpassClientFromPreferences(): void {
  const { rpassExecutablePath, gpgExecutablePath } =
    getPreferenceValues<Preferences>();
  setRpassExecutablePath(rpassExecutablePath);
  setGpgExecutablePath(gpgExecutablePath);
}
