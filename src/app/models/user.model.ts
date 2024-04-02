import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import {ResultSetHeader} from "mysql2";

const registerUser = async (email: string, firstName: string, lastName: string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`Registering a new user ${firstName} to the database`);
    const conn = await getPool().getConnection();
    const query = 'INSERT INTO \`user\` (email, first_name, last_name, password) values(?, ?, ?, ?)';
    const [ user ] = await conn.query( query, [email, firstName, lastName, password] );
    await conn.release();
    return user;
}

const updateUser = async (userId: number, email: string, firstName: string, lastName: string, newPassword: string): Promise<User[]> => {
    Logger.info(`Updating ${userId} user information`);
    const conn = await getPool().getConnection();
    let baseQuery = 'UPDATE \`user\` SET';
    let isFirstQuery = true;

    if (newPassword !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` password = '${newPassword}'`;
            isFirstQuery = false;
        } else {
            baseQuery += `, password = '${newPassword}'`;
        }
    }
    if (email !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` email = '${email}'`;
            isFirstQuery = false;
        } else {
            baseQuery += `, email = '${email}'`;
        }
    }
    if (firstName !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` first_name = '${firstName}'`;
            isFirstQuery = false;
        } else {
            baseQuery += `, first_name = '${firstName}'`;
        }
    }
    if (lastName !== undefined) {
        if (isFirstQuery) {
            baseQuery += ` last_name = '${lastName}'`;
        } else {
            baseQuery += `, last_name = '${lastName}'`;
        }
    }
    const query = baseQuery + ` WHERE id = ${userId}`;
    const [ update ] = await conn.query(query);
    await conn.release();
    return update;

}

const findUserByID = async (userId: number): Promise<User[]> => {
    Logger.info(`Getting ${userId} user information`);
    const conn = await getPool().getConnection();
    const query = 'SELECT email, first_name as firstName, last_name as lastName, auth_token as authToken FROM \`user\` WHERE id = ?';
    const [ user ] = await conn.query( query, [ userId ]);
    await conn.release();
    return user;
}


const checkEmailExistInDB = async (email: string): Promise<User[]> => {
    Logger.info(`Checking if ${email} already exist in the database`);
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
        email = ?`;
    const [ user ] = await conn.query ( query, [ email ]);
    await conn.release();
    return user;
}

const getUserByToken = async (authToken: string | string[]): Promise<User[]> => {
    Logger.http('Checking if the authenticate token is valid');
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
        auth_token = ?`;
    const [ token ] = await conn.query ( query, [ authToken ] );
    await conn.release();
    return token;
}

const addAuthToken = async (authToken: string | string[], email: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding new authenticate token to ${email}`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE \`user\` SET auth_token = ? WHERE email = ?';
    const [ token ] = await conn.query ( query, [ authToken, email ]);
    await conn.release();
    return token;
}

const deleteAuthToken = async (email: string): Promise<ResultSetHeader> => {
    Logger.info(`Deleting authenticate token ${email}`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE \`user\` SET auth_token = null WHERE email = ?';
    const [ token ] = await conn.query ( query, [ email ]);
    await conn.release();
    return token;
}

export { registerUser, updateUser, findUserByID, checkEmailExistInDB, getUserByToken, addAuthToken, deleteAuthToken }