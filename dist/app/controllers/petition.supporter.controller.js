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
exports.addSupporter = exports.getAllSupportersForPetition = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const supporterModel = __importStar(require("../models/petition.supporter.model"));
const supportTierModel = __importStar(require("../models/petition.support_tier.model"));
const getAllSupportersForPetition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const petitionId = +req.params.id;
        const petitionExist = yield supporterModel.findPetitionById(petitionId);
        if (!petitionExist) {
            res.statusMessage = "Not Found: No petition found with id";
            res.status(404).send();
            return;
        }
        const supporters = yield supporterModel.getAllSupporters(petitionId);
        res.statusMessage = "OK";
        res.status(200).send(supporters);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getAllSupportersForPetition = getAllSupportersForPetition;
const addSupporter = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const { supportTierId, message } = req.body;
        const petitionId = +req.params.id;
        const dateTime = new Date();
        const validToken = yield supportTierModel.checkValidToken(authToken);
        const userId = validToken[0].userId;
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId)) {
            res.statusMessage = "Bad Request: Invalid petition id";
            res.status(400).send();
            return;
        }
        if (typeof supportTierId === "string" || supportTierId === undefined) {
            res.statusMessage = "Bad Request: Support tier id is invalid";
            res.status(400).send();
            return;
        }
        const petitionDetail = yield supporterModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: No petition found with id";
            res.status(404).send();
            return;
        }
        const supportTierValid = yield supporterModel.supportTierExist(petitionId, supportTierId);
        if (supportTierValid === 0) {
            res.statusMessage = "Not Found: Support tier does not exist";
            res.status(404).send();
            return;
        }
        const supportedTiers = yield supporterModel.supportedTiers(petitionId, supportTierId, userId);
        if (supportedTiers > 0) {
            res.statusMessage = "Forbidden: Already supported at this tier";
            res.status(403).send();
            return;
        }
        const yourOwnPetition = yield supporterModel.yourOwnPetition(petitionId);
        logger_1.default.info(yourOwnPetition);
        logger_1.default.info(validToken[0]);
        if (validToken[0].userId === yourOwnPetition[0].ownerId) {
            res.statusMessage = "Forbidden: Cannot support your own petition";
            res.status(403).send();
            return;
        }
        yield supporterModel.addSupporter(petitionId, supportTierId, userId, message, dateTime);
        res.statusMessage = "Created";
        res.status(201).send();
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.addSupporter = addSupporter;
//# sourceMappingURL=petition.supporter.controller.js.map