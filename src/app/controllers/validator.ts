import Ajv from 'ajv';
const ajv = new Ajv({removeAdditional: 'all', strict: false});

ajv.addFormat("email", /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
ajv.addFormat('password', /^.{6,}$/);
ajv.addFormat("integer", /^\d+$/);

/**
 *  Returns 'true' when the data is valid.
 *  If the data isn't valid, it returns error message.
 * @param schema
 * @param data
 */
const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if(!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}

export {validate}