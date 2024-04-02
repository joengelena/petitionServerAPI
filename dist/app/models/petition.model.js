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
exports.getSupportTiersByPetitionId = exports.deletePetition = exports.editPetition = exports.checkValidToken = exports.getCategories = exports.checkCategoryValid = exports.addSupportTier = exports.checkPetitionTitleUnique = exports.checkSupporterExist = exports.getPetitions = exports.findPetitionById = exports.getCategoryIds = exports.addNewPetition = void 0;
const db_1 = require("../../config/db");
const logger_1 = __importDefault(require("../../config/logger"));
const checkCategoryValid = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if ${categoryId} category is valid`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT name FROM category WHERE id IN (?)`;
    const [category] = yield conn.query(query, [categoryId]);
    yield conn.release();
    return category;
});
exports.checkCategoryValid = checkCategoryValid;
const getPetitions = (q, categoryId, supportingCost, ownerId, supporterId, sortBy) => __awaiter(void 0, void 0, void 0, function* () {
    let where = "";
    const conn = yield (0, db_1.getPool)().getConnection();
    const queryParams = [];
    if (q) {
        where += ' AND (p.title LIKE ? OR p.description LIKE ?) ';
        queryParams.push(`%${q}%`, `%${q}%`);
    }
    if (categoryId && categoryId.length > 0) {
        where += 'AND category_id IN (?) ';
        queryParams.push(categoryId);
    }
    if (ownerId) {
        where += 'AND owner_id = ? ';
        queryParams.push(ownerId);
    }
    if (supporterId) {
        where += 'AND s.user_id = ? ';
        queryParams.push(+supporterId);
    }
    if (supportingCost) {
        where += 'AND (SELECT MIN(t.cost) FROM support_tier t WHERE p.id = t.petition_id) <= ? ';
        queryParams.push(+supportingCost);
    }
    let query = `
    SELECT
        p.id AS petitionId,
        p.title,
        ${supporterId ? 's.user_id AS supporterId,' : ''}
        p.category_id AS categoryId,
        p.owner_id AS ownerId,
        u.first_name AS ownerFirstName,
        u.last_name AS ownerLastName,
        COALESCE(supporter_count, 0) AS numberOfSupporters,
        p.creation_date AS creationDate,
        MIN(st.cost) AS supportingCost
    FROM
        petition p
    JOIN
        \`user\` u ON p.owner_id = u.id
    LEFT JOIN
        (
            SELECT petition_id, COUNT(*) AS supporter_count
            FROM supporter
            GROUP BY petition_id
        ) AS ps ON p.id = ps.petition_id
    LEFT JOIN
        support_tier st ON p.id = st.petition_id
    ${supporterId ? 'LEFT JOIN supporter s ON p.id = s.petition_id' : ''}
    WHERE 1=1 ${where}
    GROUP BY
        p.id, p.title, p.category_id, ${supporterId ? 's.user_id,' : ''} p.owner_id, u.first_name, u.last_name, p.creation_date`;
    switch (sortBy) {
        case 'ALPHABETICAL_ASC':
            query += ' ORDER BY p.title ASC, petitionId ASC';
            break;
        case 'ALPHABETICAL_DESC':
            query += ' ORDER BY p.title DESC, petitionId ASC';
            break;
        case 'COST_ASC':
            query += ' ORDER BY supportingCost ASC, petitionId ASC';
            break;
        case 'COST_DESC':
            query += ' ORDER BY supportingCost DESC, petitionId ASC';
            break;
        case 'CREATED_ASC':
            query += ' ORDER BY creationDate ASC, petitionId ASC';
            break;
        case 'CREATED_DESC':
            query += ' ORDER BY creationDate DESC, petitionId ASC';
            break;
        default:
            query += ' ORDER BY creationDate ASC, petitionId ASC';
            break;
    }
    const [petitions] = yield conn.query(query, queryParams);
    yield conn.release();
    return petitions;
});
exports.getPetitions = getPetitions;
const addNewPetition = (title, description, categoryId, creationDate, ownerId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http('Adding a new petition');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'INSERT INTO petition (title, description, category_id, creation_date, owner_id) VALUES (?, ?, ?, ?, ?)';
    const [petition] = yield conn.query(query, [title, description, categoryId, creationDate, ownerId]);
    yield conn.release();
    return petition;
});
exports.addNewPetition = addNewPetition;
const addSupportTier = (petitionId, title, description, cost) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Adding support tier for petition ${petitionId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
    const [supportTier] = yield conn.query(query, [petitionId, title, description, cost]);
    yield conn.release();
    return supportTier;
});
exports.addSupportTier = addSupportTier;
const findPetitionById = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting petition information for ${petitionId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT
        p.id AS petitionId,
        p.title,
        p.category_id AS categoryId,
        p.owner_id AS ownerId,
        u.first_name AS ownerFirstName,
        u.last_name AS ownerLastName,
        COUNT(sp.id) AS numberOfSupporters,
        p.creation_date AS creationDate,
        p.description,
        CAST(COALESCE(SUM(st.cost), 0) AS INT) AS moneyRaised
    FROM
        petition p
    JOIN \`user\` u ON
        p.owner_id = u.id
    LEFT JOIN supporter sp ON
        p.id = sp.petition_id
    LEFT JOIN support_tier st ON
        sp.support_tier_id = st.id
    WHERE
        p.id = ?
    GROUP BY
        p.id`;
    const [petition] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return petition;
});
exports.findPetitionById = findPetitionById;
const checkPetitionTitleUnique = (title) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Checking if ${title} is unique`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT title FROM petition WHERE title = ?';
    const [result] = yield conn.query(query, [title]);
    yield conn.release();
    return result;
});
exports.checkPetitionTitleUnique = checkPetitionTitleUnique;
const getCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Getting all categories');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id as categoryID, name as categoryName from category';
    const [category] = yield conn.query(query);
    yield conn.release();
    return category;
});
exports.getCategories = getCategories;
const getCategoryIds = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Getting all categories');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id from category';
    const [category] = yield conn.query(query);
    yield conn.release();
    return category;
});
exports.getCategoryIds = getCategoryIds;
const checkValidToken = (authToken) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Checking if the token is valid');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id as userId FROM user WHERE auth_token = ?';
    const [token] = yield conn.query(query, [authToken]);
    yield conn.release();
    return token;
});
exports.checkValidToken = checkValidToken;
const editPetition = (petitionId, title, description, categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Updating ${petitionId} petition information`);
    const conn = yield (0, db_1.getPool)().getConnection();
    let baseQuery = 'UPDATE petition SET ';
    let isFirstQuery = true;
    if (title !== undefined) {
        if (isFirstQuery) {
            baseQuery += `title = '${title}'`;
            isFirstQuery = false;
        }
        else {
            baseQuery += `, title = '${title}'`;
        }
    }
    if (description !== undefined) {
        if (isFirstQuery) {
            baseQuery += `description = '${description}'`;
            isFirstQuery = false;
        }
        else {
            baseQuery += `, description = '${description}'`;
        }
    }
    if (categoryId !== undefined) {
        if (isFirstQuery) {
            baseQuery += `category_id = ${categoryId}`;
        }
        else {
            baseQuery += `, category_id = ${categoryId}`;
        }
    }
    const query = baseQuery + ` WHERE id = ${petitionId}`;
    const [update] = yield conn.query(query);
    yield conn.release();
    return update;
});
exports.editPetition = editPetition;
const deletePetition = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Deleting petition with ${petitionId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'DELETE from petition where id = ?';
    const [petition] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return petition;
});
exports.deletePetition = deletePetition;
const checkSupporterExist = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Checking if the petition ${petitionId} has a supporter for any of its support tiers`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT s.user_id AS supporterId,
        s.petition_id AS petitionId,
        s.support_tier_id AS supportTierId
    FROM supporter s
    WHERE s.petition_id = ?`;
    const [petition] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return petition;
});
exports.checkSupporterExist = checkSupporterExist;
const getSupportTiersByPetitionId = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Getting the petition ${petitionId} support tiers`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `SELECT title, description, cost, id as supportTierId FROM support_tier WHERE petition_id = ?`;
    const [supportTiers] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return supportTiers;
});
exports.getSupportTiersByPetitionId = getSupportTiersByPetitionId;
//# sourceMappingURL=petition.model.js.map