import { getPreferenceValues } from "@raycast/api";
import { setRpassExecutablePath } from "./rpass-client";

interface Preferences {
  rpassExecutablePath?: string;
}

export function configureRpassClientFromPreferences(): void {
  const { rpassExecutablePath } = getPreferenceValues<Preferences>();
  setRpassExecutablePath(rpassExecutablePath);
}
