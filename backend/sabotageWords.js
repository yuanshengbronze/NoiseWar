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

module.exports = { normalizeSabotageWords };
