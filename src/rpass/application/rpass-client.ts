import { spawn } from "node:child_process";
import type { getPreferenceValues as getPreferenceValuesType } from "@raycast/api";

interface Preferences {
  rpassExecutablePath?: string;
}

interface OtpResult {
  name: string;
  code: string;
  remaining_seconds: number;
  period: number;
}

let executablePathOverride: string | undefined;

async function resolveExecutable(): Promise<string> {
  if (executablePathOverride !== undefined) return executablePathOverride;

  const { getPreferenceValues } = (await import("@raycast/api")) as {
    getPreferenceValues: typeof getPreferenceValuesType;
  };
  const { rpassExecutablePath } = getPreferenceValues<Preferences>();
  return rpassExecutablePath?.trim() || "rpass";
}

export function setRpassExecutablePathForTests(path: string | undefined): void {
  executablePathOverride = path;
}

export class RpassError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: string,
  ) {
    super(message);
    this.name = "RpassError";
  }
}

function parseRpassError(stderr: string, code: number | null): RpassError {
  try {
    const parsed = JSON.parse(stderr) as {
      error?: { code?: string; message?: string };
    };
    if (parsed.error?.code && parsed.error.message) {
      return new RpassError(parsed.error.code, parsed.error.message, stderr);
    }
  } catch {
    // Fall through to generic error.
  }

  const details = [
    `exit code: ${code ?? "unknown"}`,
    stderr.trim() ? `stderr:\n${stderr.trim()}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");

  return new RpassError("rpass_failed", "rpass command failed", details);
}

async function run(args: string[], stdin?: string): Promise<string> {
  const executable = await resolveExecutable();

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      stdio: [stdin === undefined ? "ignore" : "pipe", "pipe", "pipe"],
    });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new RpassError("rpass_timeout", "rpass timed out"));
    }, 10000);

    if (!child.stdout || !child.stderr) {
      clearTimeout(timeout);
      reject(new RpassError("rpass_spawn_failed", "rpass stdio unavailable"));
      return;
    }

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(new RpassError("rpass_spawn_failed", error.message));
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(parseRpassError(stderr, code));
      }
    });

    if (stdin !== undefined && child.stdin) {
      child.stdin.on("error", () => {
        // GPG may exit before reading stdin when decryption fails.
      });
      child.stdin.end(stdin);
    }
  });
}

export async function listEntries(storeDir: string): Promise<string[]> {
  const stdout = await run(["--store-dir", storeDir, "list", "--json"]);
  return parseJson<string[]>(stdout);
}

interface ShowEntryJson {
  password: string;
  fields: { name: string; value: string }[];
  otp_uri?: string;
  extra_lines: string[];
}

function parseJson<T>(stdout: string): T {
  try {
    return JSON.parse(stdout) as T;
  } catch (error) {
    throw new RpassError(
      "rpass_invalid_json",
      "rpass returned invalid JSON",
      error instanceof Error ? error.message : String(error),
    );
  }
}

function formatShowEntryOutput(entry: ShowEntryJson): string {
  return [
    entry.password,
    ...entry.fields.map((field) => `${field.name}: ${field.value}`),
    entry.otp_uri,
    ...entry.extra_lines,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function showEntry(
  entry: string,
  storeDir: string,
  passphrase?: string,
): Promise<string> {
  const args = ["--store-dir", storeDir, "show", "--json"];
  if (passphrase !== undefined) args.push("--passphrase-stdin");
  args.push(entry);

  const stdout = await run(args, passphrase);
  return formatShowEntryOutput(parseJson<ShowEntryJson>(stdout));
}

export async function generateOtp(
  entry: string,
  storeDir: string,
  passphrase?: string,
): Promise<OtpResult> {
  const args = ["--store-dir", storeDir, "otp", "--json"];
  if (passphrase !== undefined) args.push("--passphrase-stdin");
  args.push(entry);
  const stdout = await run(args, passphrase);
  return parseJson<OtpResult>(stdout);
}

export async function version(): Promise<void> {
  await run(["--version"]);
}

export type { OtpResult };
