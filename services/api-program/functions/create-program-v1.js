import { uuidv7 } from "uuidv7";
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { parseEventBody } from '../../../helpers/event-parser.js';
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = "Creación de programa de viaje.";

export const main = async (event) => {
  try {
    const { content, user } = parseEventBody(event);

    if (!content?.[0]) return unsuccessful(400, { message: "El contenido del programa es requerido." }, ACTION);

    const firstContent = content[0];

    if (!firstContent.type?.id) return unsuccessful(400, { message: "Falta el tipo de programa en la solicitud." }, ACTION);

    if (!firstContent.dates?.[0]) return unsuccessful(400, { message: "La fecha de inicio es requerida." }, ACTION);

    const id = uuidv7();
    const createdAt = new Date().toISOString();
    const startDate = firstContent.dates[0].split('T')[0];

    const result = await dynamoDbLib.put({
      TableName: DYNAMODB_PROGRAM_TABLE,
      ReturnConsumedCapacity: 'TOTAL',
      Item: {
        pk: PROGRAM_TABLE,
        sk: `PRG#${id}`,
        id,
        createdAt,
        content,
        user,
        status: 'pending',
        type: firstContent.type.id,
        startDate,
      },
    });

    return success(200, result, ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};