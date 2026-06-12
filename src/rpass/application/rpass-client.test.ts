import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import {
  generateEntry,
  generateOtp,
  listEntries,
  RpassError,
  setRpassExecutablePathForTests,
  showEntry,
} from "./rpass-client";

interface FakeCommandResult {
  args: string[];
  stdin: string;
}

let tempDir: string;
let fakeExecutable: string;
let argsPath: string;
let stdinPath: string;

async function readFakeCommandResult(): Promise<FakeCommandResult> {
  return {
    args: JSON.parse(await readFile(argsPath, "utf8")) as string[],
    stdin: await readFile(stdinPath, "utf8"),
  };
}

function configureFakeCommand({
  stdout = "",
  stderr = "",
  exitCode = 0,
}: {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}): void {
  process.env.RPASS_FAKE_ARGS_PATH = argsPath;
  process.env.RPASS_FAKE_STDIN_PATH = stdinPath;
  process.env.RPASS_FAKE_STDOUT = stdout;
  process.env.RPASS_FAKE_STDERR = stderr;
  process.env.RPASS_FAKE_EXIT_CODE = String(exitCode);
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "rpass-client-test-"));
  fakeExecutable = join(tempDir, "fake-rpass.js");
  argsPath = join(tempDir, "args.json");
  stdinPath = join(tempDir, "stdin.txt");

  await writeFile(
    fakeExecutable,
    `#!/usr/bin/env node
const fs = require("node:fs");
let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { stdin += chunk; });
process.stdin.on("end", () => {
  fs.writeFileSync(process.env.RPASS_FAKE_ARGS_PATH, JSON.stringify(process.argv.slice(2)));
  fs.writeFileSync(process.env.RPASS_FAKE_STDIN_PATH, stdin);
  process.stdout.write(process.env.RPASS_FAKE_STDOUT || "");
  process.stderr.write(process.env.RPASS_FAKE_STDERR || "");
  process.exit(Number(process.env.RPASS_FAKE_EXIT_CODE || "0"));
});
`,
  );
  await chmod(fakeExecutable, 0o755);
  setRpassExecutablePathForTests(fakeExecutable);
});

afterEach(async () => {
  setRpassExecutablePathForTests(undefined);
  delete process.env.RPASS_FAKE_ARGS_PATH;
  delete process.env.RPASS_FAKE_STDIN_PATH;
  delete process.env.RPASS_FAKE_STDOUT;
  delete process.env.RPASS_FAKE_STDERR;
  delete process.env.RPASS_FAKE_EXIT_CODE;
  await rm(tempDir, { force: true, recursive: true });
});

test("listEntries parses JSON list output", async () => {
  configureFakeCommand({
    stdout: JSON.stringify(["example/login", "demo/account"]),
  });

  assert.deepEqual(await listEntries("/tmp/store"), [
    "example/login",
    "demo/account",
  ]);
  assert.deepEqual(await readFakeCommandResult(), {
    args: ["--store-dir", "/tmp/store", "list", "--json"],
    stdin: "",
  });
});

test("showEntry uses passphrase stdin and formats strict JSON output", async () => {
  configureFakeCommand({
    stdout: JSON.stringify({
      password: "dummy-password",
      fields: [{ name: "username", value: "demo" }],
      otp_uri: "otpauth://totp/example.invalid?secret=dummy",
      extra_lines: ["recovery note"],
    }),
  });

  assert.equal(
    await showEntry("example/login", "/tmp/store", "dummy-passphrase"),
    "dummy-password\nusername: demo\notpauth://totp/example.invalid?secret=dummy\nrecovery note",
  );
  assert.deepEqual(await readFakeCommandResult(), {
    args: [
      "--store-dir",
      "/tmp/store",
      "show",
      "--json",
      "--passphrase-stdin",
      "example/login",
    ],
    stdin: "dummy-passphrase",
  });
});

