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
exports.deleteSupportTier = exports.editSupportTier = exports.addSupportTier = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const validator = __importStar(require("./validator"));
const schemas = __importStar(require("../resources/schemas.json"));
const supportTierModel = __importStar(require("../models/petition.support_tier.model"));
const addSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const { title, description } = req.body;
        const cost = +req.body.cost;
        const validation = yield validator.validate(schemas.support_tier_post, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request: Validation failed';
            res.status(400).send();
            return;
        }
        const validToken = yield supportTierModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request: Petition id is invalid";
            res.status(400).send();
            return;
        }
        const supportTiers = yield supportTierModel.getSupportTierByPetitionId(petitionId);
        if (supportTiers.length === 0) {
            res.statusMessage = "Not Found: No support tier with specified id";
            res.status(404).send();
            return;
        }
        const petitionDetail = yield supportTierModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: Petition does not exist therefore cannot add support tier";
            res.status(404).send();
            return;
        }
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may modify it";
            res.status(403).send();
            return;
        }
        if (title === "" || title === undefined) {
            res.statusMessage = 'Bad Request: Title is missing/undefined';
            res.status(400).send();
            return;
        }
        else {
            if (title.length > 128) {
                res.statusMessage = 'Bad Request: Title exceeds maximum length';
                res.status(400).send();
                return;
            }
            const titleUnique = yield supportTierModel.checkSupportTierTitleUnique(petitionId, title);
            if (titleUnique.length !== 0) {
                res.statusMessage = 'Bad Request: Title is not unique';
                res.status(400).send();
                return;
            }
        }
        if (cost < 0) {
            res.statusMessage = 'Bad Request: Cost is negative';
            res.status(400).send();
            return;
        }
        if (supportTiers.length >= 3) {
            res.statusMessage = 'Forbidden: Cannot add a support tier if 3 already exist';
            res.status(403).send();
            return;
        }
        for (const tier of supportTiers) {
            if (title === tier.title) {
                res.statusMessage = 'Bad Request: Support tier titles must be unique';
                res.status(400).send();
                return;
            }
        }
        const supportTier = yield supportTierModel.addSupportTier(petitionId, title, description, cost);
        res.statusMessage = "OK";
        res.status(201).send({ "supportTierId": supportTier.insertId });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addSupportTier = addSupportTier;
const editSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const supportTierId = +req.params.tierId;
        const { title, description, cost } = req.body;
        const validation = yield validator.validate(schemas.support_tier_patch, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request: validation failed';
            res.status(400).send();
            return;
        }
        const validToken = yield supportTierModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId) || isNaN(supportTierId)) {
            res.statusMessage = "Bad Request: Ids must be a number";
            res.status(400).send();
            return;
        }
        const petitionExist = yield supportTierModel.findPetitionById(petitionId);
        if (petitionExist.length === 0) {
            res.statusMessage = "Not Found: No petition with specified id";
            res.status(404).send();
            return;
        }
        const supportTiers = yield supportTierModel.getSupportTierByPetitionId(petitionId);
        if (supportTiers.length === 0) {
            res.statusMessage = "Not Found: No support tier with specified id";
            res.status(404).send();
            return;
        }
        const petitionDetail = yield supportTierModel.findPetitionById(petitionId);
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may modify it";
            res.status(403).send();
            return;
        }
        const supporters = yield supportTierModel.findSupporterByIds(petitionId, supportTierId);
        if (supporters.length !== 0) {
            res.statusMessage = "Forbidden: Can not edit a support tier if a supporter already exists for it";
            res.status(403).send();
            return;
        }
        if (cost !== undefined) {
            if (typeof cost === 'string') {
                res.statusMessage = 'Bad Request: Cost is not a number';
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
        }
        for (const tier of supportTiers) {
            if (title === tier.title) {
                res.statusMessage = 'Bad Request: Support tier title must be unique within petition';
                res.status(400).send();
                return;
            }
        }
        yield supportTierModel.updateSupportTier(petitionId, supportTierId, title, description, cost);
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
exports.editSupportTier = editSupportTier;
const deleteSupportTier = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const supportTierId = +req.params.tierId;
        const validToken = yield supportTierModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId) || isNaN(supportTierId)) {
            res.statusMessage = "Bad Request: Ids must be a number";
            res.status(400).send();
            return;
        }
        const supportTierExist = yield supportTierModel.supportTierExist(supportTierId);
        if (supportTierExist.length === 0) {
            res.statusMessage = "Not Found: Support tier does not exist";
            res.status(404).send();
            return;
        }
        const petitionExist = yield supportTierModel.findPetitionById(petitionId);
        if (petitionExist.length === 0) {
            res.statusMessage = "Not Found: No petition with specified id";
            res.status(404).send();
            return;
        }
        const supportTiers = yield supportTierModel.getSupportTierByPetitionId(petitionId);
        if (supportTiers.length === 0) {
            res.statusMessage = "Not Found: No support tier with specified id";
            res.status(404).send();
            return;
        }
        const petitionDetail = yield supportTierModel.findPetitionById(petitionId);
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may delete it";
            res.status(403).send();
            return;
        }
        const supporters = yield supportTierModel.findSupporterByIds(petitionId, supportTierId);
        if (supporters.length !== 0) {
            res.statusMessage = "Forbidden: Cannot delete a support tier if a supporter already exists for it";
            res.status(403).send();
            return;
        }
        if (supportTiers.length === 1) {
            res.statusMessage = "Forbidden: Can not remove a support tier if it is the only one for a petition";
            res.status(403).send();
            return;
        }
        yield supportTierModel.deleteSupportTier(petitionId, supportTierId);
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
exports.deleteSupportTier = deleteSupportTier;
//# sourceMappingURL=petition.support_tier.controller.js.map