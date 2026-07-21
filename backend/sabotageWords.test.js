const assert = require("node:assert/strict");
const test = require("node:test");

const { normalizeSabotageSettings, normalizeSabotageWords } = require("./sabotageWords");

test("normalizeSabotageWords removes invalid values", () => {
    assert.deepEqual(normalizeSabotageWords(["freeze", "", null, 42, "shield"]), ["freeze", "shield"]);
    assert.deepEqual(normalizeSabotageWords("freeze"), []);
});

test("normalizeSabotageWords trims, lowercases, and deduplicates words", () => {
    assert.deepEqual(normalizeSabotageWords([" Freeze ", "freeze", "SLOW"]), ["freeze", "slow"]);
});

test("normalizeSabotageWords only keeps words made of letters", () => {
    assert.deepEqual(
        normalizeSabotageWords(["pause!", "slow2", "ice wall", "freeze", "shield"]),
        ["freeze", "shield"]
    );
});

test("normalizeSabotageSettings normalizes regular and command-switch sabotage words", () => {
    assert.deepEqual(
        normalizeSabotageSettings({
            sabotageWords: [" Freeze ", "freeze", "shield"],
            commandSwitchCommands: {
                above: " Cloud ",
                down: "drop",
                right: "SKY",
                left: "wind"
            }
        }),
        {
            sabotageWords: ["freeze", "shield"],
            commandSwitchWord: "shuffle",
            commandSwitchCommands: {
                above: "cloud",
                down: "drop",
                right: "sky",
                left: "wind"
            }
        }
    );
});

test("normalizeSabotageSettings falls back to defaults for invalid command-switch command words", () => {
    assert.deepEqual(
        normalizeSabotageSettings({
            sabotageWords: ["freeze"],
            commandSwitchCommands: {
                above: "switch now",
                down: "drop2"
            }
        }),
        {
            sabotageWords: ["freeze"],
            commandSwitchWord: "shuffle",
            commandSwitchCommands: {
                above: "north",
                down: "south",
                right: "east",
                left: "west"
            }
        }
    );
});