test("generateEntry calls rpass generate for password options", async () => {
  configureFakeCommand({
    stdout: JSON.stringify({
      name: "example/login",
      password: "dummy-password",
    }),
  });

  assert.deepEqual(
    await generateEntry("example/login", "/tmp/store", {
      kind: "password",
      length: 32,
      lowercase: true,
      uppercase: false,
      numbers: true,
      symbols: true,
      symbolCharacters: "_-",
      force: true,
    }),
    { name: "example/login", password: "dummy-password" },
  );
  assert.deepEqual(await readFakeCommandResult(), {
    args: [
      "--store-dir",
      "/tmp/store",
      "generate",
      "example/login",
      "--json",
      "--length",
      "32",
      "--no-uppercase",
      "--symbols",
      "_-",
      "--force",
    ],
    stdin: "",
  });
});

test("generateEntry calls rpass generate for passphrase options", async () => {
  configureFakeCommand({
    stdout: JSON.stringify({
      name: "example/passphrase",
      password: "dummy-passphrase",
    }),
  });

  assert.deepEqual(
    await generateEntry("example/passphrase", "/tmp/store", {
      kind: "phrase",
      words: 5,
      separator: "_",
      capitalize: true,
      number: true,
    }),
    { name: "example/passphrase", password: "dummy-passphrase" },
  );
  assert.deepEqual(await readFakeCommandResult(), {
    args: [
      "--store-dir",
      "/tmp/store",
      "generate",
      "example/passphrase",
      "--json",
      "--phrase",
      "--words",
      "5",
      "--separator",
      "_",
      "--capitalize",
      "--number",
    ],
    stdin: "",
  });
});

test("generateOtp uses passphrase stdin and parses strict JSON output", async () => {
  configureFakeCommand({
    stdout: JSON.stringify({
      name: "example/login",
      code: "123456",
      remaining_seconds: 20,
      period: 30,
    }),
  });

  assert.deepEqual(
    await generateOtp("example/login", "/tmp/store", "dummy-passphrase"),
    {
      name: "example/login",
      code: "123456",
      remaining_seconds: 20,
      period: 30,
    },
  );
  assert.deepEqual(await readFakeCommandResult(), {
    args: [
      "--store-dir",
      "/tmp/store",
      "otp",
      "--json",
      "--passphrase-stdin",
      "example/login",
    ],
    stdin: "dummy-passphrase",
  });
});

test("rpass JSON errors reject with the CLI error code and message", async () => {
  configureFakeCommand({
    stderr: JSON.stringify({
      error: {
        code: "gpg_passphrase_required",
        message: "use --passphrase-stdin",
      },
    }),
    exitCode: 1,
  });

  await assert.rejects(listEntries("/tmp/store"), (error) => {
    assert.ok(error instanceof RpassError);
    assert.equal(error.code, "gpg_passphrase_required");
    assert.equal(error.message, "use --passphrase-stdin");
    return true;
  });
});

test("invalid JSON stdout rejects with rpass_invalid_json", async () => {
  configureFakeCommand({ stdout: "not-json" });

  await assert.rejects(listEntries("/tmp/store"), (error) => {
    assert.ok(error instanceof RpassError);
    assert.equal(error.code, "rpass_invalid_json");
    return true;
  });
});

test("missing executable rejects with rpass_spawn_failed", async () => {
  setRpassExecutablePathForTests(join(tempDir, "missing-rpass"));

  await assert.rejects(listEntries("/tmp/store"), (error) => {
    assert.ok(error instanceof RpassError);
    assert.equal(error.code, "rpass_spawn_failed");
    return true;
  });
});

test("non-JSON stderr rejects with a generic rpass failure", async () => {
  configureFakeCommand({ stderr: "plain failure", exitCode: 2 });

  await assert.rejects(listEntries("/tmp/store"), (error) => {
    assert.ok(error instanceof RpassError);
    assert.equal(error.code, "rpass_failed");
    assert.match(error.details ?? "", /exit code: 2/);
    assert.match(error.details ?? "", /plain failure/);
    return true;
  });
});
