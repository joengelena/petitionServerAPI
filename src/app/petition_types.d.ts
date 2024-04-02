type Petition = {
    petitionId: number,
    title: string,
    description: string,
    creationDate: string,
    imageFilename: string, // Default Null
    ownerId: number,
    categoryId: number,
    supportTiers: string,
    authToken: string
}