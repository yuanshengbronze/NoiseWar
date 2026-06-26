import assert from "node:assert/strict";
import test from "node:test";

import { getAuthHeadingAction, submitAuthRequest } from "./authApi.ts";

test("getAuthHeadingAction returns copy for each auth mode", () => {
  assert.equal(getAuthHeadingAction("login"), "log in");
  assert.equal(getAuthHeadingAction("signup"), "sign up");
});

test("submitAuthRequest calls the login endpoint and trims the returned username", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });

    return {
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  const result = await submitAuthRequest("login", "  player1  ", "secret", fetcher);

  assert.equal(result.ok, true);
  assert.equal(result.username, "player1");
  assert.equal(calls[0].url.endsWith("/api/event/lobby/login"), true);
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    username: "  player1  ",
    password: "secret",
  });
});

test("submitAuthRequest calls the signup endpoint", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });

    return {
      ok: true,
      json: async () => ({ success: true }),
    };
  };

  await submitAuthRequest("signup", "player1", "secret", fetcher);

  assert.equal(calls[0].url.endsWith("/api/event/lobby/signup"), true);
});

test("submitAuthRequest returns backend error messages", async () => {
  const fetcher = async () => ({
    ok: false,
    json: async () => ({ error: "Invalid username or password." }),
  });

  const result = await submitAuthRequest("login", "player1", "wrong", fetcher);

  assert.equal(result.ok, false);
  assert.equal(result.error, "Invalid username or password.");
});
