"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getCategories = exports.deletePetition = exports.editPetition = exports.addPetition = exports.getPetition = exports.getAllPetitions = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const validator = __importStar(require("./validator"));
const petitionModel = __importStar(require("../models/petition.model"));
const schemas = __importStar(require("../resources/schemas.json"));
const getAllPetitions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validator.validate(schemas.petition_search, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
            return;
        }
        let startIndex = +req.query.start;
        let count = +req.query.count;
        const { q, categoryIds, supportingCost, supporterId, ownerId, sortBy } = req.query;
        const sortByString = sortBy;
        if (categoryIds !== undefined) {
            const validCategory = yield petitionModel.checkCategoryValid(categoryIds);
            if (validCategory.length === 0) {
                res.statusMessage = 'Bad Request: No category id exist';
                res.status(400).send();
                return;
            }
        }
        if (sortByString && !['ALPHABETICAL_ASC', 'ALPHABETICAL_DESC', 'COST_ASC', 'COST_DESC', 'CREATED_ASC', 'CREATED_DESC'].includes(sortByString)) {
            res.statusMessage = 'Bad Request: Invalid sortBy parameter';
            res.status(400).send();
            return;
        }
        if (typeof supporterId !== 'undefined' && isNaN(+supporterId)) {
            res.statusMessage = "Bad Request: Invalid supporterId";
            res.status(400).send();
            return;
        }
        if (typeof q !== 'undefined' && q.length === 0) {
            res.statusMessage = "Bad Request: Empty q term";
            res.status(400).send();
            return;
        }
        const petitions = yield petitionModel.getPetitions(q, categoryIds, supportingCost, ownerId, supporterId, sortBy);
        if (isNaN(startIndex)) {
            startIndex = 0;
        }
        if (isNaN(count)) {
            count = petitions.length;
        }
        res.statusMessage = "OK";
        res.status(200).send({ petitions: petitions.slice(startIndex, count), count: petitions.length });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getAllPetitions = getAllPetitions;
const getPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const petitionId = +req.params.id;
        if (isNaN(petitionId)) {
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        const petitionDetail = yield petitionModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found. No petition with id";
            res.status(404).send();
            return;
        }
        const tiers = yield petitionModel.getSupportTiersByPetitionId(petitionId);
        petitionDetail[0].supportTiers = tiers;
        res.statusMessage = "OK";
        res.status(200).send(petitionDetail[0]);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getPetition = getPetition;
const addPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const { title, description, categoryId, supportTiers } = req.body;
        const dateTime = new Date();
        const validation = yield validator.validate(schemas.petition_post, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request: Validation failed';
            res.status(400).send();
            return;
        }
        if (categoryId === undefined) {
            res.statusMessage = 'Error: Invalid category id';
            res.status(401).send();
            return;
        }
        if (typeof categoryId === 'string') {
            res.statusMessage = "Bad Request: Invalid category id";
            res.status(400).send();
            return;
        }
        const categories = yield petitionModel.getCategoryIds();
        if (!categories.includes(categoryId)) {
            res.statusMessage = 'Bad Request: Invalid category id';
            res.status(400).send();
            return;
        }
        if (title.length === 0) {
            res.statusMessage = 'Bad Request: Title is missing';
            res.status(400).send();
            return;
        }
        let categoryIdExists = false;
        for (const category of categories) {
            if (category.id === categoryId) {
                categoryIdExists = true;
                break;
            }
        }
        if (!categoryIdExists) {
            res.statusMessage = 'Bad Request: Invalid category id';
            res.status(400).send();
            return;
        }
        if (title.length > 128) {
            res.statusMessage = 'Bad Request: Title exceeds maximum length';
            res.status(400).send();
            return;
        }
        const titleUnique = yield petitionModel.checkPetitionTitleUnique(title);
        if (titleUnique.length !== 0) {
            res.statusMessage = 'Bad Request: Title is not unique';
            res.status(400).send();
            return;
        }
        if (!Array.isArray(supportTiers) || supportTiers.length < 1 || supportTiers.length > 3) {
            res.statusMessage = 'Bad Request: Support tiers must be between 1 and 3 (inclusive)';
            res.status(400).send();
            return;
        }
        const supportTierTitles = new Set();
        for (const tier of supportTiers) {
            if (!tier.title || !tier.description || tier.cost === undefined) {
                res.statusMessage = 'Bad Request: Invalid support tier structure';
                res.status(400).send();
                return;
            }
            if (supportTierTitles.has(tier.title)) {
                res.statusMessage = 'Forbidden: Support tier titles must be unique';
                res.status(403).send();
                return;
            }
            supportTierTitles.add(tier.title);
        }
        const validToken = yield petitionModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const ownerId = validToken[0].userId;
        const petition = yield petitionModel.addNewPetition(title, description, categoryId, dateTime, ownerId);
        yield Promise.all(supportTiers.map(tier => petitionModel.addSupportTier(petition.insertId, tier.title, tier.description, tier.cost)));
        res.statusMessage = "Created";
        res.status(201).send({ petitionId: petition.insertId });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addPetition = addPetition;
const editPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validator.validate(schemas.petition_patch, req.body);
        if (!validation) {
            res.statusMessage = 'Bad Request: Validation failed';
            res.status(400).send();
            return;
        }
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const { title, description, categoryId } = req.body;
        const validToken = yield petitionModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId)) {
            res.statusMessage = "Not Found: No petition with specified Id";
            res.status(404).send();
            return;
        }
        const petitionDetail = yield petitionModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: Petition does not exist";
            res.status(404).send();
            return;
        }
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may change it";
            res.status(403).send();
            return;
        }
        if (categoryId !== undefined) {
            const categories = yield petitionModel.getCategoryIds();
            let categoryIdExists = false;
            for (const category of categories) {
                if (category.id === categoryId) {
                    categoryIdExists = true;
                    break;
                }
            }
            if (!categoryIdExists) {
                res.statusMessage = 'Bad Request: Invalid category id';
                res.status(400).send();
                return;
            }
        }
        if (title !== undefined) {
            if (title.length > 128) {
                res.statusMessage = 'Bad Request: Title exceeds maximum length';
                res.status(400).send();
                return;
            }
            const titleUnique = yield petitionModel.checkPetitionTitleUnique(title);
            if (titleUnique.length !== 0) {
                res.statusMessage = 'Forbidden: Title is not unique';
                res.status(403).send();
                return;
            }
        }
        if (description !== undefined) {
            if (description === "") {
                res.statusMessage = 'Bad Request: Description is missing';
                res.status(400).send();
                return;
            }
        }
        if (categoryId !== undefined) {
            if (typeof categoryId === 'string') {
                res.statusMessage = "Bad Request: Invalid category id";
                res.status(400).send();
                return;
            }
            const validCategory = yield petitionModel.checkCategoryValid(categoryId);
            if (!validCategory) {
                res.statusMessage = 'Bad Request: Category id does not reference an existing category';
                res.status(400).send();
                return;
            }
        }
        yield petitionModel.editPetition(petitionId, title, description, categoryId);
        res.statusMessage = "OK";
        res.status(200).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.editPetition = editPetition;
const deletePetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const validToken = yield petitionModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId)) {
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        const supporterExist = yield petitionModel.checkSupporterExist(petitionId);
        if (supporterExist.length > 0) {
            res.statusMessage = "Forbidden: Can not delete a petition with one or more supporters";
            res.status(403).send();
            return;
        }
        const petitionDetail = yield petitionModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may delete it";
            res.status(403).send();
            return;
        }
        yield petitionModel.deletePetition(petitionId);
        res.status(200).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.deletePetition = deletePetition;
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield petitionModel.getCategories();
        res.statusMessage = "OK";
        res.status(200).send(category);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getCategories = getCategories;
//# sourceMappingURL=petition.controller.js.map