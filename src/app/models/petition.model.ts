import { getPool } from '../../config/db';
import Logger from "../../config/logger";
import {ResultSetHeader} from "mysql2";

const checkCategoryValid = async (categoryId: any): Promise<any> => {
    Logger.http(`Checking if ${categoryId} category is valid`);
    const conn = await getPool().getConnection();
    const query = `SELECT name FROM category WHERE id IN (?)`;
    const [ category ] = await conn.query ( query, [ categoryId ]);
    await conn.release();
    return category;
}

const getPetitions = async (q: any, categoryId: any, supportingCost: any, ownerId: any, supporterId: any, sortBy: any)
    : Promise<Petition[]> => {
    let where = "";
    const conn = await getPool().getConnection();

    const queryParams: any[] = [];
    if (q) {
        where += ' AND (p.title LIKE ? OR p.description LIKE ?) ';
        queryParams.push(`%${q}%`, `%${q}%`);
    }
    if (categoryId && categoryId.length > 0) {
        where += 'AND category_id IN (?) ';
        queryParams.push(categoryId);
    }
    if (ownerId) {
        where += 'AND owner_id = ? ';
        queryParams.push(ownerId);
    }
    if (supporterId) {
        where += 'AND s.user_id = ? ';
        queryParams.push(+supporterId);
    }
    if (supportingCost) {
        where += 'AND (SELECT MIN(t.cost) FROM support_tier t WHERE p.id = t.petition_id) <= ? ';
        queryParams.push(+supportingCost);
    }
    let query = `
    SELECT
        p.id AS petitionId,
        p.title,
        ${supporterId ? 's.user_id AS supporterId,' : ''}
        p.category_id AS categoryId,
        p.owner_id AS ownerId,
        u.first_name AS ownerFirstName,
        u.last_name AS ownerLastName,
        COALESCE(supporter_count, 0) AS numberOfSupporters,
        p.creation_date AS creationDate,
        MIN(st.cost) AS supportingCost
    FROM
        petition p
    JOIN
        \`user\` u ON p.owner_id = u.id
    LEFT JOIN
        (
            SELECT petition_id, COUNT(*) AS supporter_count
            FROM supporter
            GROUP BY petition_id
        ) AS ps ON p.id = ps.petition_id
    LEFT JOIN
        support_tier st ON p.id = st.petition_id
    ${supporterId ? 'LEFT JOIN supporter s ON p.id = s.petition_id' : ''}
    WHERE 1=1 ${where}
    GROUP BY
        p.id, p.title, p.category_id, ${supporterId ? 's.user_id,' : ''} p.owner_id, u.first_name, u.last_name, p.creation_date`;
    switch (sortBy) {
        case 'ALPHABETICAL_ASC':
            query += ' ORDER BY p.title ASC, petitionId ASC';
            break;
        case 'ALPHABETICAL_DESC':
            query += ' ORDER BY p.title DESC, petitionId ASC';
            break;
        case 'COST_ASC':
            query += ' ORDER BY supportingCost ASC, petitionId ASC';
            break;
        case 'COST_DESC':
            query += ' ORDER BY supportingCost DESC, petitionId ASC';
            break;
        case 'CREATED_ASC':
            query += ' ORDER BY creationDate ASC, petitionId ASC';
            break;
        case 'CREATED_DESC':
            query += ' ORDER BY creationDate DESC, petitionId ASC';
            break;
        default:
            query += ' ORDER BY creationDate ASC, petitionId ASC';
            break;
    }
    const [ petitions ] = await conn.query(query, queryParams);
    await conn.release();
    return petitions;
}

const addNewPetition = async (title: string, description: string, categoryId: number, creationDate: any, ownerId: number ): Promise<ResultSetHeader> => {
    Logger.http('Adding a new petition');
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO petition (title, description, category_id, creation_date, owner_id) VALUES (?, ?, ?, ?, ?)';
    const [ petition ] = await conn.query( query, [title, description, categoryId, creationDate, ownerId ])
    await conn.release();
    return petition;
}

const addSupportTier = async (petitionId: number, title: string, description: string, cost: number): Promise<ResultSetHeader> => {
    Logger.http(`Adding support tier for petition ${petitionId}`);
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)';
    const [ supportTier ] = await conn.query(query, [petitionId, title, description, cost]);
    await conn.release();
    return supportTier;
}

