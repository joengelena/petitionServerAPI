type User = {
    /**
     * User id as defined by the database
     */
    userId: number,

    email: string,
    firstName: string,
    lastName: string,
    imageFilename: string, // Default Null
    password: string, // hashed password gets stored
    authToken: string
}