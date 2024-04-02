"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const create = async (req: Request, res: Response): Promise<void> => {
//     Logger.http(`POST create a user with email, username, image, and password: ${req.body.email} ${req.body.first_name}
//         ${req.body.lastName} ${req.body.imageFilename} ${req.body.password} ${req.body.authToken}`);
//     const validation = await validate(schemas.user_register, req.body);
//     if (validation !== true) {
//         res.statusMessage = `Bad Request: ${validation.toString()}`;
//         res.status(400).send();
//         return;
//     }
//
//     const { email, first_name, last_name, image_filename, password, auth_token } = req.body;
//     try {
//         const result = await user.insert(email, first_name, last_name, image_filename, password, auth_token);
//         res.status(201).send({ "user_id": result.insertId });
//     } catch (err) {
//         res.status(500).send(`ERROR creating user with ${email}: ${err}`);
//     }
//
// };
//# sourceMappingURL=register.validator.js.map