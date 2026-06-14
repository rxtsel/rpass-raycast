import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  createGpgUnlockSession,
  forgetStoreUnlock,
  GPG_REPROMPT_IMMEDIATELY,
  GPG_REPROMPT_UNTIL_RAYCAST_QUITS,
  markStoreUnlocked,
  parseGpgRepromptDuration,
  resetUnlockSessionForTests,
  shouldTryAgentUnlock,
} from "./gpg-unlock-session";

beforeEach(() => {
  resetUnlockSessionForTests();
});

test("stores start without an optimistic unlock marker", () => {
  assert.equal(shouldTryAgentUnlock("/tmp/store"), false);
});

test("successful unlock marks a store for optimistic agent reuse", () => {
  markStoreUnlocked("/tmp/store");

  assert.equal(shouldTryAgentUnlock("/tmp/store"), true);
});

test("forgetting a store clears optimistic agent reuse", () => {
  markStoreUnlocked("/tmp/store");
  forgetStoreUnlock("/tmp/store");

  assert.equal(shouldTryAgentUnlock("/tmp/store"), false);
});

test("store keys are trimmed without exposing passphrases", () => {
  markStoreUnlocked(" /tmp/store ");

  assert.equal(shouldTryAgentUnlock("/tmp/store"), true);
});

test("immediate reprompt does not store unlock markers", () => {
  const storage = new Map<string, string>();
  const session = createGpgUnlockSession({
    storage: {
      get: (key) => storage.get(key),
      set: (key, value) => storage.set(key, value),
      remove: (key) => storage.delete(key),
    },
  });

  session.markStoreUnlocked("/tmp/store", GPG_REPROMPT_IMMEDIATELY);

  assert.equal(session.shouldTryAgentUnlock("/tmp/store"), false);
  assert.equal(storage.size, 0);
});

test("until Raycast quits stores a process-long unlock marker", () => {
  const session = createGpgUnlockSession();
  session.markStoreUnlocked("/tmp/store", GPG_REPROMPT_UNTIL_RAYCAST_QUITS);

  assert.equal(session.shouldTryAgentUnlock("/tmp/store"), true);
});

test("parses reprompt durations with the documented default fallback", () => {
  assert.equal(parseGpgRepromptDuration("0"), 0);
  assert.equal(parseGpgRepromptDuration("14400000"), 14400000);
  assert.equal(parseGpgRepromptDuration("invalid"), 14400000);
});

test("unlock markers expire", () => {
  let now = 1000;
  const storage = new Map<string, string>();
  const session = createGpgUnlockSession({
    now: () => now,
    defaultTtlMs: 500,
    storage: {
      get: (key) => storage.get(key),
      set: (key, value) => storage.set(key, value),
      remove: (key) => storage.delete(key),
    },
  });

  session.markStoreUnlocked("/tmp/store");
  assert.equal(session.shouldTryAgentUnlock("/tmp/store"), true);

  now = 1501;
  assert.equal(session.shouldTryAgentUnlock("/tmp/store"), false);
  assert.equal(storage.size, 0);
});
