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
exports.yourOwnPetition = exports.supportedTiers = exports.findPetitionById = exports.supportTierExist = exports.addSupporter = exports.getAllSupporters = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const getAllSupporters = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting ${petitionId} petition's supporter information`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT
        s.id AS supportId,
        s.support_tier_id AS supportTierId,
        s.message, s.user_id AS supporterId,
        u.first_name AS supporterFirstName,
        u.last_name AS supporterLastName,
        s.timestamp
    FROM
        supporter s
    LEFT JOIN
        \`user\` u ON s.user_id = u.id
    WHERE
        s.petition_id = ?
    ORDER BY
        s.timestamp DESC`;
    const [supporter] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return supporter;
});
exports.getAllSupporters = getAllSupporters;
const findPetitionById = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Getting the petition ${petitionId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT id as ownerId FROM petition WHERE id = ?`;
    const [petitions] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return petitions;
});
exports.findPetitionById = findPetitionById;
const supportedTiers = (petitionId, supportTierId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if the user is supporting one tier once`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT
        COUNT(*)
    FROM
        supporter
    WHERE
        petition_id = ? AND support_tier_id = ? AND user_id = ?`;
    const [result] = yield conn.query(query, [petitionId, supportTierId, userId]);
    yield conn.release();
    return result[0].count > 0;
});
exports.supportedTiers = supportedTiers;
const supportTierExist = (petitionId, supportTierId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if the user is supporting one tier once`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT
        COUNT(*)
    FROM
        support_tier
    WHERE
        petition_id = ? AND id = ?`;
    const [result] = yield conn.query(query, [petitionId, supportTierId]);
    yield conn.release();
    return result[0].count > 0;
});
exports.supportTierExist = supportTierExist;
const yourOwnPetition = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if the user is supporting one tier once`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT owner_id as ownerId FROM petition WHERE id = ?`;
    const [result] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return result;
});
exports.yourOwnPetition = yourOwnPetition;
const addSupporter = (petitionId, supportTierId, userId, message, timestamp) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Support the ${petitionId} petition`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `INSERT INTO supporter (petition_id, support_tier_id, user_id, message, timestamp) values (?, ?, ?, ?, ?)`;
    const [supporter] = yield conn.query(query, [petitionId, supportTierId, userId, message, timestamp]);
    yield conn.release();
    return supporter;
});
exports.addSupporter = addSupporter;
//# sourceMappingURL=petition.supporter.model.js.map