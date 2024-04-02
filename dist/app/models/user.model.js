"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAuthToken = exports.addAuthToken = exports.getUserByToken = exports.checkEmailExistInDB = exports.findUserByID = exports.updateUser = exports.registerUser = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const registerUser = (email, firstName, lastName, password) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Registering a new user ${firstName} to the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'INSERT INTO \`user\` (email, first_name, last_name, password) values(?, ?, ?, ?)';
    const [user] = yield conn.query(query, [email, firstName, lastName, password]);
    yield conn.release();
    return user;
});
exports.registerUser = registerUser;
const updateUser = (userId, email, firstName, lastName, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Updating ${userId} user information`);
    const conn = yield (0, db_1.getPool)().getConnection();
    let baseQuery = 'UPDATE \`user\` SET';
    let isFirstQuery = true;
    if (newPassword !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` password = '${newPassword}'`;
            isFirstQuery = false;
        }
        else {
            baseQuery += `, password = '${newPassword}'`;
        }
    }
    if (email !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` email = '${email}'`;
            isFirstQuery = false;
        }
        else {
            baseQuery += `, email = '${email}'`;
        }
    }
    if (firstName !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` first_name = '${firstName}'`;
            isFirstQuery = false;
        }
        else {
            baseQuery += `, first_name = '${firstName}'`;
        }
    }
    if (lastName !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` last_name = '${lastName}'`;
        }
        else {
            baseQuery += `, last_name = '${lastName}'`;
        }
    }
    const query = baseQuery + ` WHERE id = ${userId}`;
    const [update] = yield conn.query(query);
    yield conn.release();
    return update;
});
exports.updateUser = updateUser;
const findUserByID = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting ${userId} user information`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT email, first_name as firstName, last_name as lastName, auth_token as authToken FROM \`user\` WHERE id = ?';
    const [user] = yield conn.query(query, [userId]);
    yield conn.release();
    return user;
});
exports.findUserByID = findUserByID;
const checkEmailExistInDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Checking if ${email} already exist in the database`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT
        id as userId,
        email,
        first_name as firstName,
        last_name as lastName,
        image_filename as imageFilename,
        password,
        auth_token as authToken
    FROM
        \`user\`
    WHERE
        email = ?`;
    const [user] = yield conn.query(query, [email]);
    yield conn.release();
    return user;
});
exports.checkEmailExistInDB = checkEmailExistInDB;
const getUserByToken = (authToken) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http('Checking if the authenticate token is valid');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT
        id as userId,
        email,
        first_name as firstName,
        last_name as lastName,
        image_filename as imageFilename,
        password,
        auth_token as authToken
    FROM
        \`user\`
    WHERE
        auth_token = ?`;
    const [token] = yield conn.query(query, [authToken]);
    yield conn.release();
    return token;
});
exports.getUserByToken = getUserByToken;
const addAuthToken = (authToken, email) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Adding new authenticate token to ${email}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE \`user\` SET auth_token = ? WHERE email = ?';
    const [token] = yield conn.query(query, [authToken, email]);
    yield conn.release();
    return token;
});
exports.addAuthToken = addAuthToken;
const deleteAuthToken = (email) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Deleting authenticate token ${email}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE \`user\` SET auth_token = null WHERE email = ?';
    const [token] = yield conn.query(query, [email]);
    yield conn.release();
    return token;
});
exports.deleteAuthToken = deleteAuthToken;
//# sourceMappingURL=user.model.js.map