// import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { success, unsuccessful } from "../../../helpers/responses";

// const { DYNAMODB_PROGRAM_TABLE, PROGRAM_TABLE } = process.env;
const ACTION = "Enviar notificación";

export const main = async (event) => {
  console.log("Event ==> ", event);
  try {
    // const { sk, contract } = JSON.parse(event.body);

    // if (!sk) return unsuccessful(400, { message: "Falta el identificador del programa en la solicitud." }, ACTION);

    // const [program] = await dynamoDbLib.query({
    //   TableName: DYNAMODB_PROGRAM_TABLE,
    //   KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    //   ExpressionAttributeValues: { ':pk': PROGRAM_TABLE, ':sk': sk },
    //   ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' }
    // });

    // if (!program) return unsuccessful(404, { message: "Programa no encontrado." }, ACTION);

    // program.content[0] = {
    //   ...program.content[0],
    //   contract: {
    //     ...contract,
    //   }
    // };

    // await dynamoDbLib.put({ TableName: DYNAMODB_PROGRAM_TABLE, Item: program });

    return success(200, "Hola mundo", ACTION);
  } catch (e) {
    return unsuccessful(e.statusCode || 500, e, ACTION);
  }
};