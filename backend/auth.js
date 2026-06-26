const crypto = require("crypto");

const HASH_PREFIX = "pbkdf2";
const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = "sha512";

const normalizeCredentials = (username, password) => {
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
        return null;
    }

    return {
        username: username.trim(),
        password
    };
};

const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");

        crypto.pbkdf2(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(`${HASH_PREFIX}$${HASH_ITERATIONS}$${salt}$${derivedKey.toString("hex")}`);
        });
    });
};

const verifyPassword = (password, storedPassword) => {
    if (!storedPassword?.startsWith(`${HASH_PREFIX}$`)) {
        return Promise.resolve(storedPassword === password);
    }

    return new Promise((resolve, reject) => {
        const [, iterations, salt, storedHash] = storedPassword.split("$");
        const iterationCount = Number(iterations);

        if (!Number.isInteger(iterationCount) || !salt || !storedHash) {
            resolve(false);
            return;
        }

        crypto.pbkdf2(password, salt, iterationCount, HASH_KEY_LENGTH, HASH_DIGEST, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            const storedHashBuffer = Buffer.from(storedHash, "hex");

            if (storedHashBuffer.length !== derivedKey.length) {
                resolve(false);
                return;
            }

            resolve(crypto.timingSafeEqual(storedHashBuffer, derivedKey));
        });
    });
};

module.exports = {
    HASH_PREFIX,
    hashPassword,
    normalizeCredentials,
    verifyPassword
};
