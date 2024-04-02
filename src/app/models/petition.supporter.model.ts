import { getPool } from '../../config/db';
import Logger from '../../config/logger';

const getAllSupporters = async (petitionId: number): Promise<Supporter[]> => {
    Logger.info(`Getting ${petitionId} petition's supporter information`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT
        s.id AS supportId,
        s.support_tier_id AS supportTierId,
        s.message, s.user_id AS supporterId,
        u.first_name AS supporterFirstName,
        u.last_name AS supporterLastName,
        s.timestamp
    FROM
        supporter s
    LEFT JOIN
        \`user\` u ON s.user_id = u.id
    WHERE
        s.petition_id = ?
    ORDER BY
        s.timestamp DESC`;
    const [ supporter ] = await conn.query( query, [ petitionId ]);
    await conn.release();
    return supporter;
}

const findPetitionById = async (petitionId: number): Promise<Petition[]> => {
    Logger.http(`Getting the petition ${petitionId}`);
    const conn = await getPool().getConnection();
    const query = `SELECT id as ownerId FROM petition WHERE id = ?`;
    const [ petitions ] = await conn.query ( query, [ petitionId ]);
    await conn.release();
    return petitions;
}

const supportedTiers = async (petitionId: number, supportTierId: number, userId: number): Promise<any> => {
    Logger.http(`Checking if the user is supporting one tier once`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT
        COUNT(*)
    FROM
        supporter
    WHERE
        petition_id = ? AND support_tier_id = ? AND user_id = ?`;
    const [ result ] = await conn.query ( query, [ petitionId, supportTierId, userId ]);
    await conn.release();
    return result[0].count > 0;
}

const supportTierExist = async (petitionId: number, supportTierId: number): Promise<any> => {
    Logger.http(`Checking if the user is supporting one tier once`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT
        COUNT(*)
    FROM
        support_tier
    WHERE
        petition_id = ? AND id = ?`;
    const [ result ] = await conn.query ( query, [ petitionId, supportTierId ]);
    await conn.release();
    return result[0].count > 0;
}

const yourOwnPetition = async (petitionId: number): Promise<Petition[]> => {
    Logger.http(`Checking if the user is supporting one tier once`);
    const conn = await getPool().getConnection();
    const query = `SELECT owner_id as ownerId FROM petition WHERE id = ?`;
    const [ result ] = await conn.query ( query, [ petitionId ]);
    await conn.release();
    return result;
}


const addSupporter = async (petitionId: number, supportTierId: number, userId: number, message: string, timestamp: any): Promise<Supporter[]> => {
    Logger.info(`Support the ${petitionId} petition`);
    const conn = await getPool().getConnection();
    const query = `INSERT INTO supporter (petition_id, support_tier_id, user_id, message, timestamp) values (?, ?, ?, ?, ?)`;
    const [ supporter ] = await conn.query( query, [ petitionId, supportTierId, userId, message, timestamp ]);
    await conn.release();
    return supporter;
}

export { getAllSupporters, addSupporter, supportTierExist, findPetitionById, supportedTiers, yourOwnPetition }