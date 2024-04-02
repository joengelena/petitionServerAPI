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
exports.findUserByAuthToken = exports.addUserImage = exports.removeUserImage = exports.findUserByID = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const db_1 = require("../../config/db");
const findUserByID = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting ${userId} user information`);
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
        id = ?`;
    const [user] = yield conn.query(query, [userId]);
    yield conn.release();
    return user;
});
exports.findUserByID = findUserByID;
const removeUserImage = (userId, image) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Deleting ${userId} user's image`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE \`user\` SET image_filename = null WHERE id = ?';
    const [update] = yield conn.query(query, [userId, image]);
    yield conn.release();
    return update;
});
exports.removeUserImage = removeUserImage;
const addUserImage = (userId, image) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Adding/Updating ${userId} user's image`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'UPDATE \`user\` SET image_filename = ? WHERE id = ?';
    const [update] = yield conn.query(query, [image, userId]);
    yield conn.release();
    return update;
});
exports.addUserImage = addUserImage;
const findUserByAuthToken = (authToken) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Checking if the token is valid');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT id as userId FROM \`user\` WHERE auth_token = ?`;
    const [token] = yield conn.query(query, [authToken]);
    yield conn.release();
    return token;
});
exports.findUserByAuthToken = findUserByAuthToken;
//# sourceMappingURL=user.image.model.js.map