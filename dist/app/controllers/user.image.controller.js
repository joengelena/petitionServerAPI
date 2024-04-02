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
exports.deleteImage = exports.setImage = exports.getImage = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const userImages = __importStar(require("../models/user.image.model"));
const fs_1 = __importDefault(require("mz/fs"));
const node_path_1 = __importDefault(require("node:path"));
const getImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = +req.params.id;
        const userDetail = yield userImages.findUserByID(userId);
        if (userDetail.length === 0) {
            res.statusMessage = "Not Found: No user with specified id";
            res.status(404).send();
            return;
        }
        const userProfile = userDetail[0].imageFilename;
        if (userProfile === null) {
            res.statusMessage = "Not Found: User has no image";
            res.status(404).send();
            return;
        }
        const imageFile = node_path_1.default.resolve(`storage/images/${userProfile}`);
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
        const userId = +req.params.id;
        const userImage = req.body;
        const userDetail = yield userImages.findUserByID(userId);
        if (userDetail.length === 0) {
            res.statusMessage = "Not Found: No such user with ID given";
            res.status(404).send();
            return;
        }
        const userToken = yield userImages.findUserByAuthToken(authToken);
        if (authToken === undefined || userToken.length === 0) {
            res.statusMessage = "Unauthorized: User is not authorized";
            res.status(401).send();
            return;
        }
        if (userDetail[0].authToken !== authToken) {
            res.statusMessage = "Forbidden: Can not change another user's profile photo";
            res.status(403).send();
            return;
        }
        if (!imageFileType.includes((imageContent))) {
            res.statusMessage = "Bad Request: Invalid image supplied (possibly incorrect file type)";
            res.status(400).send();
            return;
        }
        const imageName = `user_${userId}.${imageContent.substring(6)}`;
        const filePath = node_path_1.default.join(__dirname, '../../../storage/images', imageName);
        yield fs_1.default.writeFile(filePath, userImage);
        if (userDetail[0].imageFilename === null) {
            yield userImages.addUserImage(userId, imageName);
            res.statusMessage = "Created: New image created";
            res.status(201).send();
            return;
        }
        else {
            yield userImages.addUserImage(userId, imageName);
            res.statusMessage = "OK: Image updated";
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
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const userId = +req.params.id;
        if (isNaN(userId)) {
            res.statusMessage = "Not Found: Invalid user id";
            res.status(404).send();
            return;
        }
        const userDetail = yield userImages.findUserByID(userId);
        if (userDetail.length === 0) {
            res.statusMessage = "Not Found: No such user with id given";
            res.status(404).send();
        }
        if (userDetail[0].authToken !== authToken) {
            res.statusMessage = "Forbidden: Can not delete another user's profile photo";
            res.status(403).send();
            return;
        }
        const imageName = userDetail[0].imageFilename;
        const filePath = node_path_1.default.join(__dirname, '../../../storage/images', imageName);
        yield fs_1.default.promises.unlink(filePath);
        yield userImages.removeUserImage(userId, userDetail[0].imageFilename);
        res.statusMessage = "OK: Image successfully deleted";
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
exports.deleteImage = deleteImage;
//# sourceMappingURL=user.image.controller.js.map