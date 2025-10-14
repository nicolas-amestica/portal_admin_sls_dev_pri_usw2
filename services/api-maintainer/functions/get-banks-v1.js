import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_MAINTAINER_TABLE } = process.env;

export const main = async (event) => {
  console.log(event);
  const action = "Obtener bancos registrados.";
  const pk = "BNK#ACCOUNT";

  const params = {
    TableName: DYNAMODB_MAINTAINER_TABLE,
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeValues: {
      ":pk": pk,
    },
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
  };

  try {
    const result = dynamoDbLib.query(params);
    let [banks] = await resolvePromises([result]);

    if (banks)
      banks = banks.map(({ pk, sk, ...rest }) => rest);

    return success(200, banks, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
