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
exports.addPetitionImage = exports.checkValidToken = exports.findPetitionById = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const db_1 = require("../../config/db");
const findPetitionById = (petitionId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`Getting petition information for ${petitionId}`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `
    SELECT id as petitionId, image_filename as imageFilename, owner_id as ownerId FROM petition WHERE id = ?`;
    const [petition] = yield conn.query(query, [petitionId]);
    yield conn.release();
    return petition;
});
exports.findPetitionById = findPetitionById;
const checkValidToken = (authToken) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Checking if the token is valid');
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = 'SELECT id as userId FROM \`user\` WHERE auth_token = ?';
    const [token] = yield conn.query(query, [authToken]);
    yield conn.release();
    return token;
});
exports.checkValidToken = checkValidToken;
const addPetitionImage = (petitionId, image) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.http(`Adding/Updating ${petitionId} petition's image`);
    const conn = yield (0, db_1.getPool)().getConnection();
    const query = `UPDATE petition SET image_filename = ? WHERE id = ?`;
    const [update] = yield conn.query(query, [image, petitionId]);
    yield conn.release();
    return update;
});
exports.addPetitionImage = addPetitionImage;
//# sourceMappingURL=petition.image.model.js.map