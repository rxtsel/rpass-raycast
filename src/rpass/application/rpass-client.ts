import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getPreferenceValues } from "@raycast/api";

const execFileAsync = promisify(execFile);

interface Preferences {
  rpassExecutablePath?: string;
}

interface OtpResult {
  name: string;
  code: string;
  remaining_seconds: number;
  period: number;
}

function resolveExecutable(): string {
  const { rpassExecutablePath } = getPreferenceValues<Preferences>();
  return rpassExecutablePath?.trim() || "rpass";
}

async function run(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(resolveExecutable(), args, {
    timeout: 10000,
  });
  return stdout;
}

export async function listEntries(storeDir: string): Promise<string[]> {
  const stdout = await run(["--store-dir", storeDir, "list", "--json"]);
  return JSON.parse(stdout) as string[];
}

export async function showEntry(
  entry: string,
  storeDir: string,
): Promise<string> {
  return run(["--store-dir", storeDir, "show", entry]);
}

export async function generateOtp(
  entry: string,
  storeDir: string,
): Promise<OtpResult> {
  const stdout = await run(["--store-dir", storeDir, "otp", entry, "--json"]);
  return JSON.parse(stdout) as OtpResult;
}

export async function version(): Promise<void> {
  await run(["--version"]);
}

export type { OtpResult };
