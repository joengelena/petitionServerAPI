import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as validator from "./validator";
import * as schemas from "../resources/schemas.json";
import * as supportTierModel from "../models/petition.support_tier.model";

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const { title, description } = req.body;
        const cost = +req.body.cost;
        const validation = await validator.validate(schemas.support_tier_post, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request: Validation failed';
            res.status(400).send();
            return;
        }
        const validToken = await supportTierModel.checkValidToken(authToken);
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
        const supportTiers = await supportTierModel.getSupportTierByPetitionId(petitionId);
        if (supportTiers.length === 0) {
            res.statusMessage = "Not Found: No support tier with specified id";
            res.status(404).send();
            return;
        }
        const petitionDetail = await supportTierModel.findPetitionById(petitionId);
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
        } else {
            if (title.length > 128) {
                res.statusMessage = 'Bad Request: Title exceeds maximum length';
                res.status(400).send();
                return;
            }
            const titleUnique = await supportTierModel.checkSupportTierTitleUnique(petitionId, title);
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
        const supportTier = await supportTierModel.addSupportTier(petitionId, title, description, cost);
        res.statusMessage = "OK";
        res.status(201).send({"supportTierId": supportTier.insertId});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const supportTierId = +req.params.tierId;
        const { title, description, cost } = req.body;
        const validation = await validator.validate(schemas.support_tier_patch, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request: validation failed';
            res.status(400).send();
            return;
        }
        const validToken = await supportTierModel.checkValidToken(authToken);
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
        const petitionExist = await supportTierModel.findPetitionById(petitionId);
        if (petitionExist.length === 0) {
            res.statusMessage = "Not Found: No petition with specified id";
            res.status(404).send();
            return;
        }
        const supportTiers = await supportTierModel.getSupportTierByPetitionId(petitionId);
        if (supportTiers.length === 0) {
            res.statusMessage = "Not Found: No support tier with specified id";
            res.status(404).send();
            return;
        }
        const petitionDetail = await supportTierModel.findPetitionById(petitionId);
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may modify it";
            res.status(403).send();
            return;
        }
        const supporters = await supportTierModel.findSupporterByIds(petitionId, supportTierId);
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
        await supportTierModel.updateSupportTier(petitionId, supportTierId, title, description, cost);
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

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const supportTierId = +req.params.tierId;
        const validToken = await supportTierModel.checkValidToken(authToken);
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
        const supportTierExist = await supportTierModel.supportTierExist(supportTierId);
        if (supportTierExist.length === 0) {
            res.statusMessage = "Not Found: Support tier does not exist";
            res.status(404).send();
            return;
        }
        const petitionExist = await supportTierModel.findPetitionById(petitionId);
        if (petitionExist.length === 0) {
            res.statusMessage = "Not Found: No petition with specified id";
            res.status(404).send();
            return;
        }
        const supportTiers = await supportTierModel.getSupportTierByPetitionId(petitionId);
        if (supportTiers.length === 0) {
            res.statusMessage = "Not Found: No support tier with specified id";
            res.status(404).send();
            return;
        }
        const petitionDetail = await supportTierModel.findPetitionById(petitionId);
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may delete it";
            res.status(403).send();
            return;
        }
        const supporters = await supportTierModel.findSupporterByIds(petitionId, supportTierId);
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
        await supportTierModel.deleteSupportTier(petitionId, supportTierId);
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

export { addSupportTier, editSupportTier, deleteSupportTier };