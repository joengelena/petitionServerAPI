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
exports.setImage = exports.getImage = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const petitionImages = __importStar(require("../models/petition.image.model"));
const node_path_1 = __importDefault(require("node:path"));
const fs_1 = __importDefault(require("mz/fs"));
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const petitionId = +req.params.id;
        const petitionDetail = yield petitionImages.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        const petition = petitionDetail[0].imageFilename;
        if (petitionDetail === null) {
            res.statusMessage = "Not Found: Petition has no image";
            res.status(404).send();
            return;
        }
        const imageFile = node_path_1.default.resolve(`storage/images/${petition}`);
        res.statusMessage = "OK";
        res.status(200).sendFile(imageFile);
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.getImage = getImage;
const setImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const imageContent = req.header('Content-Type');
        const imageFileType = ['image/png', 'image/jpeg', 'image/gif'];
        const petitionId = +req.params.id;
        const petitionImage = req.body;
        const petitionDetail = yield petitionImages.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: No petition with Id";
            res.status(404).send();
            return;
        }
        const validToken = yield petitionImages.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = "Unauthorized";
            res.status(401).send();
            return;
        }
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition can change the hero image";
            res.status(403).send();
            return;
        }
        if (!imageFileType.includes((imageContent))) {
            res.statusMessage = "Bad Request: Invalid image type";
            res.status(400).send();
            return;
        }
        const imageName = `petition_${petitionId}.${imageContent.substring(6)}`;
        const filePath = node_path_1.default.join(__dirname, '../../../storage/images', imageName);
        yield fs_1.default.writeFile(filePath, petitionImage);
        if (petitionDetail[0].imageFilename === null) {
            yield petitionImages.addPetitionImage(petitionId, imageName);
            res.statusMessage = "Created. Image added";
            res.status(201).send();
            return;
        }
        else {
            yield petitionImages.addPetitionImage(petitionId, imageName);
            res.statusMessage = "OK. Image updated";
            res.status(200).send();
            return;
        }
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.setImage = setImage;
//# sourceMappingURL=petition.image.controller.js.map