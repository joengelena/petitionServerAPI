import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as userImages from '../models/user.image.model';
import fs from "mz/fs";
import path from "node:path";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = +req.params.id;
        const userDetail = await userImages.findUserByID(userId);
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
        const imageFile = path.resolve(`storage/images/${userProfile}`);
        res.statusMessage = "OK";
        res.status(200).sendFile(imageFile);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const imageContent = req.header('Content-Type');
        const imageFileType = ['image/png', 'image/jpeg', 'image/gif'];
        const userId = +req.params.id;
        const userImage = req.body;
        const userDetail = await userImages.findUserByID(userId);
        if (userDetail.length === 0) {
            res.statusMessage = "Not Found: No such user with ID given";
            res.status(404).send();
            return;
        }
        const userToken = await userImages.findUserByAuthToken(authToken);
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
        const filePath = path.join(__dirname, '../../../storage/images', imageName)
        await fs.writeFile(filePath, userImage);
        if (userDetail[0].imageFilename === null) {
            await userImages.addUserImage(userId, imageName);
            res.statusMessage = "Created: New image created";
            res.status(201).send();
            return;
        } else {
            await userImages.addUserImage(userId, imageName);
            res.statusMessage = "OK: Image updated";
            res.status(200).send();
            return;
    }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const userId = +req.params.id;
        if (isNaN(userId)) {
            res.statusMessage = "Not Found: Invalid user id";
            res.status(404).send();
            return;
        }
        const userDetail= await userImages.findUserByID(userId);
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
        const filePath = path.join(__dirname, '../../../storage/images', imageName);
        await fs.promises.unlink(filePath);
        await userImages.removeUserImage(userId, userDetail[0].imageFilename);
        res.statusMessage = "OK: Image successfully deleted";
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export { getImage, setImage, deleteImage }