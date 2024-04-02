import Logger from "../../config/logger";
import {getPool} from "../../config/db";

const findPetitionById = async (petitionId: number): Promise<Petition[]> => {
    Logger.info(`Getting petition information for ${petitionId}`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT id as petitionId, image_filename as imageFilename, owner_id as ownerId FROM petition WHERE id = ?`;
    const [ petition ] = await conn.query(query, [ petitionId ]);
    await conn.release();
    return petition;
}

const checkValidToken = async (authToken: string | string[]): Promise<User[]> => {
    Logger.info('Checking if the token is valid');
    const conn = await getPool().getConnection();
    const query = 'SELECT id as userId FROM \`user\` WHERE auth_token = ?';
    const [ token ] = await conn.query(query, [ authToken ]);
    await conn.release();
    return token;
}

const addPetitionImage = async (petitionId: number, image: string): Promise<Petition[]> => {
    Logger.http(`Adding/Updating ${petitionId} petition's image`);
    const conn = await getPool().getConnection();
    const query = `UPDATE petition SET image_filename = ? WHERE id = ?`;
    const [ update ] = await conn.query(query, [ image, petitionId ] );
    await conn.release();
    return update;
}

export { findPetitionById, checkValidToken, addPetitionImage }




