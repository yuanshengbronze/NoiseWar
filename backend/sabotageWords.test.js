const assert = require("node:assert/strict");
const test = require("node:test");

const { normalizeSabotageWords } = require("./sabotageWords");

test("normalizeSabotageWords removes invalid values", () => {
    assert.deepEqual(normalizeSabotageWords(["freeze", "", null, 42, "shield"]), ["freeze", "shield"]);
    assert.deepEqual(normalizeSabotageWords("freeze"), []);
});

test("normalizeSabotageWords trims, lowercases, and deduplicates words", () => {
    assert.deepEqual(normalizeSabotageWords([" Freeze ", "freeze", "SLOW"]), ["freeze", "slow"]);
});
