import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  forgetStoreUnlock,
  markStoreUnlocked,
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
