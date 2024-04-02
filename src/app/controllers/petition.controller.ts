import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as validator from './validator';
import * as petitionModel from "../models/petition.model";
import * as schemas from "../resources/schemas.json"

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validator.validate(schemas.petition_search, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request';
            res.status(400).send();
            return;
        }
        let startIndex = +req.query.start;
        let count = +req.query.count;
        const {  q,  categoryIds, supportingCost,
            supporterId, ownerId, sortBy} = req.query;
        const sortByString: string = sortBy as string;
        if (categoryIds !== undefined) {
            const validCategory = await petitionModel.checkCategoryValid(categoryIds);
            if (validCategory.length === 0) {
                res.statusMessage = 'Bad Request: No category id exist'
                res.status(400).send();
                return;
            }
        }
        if (sortByString && !['ALPHABETICAL_ASC', 'ALPHABETICAL_DESC', 'COST_ASC', 'COST_DESC', 'CREATED_ASC', 'CREATED_DESC'].includes(sortByString)) {
            res.statusMessage = 'Bad Request: Invalid sortBy parameter';
            res.status(400).send();
            return;
        }
        if (typeof supporterId !== 'undefined' && isNaN(+supporterId)) {
            res.statusMessage = "Bad Request: Invalid supporterId";
            res.status(400).send();
            return;
        }
        if (typeof q !== 'undefined' && q.length === 0) {
            res.statusMessage = "Bad Request: Empty q term";
            res.status(400).send();
            return;
        }
        const petitions = await petitionModel.getPetitions( q, categoryIds, supportingCost, ownerId, supporterId, sortBy);
        if (isNaN(startIndex)) {
            startIndex = 0;
        }
        if (isNaN(count)) {
            count = petitions.length;
        }
        res.statusMessage = "OK";
        res.status(200).send({petitions: petitions.slice(startIndex, count), count: petitions.length});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const petitionId = +req.params.id;
        if (isNaN(petitionId)) {
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        const petitionDetail = await petitionModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found. No petition with id";
            res.status(404).send();
            return;
        }
        const tiers = await petitionModel.getSupportTiersByPetitionId(petitionId);
        petitionDetail[0].supportTiers = tiers
        res.statusMessage = "OK";
        res.status(200).send(petitionDetail[0]);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const { title, description, categoryId, supportTiers } = req.body;
        const dateTime = new Date();
        const validation = await validator.validate(schemas.petition_post, req.query);
        if (!validation) {
            res.statusMessage = 'Bad Request: Validation failed';
            res.status(400).send();
            return;
        }
        if (categoryId === undefined) {
            res.statusMessage = 'Error: Invalid category id';
            res.status(401).send();
            return;
        }
        if (typeof categoryId === 'string') {
            res.statusMessage = "Bad Request: Invalid category id";
            res.status(400).send();
            return;
        }
        const categories = await petitionModel.getCategoryIds();
        if (!categories.includes(categoryId)) {
            res.statusMessage = 'Bad Request: Invalid category id';
            res.status(400).send();
            return;
        }
        if (title.length === 0) {
            res.statusMessage = 'Bad Request: Title is missing';
            res.status(400).send();
            return;
        }
        let categoryIdExists = false;
        for (const category of categories) {
            if (category.id === categoryId) {
                categoryIdExists = true;
                break;
            }
        }
        if (!categoryIdExists) {
            res.statusMessage = 'Bad Request: Invalid category id';
            res.status(400).send();
            return;
        }
        if (title.length > 128) {
            res.statusMessage = 'Bad Request: Title exceeds maximum length';
            res.status(400).send();
            return;
        }
        const titleUnique = await petitionModel.checkPetitionTitleUnique(title);
        if (titleUnique.length !== 0) {
            res.statusMessage = 'Bad Request: Title is not unique';
            res.status(400).send();
            return;
        }
        if (!Array.isArray(supportTiers) || supportTiers.length < 1 || supportTiers.length > 3) {
            res.statusMessage = 'Bad Request: Support tiers must be between 1 and 3 (inclusive)';
            res.status(400).send();
            return;
        }
        const supportTierTitles = new Set<string>();
        for (const tier of supportTiers) {
            if (!tier.title || !tier.description || tier.cost === undefined) {
                res.statusMessage = 'Bad Request: Invalid support tier structure';
                res.status(400).send();
                return;
            }
            if (supportTierTitles.has(tier.title)) {
                res.statusMessage = 'Forbidden: Support tier titles must be unique';
                res.status(403).send();
                return;
            }
            supportTierTitles.add(tier.title);
        }
        const validToken = await petitionModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const ownerId = validToken[0].userId;
        const petition = await petitionModel.addNewPetition(title, description, categoryId, dateTime, ownerId);
        await Promise.all(supportTiers.map(tier =>
            petitionModel.addSupportTier(petition.insertId, tier.title, tier.description, tier.cost)
        ));
        res.statusMessage = "Created";
        res.status(201).send({ petitionId: petition.insertId });
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = await validator.validate(schemas.petition_patch, req.body);
        if (!validation) {
            res.statusMessage = 'Bad Request: Validation failed';
            res.status(400).send();
            return;
        }
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const {title, description, categoryId } = req.body;
        const validToken = await petitionModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId)) {
            res.statusMessage = "Not Found: No petition with specified Id";
            res.status(404).send();
            return;
        }
        const petitionDetail = await petitionModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: Petition does not exist";
            res.status(404).send();
            return;
        }
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may change it";
            res.status(403).send();
            return;
        }
        if (categoryId !== undefined) {
            const categories = await petitionModel.getCategoryIds();
            let categoryIdExists = false;
            for (const category of categories) {
                if (category.id === categoryId) {
                    categoryIdExists = true;
                    break;
                }
            }
            if (!categoryIdExists) {
                res.statusMessage = 'Bad Request: Invalid category id';
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
            const titleUnique = await petitionModel.checkPetitionTitleUnique(title);
            if (titleUnique.length !== 0) {
                res.statusMessage = 'Forbidden: Title is not unique';
                res.status(403).send();
                return;
            }
        }
        if (description !== undefined) {
            if (description === "") {
                res.statusMessage = 'Bad Request: Description is missing';
                res.status(400).send();
                return;
            }
        }
        if (categoryId !== undefined) {
            if (typeof categoryId === 'string') {
                res.statusMessage = "Bad Request: Invalid category id";
                res.status(400).send();
                return;
            }
            const validCategory = await petitionModel.checkCategoryValid(categoryId);
            if (!validCategory) {
                res.statusMessage = 'Bad Request: Category id does not reference an existing category';
                res.status(400).send();
                return;
            }
        }
        await petitionModel.editPetition(petitionId, title, description, categoryId);
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

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try {
        const authToken = req.header('X-Authorization');
        const petitionId = +req.params.id;
        const validToken = await petitionModel.checkValidToken(authToken);
        if (authToken === undefined || validToken.length === 0) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (isNaN(petitionId)) {
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        const supporterExist = await petitionModel.checkSupporterExist(petitionId);
        if (supporterExist.length > 0) {
            res.statusMessage = "Forbidden: Can not delete a petition with one or more supporters";
            res.status(403).send();
            return;
        }
        const petitionDetail = await petitionModel.findPetitionById(petitionId);
        if (petitionDetail.length === 0) {
            res.statusMessage = "Not Found: No petition with specified ID";
            res.status(404).send();
            return;
        }
        if (petitionDetail[0].ownerId !== validToken[0].userId) {
            res.statusMessage = "Forbidden: Only the owner of a petition may delete it";
            res.status(403).send();
            return;
        }
        await petitionModel.deletePetition(petitionId);
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try {
        const category = await petitionModel.getCategories();
        res.statusMessage = "OK";
        res.status(200).send(category);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export { getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories };