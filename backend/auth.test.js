const assert = require("node:assert/strict");
const test = require("node:test");

const { HASH_PREFIX, hashPassword, normalizeCredentials, verifyPassword } = require("./auth");

test("normalizeCredentials trims usernames and keeps passwords unchanged", () => {
    assert.deepEqual(normalizeCredentials("  player1  ", "secret"), {
        username: "player1",
        password: "secret"
    });
});

test("normalizeCredentials rejects missing username or password", () => {
    assert.equal(normalizeCredentials("", "secret"), null);
    assert.equal(normalizeCredentials("player1", ""), null);
    assert.equal(normalizeCredentials(undefined, "secret"), null);
});

test("hashPassword returns a salted pbkdf2 hash instead of the raw password", async () => {
    const password = "secret";
    const hash = await hashPassword(password);

    assert.match(hash, new RegExp(`^${HASH_PREFIX}\\$`));
    assert.notEqual(hash, password);
});

test("hashPassword uses a different salt each time", async () => {
    const firstHash = await hashPassword("secret");
    const secondHash = await hashPassword("secret");

    assert.notEqual(firstHash, secondHash);
});

test("verifyPassword accepts matching hashes and rejects wrong passwords", async () => {
    const hash = await hashPassword("secret");

    assert.equal(await verifyPassword("secret", hash), true);
    assert.equal(await verifyPassword("wrong", hash), false);
});

test("verifyPassword supports existing plaintext passwords for migration", async () => {
    assert.equal(await verifyPassword("secret", "secret"), true);
    assert.equal(await verifyPassword("wrong", "secret"), false);
});

test("verifyPassword rejects malformed hashes safely", async () => {
    assert.equal(await verifyPassword("secret", `${HASH_PREFIX}$bad-hash`), false);
});
