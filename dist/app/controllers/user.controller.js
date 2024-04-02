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
exports.update = exports.view = exports.logout = exports.login = exports.register = void 0;
const logger_1 = __importDefault(require("../../config/logger"));
const uuid_1 = require("uuid");
const userModel = __importStar(require("../models/user.model"));
const validator = __importStar(require("./validator"));
const schemas = __importStar(require("../resources/schemas.json"));
const passwordService = __importStar(require("../services/passwords"));
const passwords_1 = require("../services/passwords");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validator.validate(schemas.user_register, req.body);
        if (validation !== true) {
            res.statusMessage = "Bad Request: Validation failed";
            res.status(400).send();
            return;
        }
        const { email, firstName, lastName } = req.body;
        const hashedPassword = yield passwordService.hashPassword(req.body.password);
        const userData = yield userModel.checkEmailExistInDB(email);
        if (userData.length !== 0) {
            res.statusMessage = "Forbidden: Email already in use";
            res.status(403).send();
            return;
        }
        const user = yield userModel.registerUser(email, firstName, lastName, hashedPassword);
        res.statusMessage = 'Created';
        res.status(201).send({ userId: user.insertId });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.status(500).send('Internal Server Error');
        return;
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validator.validate(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = "Bad Request: Validation failed";
            res.status(400).send();
            return;
        }
        const { email, password } = req.body;
        const userData = yield userModel.checkEmailExistInDB(email);
        if (userData.length === 0) {
            res.statusMessage = "UnAuthorized: Incorrect email";
            res.status(401).send();
            return;
        }
        const passwordMatch = yield passwordService.comparePassword(password, userData[0].password);
        if (passwordMatch !== true) {
            res.statusMessage = "UnAuthorized: Incorrect password";
            res.status(401).send();
            return;
        }
        const authToken = (0, uuid_1.v4)();
        yield userModel.addAuthToken(authToken, email);
        res.statusMessage = "OK";
        res.status(200).send({ userId: +userData[0].userId, token: authToken });
        return;
    }
    catch (err) {
        logger_1.default.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authToken = req.header('X-Authorization');
        const user = yield userModel.getUserByToken(authToken);
        if (user.length === 0 || authToken.length === 0) {
            res.statusMessage = "Unauthorized: Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        }
        const deleteToken = yield userModel.deleteAuthToken(user[0].email);
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
exports.logout = logout;
const view = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = +req.params.id;
        const authToken = req.header('X-Authorization');
        if (isNaN(userId)) {
            res.statusMessage = "Not Found: Invalid user id";
            res.status(404).send();
            return;
        }
        const userDetail = yield userModel.findUserByID(userId);
        if (userDetail.length === 0) {
            res.statusMessage = "Not Found: No user with specified id";
            res.status(404).send();
            return;
        }
        if (userDetail[0].authToken === authToken) {
            res.statusMessage = "OK: Viewing myself";
            res.status(200).send({ email: userDetail[0].email, firstName: userDetail[0].firstName, lastName: userDetail[0].lastName });
            return;
        }
        else {
            res.statusMessage = "OK: Viewing the others";
            res.status(200).send({ firstName: userDetail[0].firstName, lastName: userDetail[0].lastName });
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
exports.view = view;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validation = yield validator.validate(schemas.user_edit, req.body);
        const userId = +req.params.id;
        if (validation !== true) {
            res.statusMessage = "Bad request. Invalid information";
            res.status(400).send();
            return;
        }
        if (isNaN(userId)) {
            res.statusMessage = "Bad request: Invalid user id";
            res.status(400).send();
            return;
        }
        const { email, firstName, lastName, password, currentPassword } = req.body;
        if (typeof password === 'string' && currentPassword === undefined) {
            res.statusMessage = "Bad request: Current password cannot be undefined";
            res.status(400).send();
            return;
        }
        const aUser = yield userModel.findUserByID(userId);
        if (aUser.length === 0) {
            res.statusMessage = "Not Found: User does not exist with given id";
            res.status(404).send();
            return;
        }
        const authToken = req.header('X-Authorization');
        const userByToken = yield userModel.getUserByToken(authToken);
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized: User is not authorized";
            res.status(401).send();
            return;
        }
        const emailExists = yield userModel.checkEmailExistInDB(email);
        if (emailExists.length !== 0) {
            res.statusMessage = "Forbidden: Email is already in use";
            res.status(403).send();
            return;
        }
        if (userByToken[0].authToken !== authToken) {
            res.statusMessage = "Forbidden: Can not edit another user's information";
            res.status(403).send();
            return;
        }
        if (password === undefined) {
            const identicalPassword = yield (0, passwords_1.comparePassword)(currentPassword, userByToken[0].password);
            if (identicalPassword === false) {
                res.statusMessage = "Unauthorized: Invalid current password";
                res.status(401).send();
                return;
            }
        }
        else {
            const identicalPassword = yield (0, passwords_1.comparePassword)(currentPassword, userByToken[0].password);
            if (identicalPassword === false) {
                res.statusMessage = "Unauthorized: Invalid current password";
                res.status(401).send();
                return;
            }
            if (currentPassword === password) {
                res.statusMessage = "Forbidden: Identical current password and new password";
                res.status(403).send();
                return;
            }
            const encryptPassword = yield (0, passwords_1.hashPassword)(password);
            yield userModel.updateUser(userId, email, firstName, lastName, encryptPassword);
            res.statusMessage = "OK";
            res.status(200).send();
            return;
        }
        yield userModel.updateUser(userId, email, firstName, lastName, currentPassword);
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
exports.update = update;
//# sourceMappingURL=user.controller.js.map