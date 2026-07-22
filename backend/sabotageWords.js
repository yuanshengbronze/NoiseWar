const normalizeSabotageWords = (words) => {
    if (!Array.isArray(words)) {
        return [];
    }

    const seenWords = new Set();
    const lettersOnlyPattern = /^[a-z]+$/;

    return words
        .filter((word) => typeof word === "string")
        .map((word) => word.trim().toLowerCase())
        .filter((word) => {
            if (!lettersOnlyPattern.test(word) || seenWords.has(word)) {
                return false;
            }

            seenWords.add(word);
            return true;
        });
};

const DEFAULT_COMMAND_SWITCH_WORD = "shuffle";
const DEFAULT_COMMAND_SWITCH_COMMANDS = {
    above: "north",
    down: "south",
    right: "east",
    left: "west"
};

const normalizeCommandSwitchCommands = (commands = {}) => {
    return Object.fromEntries(
        Object.entries(DEFAULT_COMMAND_SWITCH_COMMANDS).map(([command, defaultWord]) => {
            const normalizedWords = normalizeSabotageWords([commands[command]]);

            return [command, normalizedWords[0] || defaultWord];
        })
    );
};

const normalizeSabotageSettings = (settings = {}) => {
    const sabotageWords = normalizeSabotageWords(settings.sabotageWords);
    const commandSwitchCommands = normalizeCommandSwitchCommands(settings.commandSwitchCommands);

    return {
        sabotageWords,
        commandSwitchWord: DEFAULT_COMMAND_SWITCH_WORD,
        commandSwitchCommands
    };
};

module.exports = {
    DEFAULT_COMMAND_SWITCH_COMMANDS,
    DEFAULT_COMMAND_SWITCH_WORD,
    normalizeCommandSwitchCommands,
    normalizeSabotageWords,
    normalizeSabotageSettings
};
