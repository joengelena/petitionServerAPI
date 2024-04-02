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
exports.checkSupportTierTitleUnique = exports.updateSupportTier = exports.supportTierExist = exports.deleteSupportTier = exports.findSupporterByIds = exports.checkValidToken = exports.addSupportTier = exports.findPetitionById = exports.getSupportTierByPetitionId = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const db_1 = require("../../config/db");
const getSupportTierByPetitionId = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Getting the petition ${petitionId} support tiers`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT id, petition_id, title, description FROM support_tier WHERE petition_id = ?`;
    const [supportTiers] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return supportTiers;
});
exports.getSupportTierByPetitionId = getSupportTierByPetitionId;
const findPetitionById = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Getting the petition ${petitionId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT id, owner_id as ownerId FROM petition WHERE id = ?`;
    const [petitions] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return petitions;
});
exports.findPetitionById = findPetitionById;
const addSupportTier = (petitionId, title, description, cost) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Adding the petition ${petitionId} support tiers`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)`;
    const [supportTier] = yield conn.query(query, [petitionId, title, description, cost]);
    yield conn.release();
    return supportTier;
});
exports.addSupportTier = addSupportTier;
const checkValidToken = (authToken) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Checking if the token is valid');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id as userId FROM \`user\` WHERE auth_token = ?';
    const [token] = yield conn.query(query, [authToken]);
    yield conn.release();
    return token;
});
exports.checkValidToken = checkValidToken;
const findSupporterByIds = (petitionId, supportTierId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Checking if the token is valid');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT petition_id as petitionId, support_tier_id as supportTierId FROM supporter WHERE petition_id = ? AND support_tier_id = ?';
    const [supporter] = yield conn.query(query, [petitionId, supportTierId]);
    yield conn.release();
    return supporter;
});
exports.findSupporterByIds = findSupporterByIds;
const deleteSupportTier = (petitionId, supportTierId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Deleting support tier with ${supportTierId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'DELETE FROM support_tier WHERE petition_id = ? AND id = ?';
    const [supportTier] = yield conn.query(query, [petitionId, supportTierId]);
    yield conn.release();
    return supportTier;
});
exports.deleteSupportTier = deleteSupportTier;
const supportTierExist = (supportTierId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Getting the petition ${supportTierId} support tiers`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT id FROM support_tier WHERE id = ?`;
    const [supportTier] = yield conn.query(query, [supportTierId]);
    yield conn.release();
    return supportTier;
});
exports.supportTierExist = supportTierExist;
const checkSupportTierTitleUnique = (petitionId, title) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if the title already exist in ${petitionId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT id FROM support_tier WHERE petition_id = ? AND title = ?`;
    const [supportTier] = yield conn.query(query, [petitionId, title]);
    yield conn.release();
    return supportTier;
});
exports.checkSupportTierTitleUnique = checkSupportTierTitleUnique;
const updateSupportTier = (petitionId, supportTierId, title, description, cost) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Update support tier with ${supportTierId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    let baseQuery = `UPDATE support_tier SET `;
    let isFirstQuery = true;
    if (title !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` title = '${title}'`;
            isFirstQuery = false;
        }
        baseQuery += `, title = '${title}'`;
    }
    if (description !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` description = '${description}'`;
            isFirstQuery = false;
        }
        baseQuery += `, description = '${description}'`;
    }
    if (cost !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` cost = '${cost}'`;
            isFirstQuery = false;
        }
        baseQuery += `, cost = '${cost}'`;
    }
    const query = baseQuery + 'WHERE id = ? AND petition_id = ?';
    const [supportTier] = yield conn.query(query, [petitionId, supportTierId]);
    yield conn.release();
    return supportTier;
});
exports.updateSupportTier = updateSupportTier;
//# sourceMappingURL=petition.support_tier.model.js.map