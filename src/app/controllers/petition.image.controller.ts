import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitionImages from "../models/petition.image.model";
import path from "node:path";
import fs from "mz/fs";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = +req.params.id;
        const petitionDetail = await petitionImages.findPetitionById(petitionId);
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
        const imageFile = path.resolve(`storage/images/${petition}`);
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
        const petitionId = +req.params.id;
        const petitionImage = req.body;
        const petitionDetail = await petitionImages.findPetitionById(petitionId);

        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: No petition with Id";
            res.status(404).send();
            return;
        }
        const validToken = await petitionImages.checkValidToken(authToken);
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
        const filePath = path.join(__dirname, '../../../storage/images', imageName)
        await fs.writeFile(filePath, petitionImage);
        if (petitionDetail[0].imageFilename === null) {
            await petitionImages.addPetitionImage(petitionId, imageName);
            res.statusMessage = "Created. Image added";
            res.status(201).send();
            return;
        } else {
            await petitionImages.addPetitionImage(petitionId, imageName);
            res.statusMessage = "OK. Image updated";
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

export { getImage, setImage };