import Logger from "../../config/logger";
import {getPool} from "../../config/db";


const findUserByID = async (userId: number): Promise<User[]> => {
    Logger.info(`Getting ${userId} user information`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT
        id as userId,
        email,
        first_name as firstName,
        last_name as lastName,
        image_filename as imageFilename,
        password,
        auth_token as authToken
    FROM
        \`user\`
    WHERE
        id = ?`;
    const [ user ] = await conn.query( query, [ userId ]);
    await conn.release();
    return user;
}

const removeUserImage = async (userId: number, image: string): Promise<User[]> => {
    Logger.http(`Deleting ${userId} user's image`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE \`user\` SET image_filename = null WHERE id = ?';
    const [ update ] = await conn.query( query, [ userId, image ]);
    await conn.release();
    return update;
}

const addUserImage = async (userId: number, image: string): Promise<User[]> => {
    Logger.http(`Adding/Updating ${userId} user's image`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE \`user\` SET image_filename = ? WHERE id = ?';
    const [ update ] = await conn.query(query, [ image, userId ] );
    await conn.release();
    return update;
}

const findUserByAuthToken = async (authToken: string | string[]): Promise<User[]> => {
    Logger.info('Checking if the token is valid');
    const conn = await getPool().getConnection();
    const query = `SELECT id as userId FROM \`user\` WHERE auth_token = ?`;
    const [ token ] = await conn.query(query, [ authToken ]);
    await conn.release();
    return token;
}


export { findUserByID, removeUserImage, addUserImage, findUserByAuthToken }