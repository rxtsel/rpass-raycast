import { Clipboard, getPreferenceValues } from "@raycast/api";

interface Preferences {
  clipboardTimeout: string;
}

function timeoutSeconds(): number {
  const { clipboardTimeout } = getPreferenceValues<Preferences>();
  return parseInt(clipboardTimeout, 10) || 0;
}

async function clearIfUnchanged(expected: string): Promise<void> {
  const current = await Clipboard.readText();
  if (current === expected) {
    await Clipboard.clear();
  }
}

function scheduleClear(content: string): void {
  const seconds = timeoutSeconds();
  if (seconds <= 0) return;
  setTimeout(() => clearIfUnchanged(content), seconds * 1000);
}

export async function copyPassword(content: string): Promise<void> {
  await Clipboard.copy(content, { concealed: true });
  scheduleClear(content);
}

export async function pastePassword(content: string): Promise<void> {
  await Clipboard.paste(content);
  scheduleClear(content);
}
