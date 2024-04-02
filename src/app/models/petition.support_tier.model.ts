import Logger from "../../config/logger";
import {getPool} from "../../config/db";

const getSupportTierByPetitionId = async (petitionId: any): Promise<any> => {
    Logger.http(`Getting the petition ${petitionId} support tiers`);
    const conn = await getPool().getConnection();
    const query = `SELECT id, petition_id, title, description FROM support_tier WHERE petition_id = ?`;
    const [ supportTiers ] = await conn.query ( query, [ petitionId ]);
    await conn.release();
    return supportTiers;
}

const findPetitionById = async (petitionId: any): Promise<any> => {
    Logger.http(`Getting the petition ${petitionId}`);
    const conn = await getPool().getConnection();
    const query = `SELECT id, owner_id as ownerId FROM petition WHERE id = ?`;
    const [ petitions ] = await conn.query ( query, [ petitionId ]);
    await conn.release();
    return petitions;
}

const addSupportTier = async (petitionId: number, title: string, description: string, cost: number):Promise<any> => {
    Logger.http(`Adding the petition ${petitionId} support tiers`);
    const conn = await getPool().getConnection();
    const query = `INSERT INTO support_tier (petition_id, title, description, cost) VALUES (?, ?, ?, ?)`;
    const [ supportTier ] = await conn.query ( query, [ petitionId, title, description, cost ]);
    await conn.release();
    return supportTier;
}

const checkValidToken = async (authToken: string | string[]): Promise<User[]> => {
    Logger.info('Checking if the token is valid');
    const conn = await getPool().getConnection();
    const query = 'SELECT id as userId FROM \`user\` WHERE auth_token = ?';
    const [ token ] = await conn.query(query, [ authToken ]);
    await conn.release();
    return token;
}

const findSupporterByIds = async (petitionId: number, supportTierId: number): Promise<any> => {
    Logger.info('Checking if the token is valid');
    const conn = await getPool().getConnection();
    const query = 'SELECT petition_id as petitionId, support_tier_id as supportTierId FROM supporter WHERE petition_id = ? AND support_tier_id = ?';
    const [ supporter ] = await conn.query(query, [ petitionId, supportTierId ]);
    await conn.release();
    return supporter;
}

const deleteSupportTier = async (petitionId: number, supportTierId: number): Promise<any> => {
    Logger.http(`Deleting support tier with ${supportTierId}`);
    const conn = await getPool().getConnection();
    const query = 'DELETE FROM support_tier WHERE petition_id = ? AND id = ?';
    const [ supportTier ] = await conn.query(query, [ petitionId, supportTierId ]);
    await conn.release();
    return supportTier;
}

const supportTierExist = async (supportTierId: number): Promise<any> => {
    Logger.http(`Getting the petition ${supportTierId} support tiers`);
    const conn = await getPool().getConnection();
    const query = `SELECT id FROM support_tier WHERE id = ?`;
    const [ supportTier ] = await conn.query ( query, [ supportTierId ]);
    await conn.release();
    return supportTier;
}

const checkSupportTierTitleUnique = async (petitionId: number, title: string): Promise<any> => {
    Logger.http(`Checking if the title already exist in ${petitionId}`);
    const conn = await getPool().getConnection();
    const query = `SELECT id FROM support_tier WHERE petition_id = ? AND title = ?`;
    const [ supportTier ] = await conn.query ( query, [ petitionId, title ]);
    await conn.release();
    return supportTier;
}

const updateSupportTier = async (petitionId: number, supportTierId: number, title: string, description: string, cost: number): Promise<any> => {
    Logger.http(`Update support tier with ${supportTierId}`);
    const conn = await getPool().getConnection();
    let baseQuery = `UPDATE support_tier SET `;
    let isFirstQuery = true;
    if (title !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` title = '${title}'`;
            isFirstQuery = false;
        }
        baseQuery += `, title = '${title}'`;
    }
    if (description !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` description = '${description}'`;
            isFirstQuery = false;
        }
        baseQuery += `, description = '${description}'`;
    }
    if (cost !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` cost = '${cost}'`;
            isFirstQuery = false;
        }
        baseQuery += `, cost = '${cost}'`;
    }
    const query = baseQuery + 'WHERE id = ? AND petition_id = ?'
    const [ supportTier ] = await conn.query(query, [ petitionId, supportTierId ]);
    await conn.release();
    return supportTier;
}

export { getSupportTierByPetitionId, findPetitionById, addSupportTier, checkValidToken, findSupporterByIds, deleteSupportTier, supportTierExist, updateSupportTier, checkSupportTierTitleUnique }
