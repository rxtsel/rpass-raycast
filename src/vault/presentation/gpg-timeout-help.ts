import { RpassError } from "../../rpass/application/rpass-client";

export const GPG_TIMEOUT_HELP = `GPG may be waiting for pinentry. To avoid timeouts, enable loopback pinentry in gpg-agent.conf, then restart gpg-agent.

macOS / Linux:
1. Edit ~/.gnupg/gpg-agent.conf
2. Add: allow-loopback-pinentry
3. Restart: gpgconf --kill gpg-agent

Windows:
1. Edit %APPDATA%\\gnupg\\gpg-agent.conf
2. Add: allow-loopback-pinentry
3. Restart: gpgconf --kill gpg-agent

This does not change GPG cache durations. It only allows rpass --passphrase-stdin to pass the passphrase directly to GPG instead of opening a pinentry UI.`;

export function isGpgTimeoutOrPinentryError(error: unknown): boolean {
  if (!(error instanceof RpassError)) return false;

  const text = [error.message, error.details]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return (
    error.code === "rpass_timeout" ||
    error.code === "gpg_decrypt_failed" ||
    text.includes("pinentry") ||
    text.includes("no pinentry") ||
    text.includes("inappropriate ioctl")
  );
}

export function appendGpgTimeoutHelp(message: string, error: unknown): string {
  return isGpgTimeoutOrPinentryError(error)
    ? `${message}\n\n${GPG_TIMEOUT_HELP}`
    : message;
}
