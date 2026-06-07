import assert from "node:assert/strict";
import test from "node:test";
import { cleanEntryPath, toVaultItem } from "./vault-item";

test("parses domain-only template entries", () => {
  assert.deepEqual(toVaultItem("Acme/github.com.gpg"), {
    kind: "template",
    entry: "Acme/github.com",
    name: "github.com",
    folder: "Acme",
    label: undefined,
    faviconUrl: "https://github.com",
  });
});

test("parses template entries with labels after the domain", () => {
  assert.deepEqual(toVaultItem("Acme/github.com/person@example.test.gpg"), {
    kind: "template",
    entry: "Acme/github.com/person@example.test",
    name: "github.com",
    folder: "Acme",
    label: "person@example.test",
    faviconUrl: "https://github.com",
  });
});

test("keeps nested label paths after the domain", () => {
  assert.deepEqual(toVaultItem("Work/github.com/accounts/admin.gpg"), {
    kind: "template",
    entry: "Work/github.com/accounts/admin",
    name: "github.com",
    folder: "Work",
    label: "accounts/admin",
    faviconUrl: "https://github.com",
  });
});

test("keeps pass-compatible entries as full path fallback", () => {
  assert.deepEqual(toVaultItem("personal/social/example-login.gpg"), {
    kind: "pass",
    entry: "personal/social/example-login",
    name: "personal/social/example-login",
  });
});

test("ignores invalid template domains", () => {
  assert.deepEqual(toVaultItem("Personal/not-a-domain/person.gpg"), {
    kind: "pass",
    entry: "Personal/not-a-domain/person",
    name: "Personal/not-a-domain/person",
  });
});

test("requires a folder for template entries", () => {
  assert.deepEqual(toVaultItem("github.com/person@example.test.gpg"), {
    kind: "pass",
    entry: "github.com/person@example.test",
    name: "github.com/person@example.test",
  });
});

test("does not search domains deeper than first subfolder", () => {
  assert.deepEqual(toVaultItem("Work/clients/github.com/admin.gpg"), {
    kind: "pass",
    entry: "Work/clients/github.com/admin",
    name: "Work/clients/github.com/admin",
  });
});

test("normalizes windows paths and strips gpg suffix", () => {
  assert.equal(
    cleanEntryPath("Work\\example.com\\user.gpg"),
    "Work/example.com/user",
  );
});
