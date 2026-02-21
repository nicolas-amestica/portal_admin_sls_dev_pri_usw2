import { success } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";
import { CachedDynamoDB, CacheKeys } from "../../../libs/cache/index.js";

const { DYNAMODB_PROGRAM_TABLE } = process.env;
const ACTION = "Actualización del programa.";

/**
 * Actualiza un programa en DynamoDB con los datos proporcionados y gestiona el caché.
 */
const handler = async (event) => {
    const { content, sk, pk, id, createdAt, user } = event.body;

    if (!sk) {
        const error = new Error('Falta el identificador del programa en la solicitud.')
        error.statusCode = 400;
        throw error;
    }

    const program = {
        pk: pk,
        sk: sk,
        id: id,
        createdAt: createdAt,
        updatedAt: new Date().toISOString(),
        content: content,
        status: 'pending',
        priority: 1,
        user: user,
        type: content[0].type.id,
        startDate: content[0].dates[0].split('T')[0],
    };

    const params = {
        TableName: DYNAMODB_PROGRAM_TABLE,
        ReturnConsumedCapacity: 'TOTAL',
        Item: program
    };
    const result = await CachedDynamoDB.put(params, CacheKeys.program(sk));

    return success(200, result, ACTION);
};

export const main = standardMiddleware(handler);
