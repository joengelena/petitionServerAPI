import {Request, Response} from "express";
import Logger from '../../config/logger';
import { v4 as uuidv4 } from 'uuid';

import * as userModel from "../models/user.model";
import * as validator from "./validator";
import * as schemas from "../resources/schemas.json"

import * as passwordService from "../services/passwords";
import {comparePassword, hashPassword} from "../services/passwords";

const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validator.validate(schemas.user_register, req.body);
        if (validation !== true) {
            res.statusMessage = "Bad Request: Validation failed";
            res.status(400).send();
            return;
        }
        const { email, firstName, lastName } = req.body;
        const hashedPassword = await passwordService.hashPassword(req.body.password);
        const userData = await userModel.checkEmailExistInDB(email);
        if (userData.length !== 0) {
            res.statusMessage = "Forbidden: Email already in use";
            res.status(403).send();
            return;
        }
        const user = await userModel.registerUser(email, firstName, lastName, hashedPassword);
        res.statusMessage = 'Created';
        res.status(201).send({userId: user.insertId});
        return;
    } catch (err) {
        Logger.error(err);
        res.status(500).send('Internal Server Error');
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validator.validate(schemas.user_login, req.body);
        if (validation !== true) {
            res.statusMessage = "Bad Request: Validation failed";
            res.status(400).send();
            return;
        }
        const { email, password } = req.body;
        const userData = await userModel.checkEmailExistInDB(email);
        if (userData.length === 0) {
            res.statusMessage = "UnAuthorized: Incorrect email";
            res.status(401).send();
            return;
        }
        const passwordMatch = await passwordService.comparePassword(password, userData[0].password);
        if (passwordMatch !== true) {
            res.statusMessage = "UnAuthorized: Incorrect password";
            res.status(401).send();
            return;
        }
        const authToken = uuidv4();
        await userModel.addAuthToken(authToken, email);
        res.statusMessage = "OK";
        res.status(200).send({userId: +userData[0].userId, token: authToken});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const user= await userModel.getUserByToken(authToken);
        if (user.length === 0 || authToken.length === 0) {
            res.statusMessage = "Unauthorized: Cannot log out if you are not authenticated";
            res.status(401).send();
            return;
        }
        const deleteToken = await userModel.deleteAuthToken(user[0].email);
        res.statusMessage = "OK";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const view = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = +req.params.id;
        const authToken = req.header('X-Authorization');
        if (isNaN(userId)) {
            res.statusMessage = "Not Found: Invalid user id";
            res.status(404).send();
            return;
        }
        const userDetail = await userModel.findUserByID(userId);
        if (userDetail.length === 0) {
            res.statusMessage = "Not Found: No user with specified id";
            res.status(404).send();
            return;
        }
        if (userDetail[0].authToken === authToken) {
            res.statusMessage = "OK: Viewing myself";
            res.status(200).send({email: userDetail[0].email, firstName: userDetail[0].firstName, lastName: userDetail[0].lastName });
            return;
        } else {
            res.statusMessage = "OK: Viewing the others";
            res.status(200).send({firstName: userDetail[0].firstName, lastName: userDetail[0].lastName });
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validator.validate(schemas.user_edit, req.body);
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
        const aUser = await userModel.findUserByID(userId);
        if (aUser.length === 0) {
            res.statusMessage = "Not Found: User does not exist with given id";
            res.status(404).send();
            return;
        }
        const authToken = req.header('X-Authorization');
        const userByToken = await userModel.getUserByToken(authToken);
        if (userByToken.length === 0) {
            res.statusMessage = "Unauthorized: User is not authorized";
            res.status(401).send();
            return;
        }
        const emailExists = await userModel.checkEmailExistInDB(email);
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
            const identicalPassword = await comparePassword(currentPassword, userByToken[0].password);
            if (identicalPassword === false) {
                res.statusMessage = "Unauthorized: Invalid current password";
                res.status(401).send();
                return;
            }
        } else {
            const identicalPassword = await comparePassword(currentPassword, userByToken[0].password);
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
            const encryptPassword = await hashPassword(password);
            await userModel.updateUser(userId, email, firstName, lastName, encryptPassword);
            res.statusMessage = "OK";
            res.status(200).send();
            return;
        }
        await userModel.updateUser(userId, email, firstName, lastName, currentPassword);
        res.statusMessage = "OK";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export { register, login, logout, view, update }