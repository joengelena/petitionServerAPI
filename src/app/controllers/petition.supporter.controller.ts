import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as supporterModel from "../models/petition.supporter.model";
import * as supportTierModel from "../models/petition.support_tier.model";


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = +req.params.id;
        const petitionExist = await supporterModel.findPetitionById(petitionId);
        if (!petitionExist) {
            res.statusMessage = "Not Found: No petition found with id";
            res.status(404).send();
            return;
        }
        const supporters = await supporterModel.getAllSupporters(petitionId);
        res.statusMessage = "OK";
        res.status(200).send(supporters);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const { supportTierId, message } = req.body;
        const petitionId = +req.params.id;
        const dateTime = new Date();
        const validToken = await supportTierModel.checkValidToken(authToken);
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
        const petitionDetail = await supporterModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: No petition found with id";
            res.status(404).send();
            return;
        }
        const supportTierValid = await supporterModel.supportTierExist(petitionId, supportTierId);
        if (supportTierValid === 0) {
            res.statusMessage = "Not Found: Support tier does not exist";
            res.status(404).send();
            return;
        }
        const supportedTiers = await supporterModel.supportedTiers(petitionId, supportTierId, userId);
        if (supportedTiers > 0) {
            res.statusMessage = "Forbidden: Already supported at this tier";
            res.status(403).send();
            return;
        }
        const yourOwnPetition = await supporterModel.yourOwnPetition(petitionId);
        Logger.info(yourOwnPetition);
        Logger.info(validToken[0]);

        if (validToken[0].userId === yourOwnPetition[0].ownerId) {
            res.statusMessage = "Forbidden: Cannot support your own petition";
            res.status(403).send();
            return;
        }
        await supporterModel.addSupporter(petitionId, supportTierId, userId, message, dateTime);
        res.statusMessage = "Created";
        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export { getAllSupportersForPetition, addSupporter }