const findPetitionById = async (petitionId: number): Promise<Petition[]> => {
    Logger.info(`Getting petition information for ${petitionId}`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT
        p.id AS petitionId,
        p.title,
        p.category_id AS categoryId,
        p.owner_id AS ownerId,
        u.first_name AS ownerFirstName,
        u.last_name AS ownerLastName,
        COUNT(sp.id) AS numberOfSupporters,
        p.creation_date AS creationDate,
        p.description,
        CAST(COALESCE(SUM(st.cost), 0) AS INT) AS moneyRaised
    FROM
        petition p
    JOIN \`user\` u ON
        p.owner_id = u.id
    LEFT JOIN supporter sp ON
        p.id = sp.petition_id
    LEFT JOIN support_tier st ON
        sp.support_tier_id = st.id
    WHERE
        p.id = ?
    GROUP BY
        p.id`;
    const [petition] = await conn.query(query, [petitionId]);
    await conn.release();
    return petition;
}

const checkPetitionTitleUnique= async (title: string): Promise<any> => {
    Logger.info(`Checking if ${title} is unique`);
    const conn = await getPool().getConnection();
    const query = 'SELECT title FROM petition WHERE title = ?';
    const [ result ] = await conn.query(query, [ title ]);
    await conn.release();
    return result;
}

const getCategories = async (): Promise<any> => {
    Logger.info('Getting all categories');
    const conn = await getPool().getConnection();
    const query = 'SELECT id as categoryID, name as categoryName from category'
    const [ category ] = await conn.query(query);
    await conn.release();
    return category;
}

const getCategoryIds = async (): Promise<any> => {
    Logger.info('Getting all categories');
    const conn = await getPool().getConnection();
    const query = 'SELECT id from category'
    const [ category ] = await conn.query(query);
    await conn.release();
    return category;
}

const checkValidToken = async (authToken: string | string[]): Promise<User[]> => {
    Logger.info('Checking if the token is valid');
    const conn = await getPool().getConnection();
    const query = 'SELECT id as userId FROM user WHERE auth_token = ?';
    const [ token ] = await conn.query(query, [ authToken ]);
    await conn.release();
    return token;
}

const editPetition = async (petitionId: number, title: string, description: string, categoryId: number): Promise<Petition[]> => {
    Logger.info(`Updating ${petitionId} petition information`);
    const conn = await getPool().getConnection();
    let baseQuery = 'UPDATE petition SET ';
    let isFirstQuery = true;

    if (title !== undefined) {
        if (isFirstQuery) {
            baseQuery += `title = '${title}'`;
            isFirstQuery = false;
        } else {
            baseQuery += `, title = '${title}'`;
        }
    }
    if (description !== undefined) {
        if (isFirstQuery) {
            baseQuery += `description = '${description}'`;
            isFirstQuery = false;
        } else {
            baseQuery += `, description = '${description}'`;
        }
    }
    if (categoryId !== undefined) {
        if (isFirstQuery) {
            baseQuery += `category_id = ${categoryId}`;
        } else {
            baseQuery += `, category_id = ${categoryId}`;
        }
    }
    const query = baseQuery + ` WHERE id = ${petitionId}`;
    const [ update ] = await conn.query(query);
    await conn.release();
    return update;
}

const deletePetition = async (petitionId: number): Promise<any> => {
    Logger.http(`Deleting petition with ${petitionId}`);
    const conn = await getPool().getConnection();
    const query = 'DELETE from petition where id = ?';
    const [ petition ] = await conn.query(query, [ petitionId ]);
    await conn.release();
    return petition;
}

const checkSupporterExist = async (petitionId: number): Promise<any> => {
    Logger.http(`Checking if the petition ${petitionId} has a supporter for any of its support tiers`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT s.user_id AS supporterId,
        s.petition_id AS petitionId,
        s.support_tier_id AS supportTierId
    FROM supporter s
    WHERE s.petition_id = ?`;
    const [ petition ] = await conn.query(query, [ petitionId ]);
    await conn.release();
    return petition;
}

const getSupportTiersByPetitionId = async (petitionId: any): Promise<any> => {
    Logger.http(`Getting the petition ${petitionId} support tiers`);
    const conn = await getPool().getConnection();
    const query = `SELECT title, description, cost, id as supportTierId FROM support_tier WHERE petition_id = ?`;
    const [ supportTiers ] = await conn.query ( query, [ petitionId ]);
    await conn.release();
    return supportTiers;
}



export { addNewPetition, getCategoryIds, findPetitionById, getPetitions, checkSupporterExist, checkPetitionTitleUnique, addSupportTier, checkCategoryValid, getCategories, checkValidToken, editPetition, deletePetition, getSupportTiersByPetitionId }
