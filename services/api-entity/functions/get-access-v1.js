import { getAccessProfile } from "./access-profile";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { resolvePromises } from "../../../helpers/allsettled";
import { success, unsuccessful } from "../../../helpers/responses";

const { DYNAMODB_USER_TABLE } = process.env;

export const main = async (event) => {
  console.log(event);
  const action = "Obtener accesos del usuario.";
  const { userId } = event.queryStringParameters;

  const gsi = userId.split("#")[1];
  const params = {
    TableName: DYNAMODB_USER_TABLE,
    IndexName: "gsiOne-index",
    ReturnConsumedCapacity: "TOTAL",
    KeyConditionExpression: "#gsiOne = :gsiOne",
    ExpressionAttributeValues: {
      ":gsiOne": gsi,
    },
    ExpressionAttributeNames: {
      "#gsiOne": "gsiOne",
    },
  };

  try {
    const userPromise = dynamoDbLib.query(params);

    const [resultPromises] = await resolvePromises([userPromise]);

    if (!resultPromises[0]?.profiles)
      return unsuccessful(403, { message: "Acceso Restringido." }, action);

    const accessProfiles = [];

    for (const profile of resultPromises[0].profiles) {
      const access = await getAccessProfile(profile);
      if (!access)
        return unsuccessful(
          403,
          { message: "Al usuario le faltan accesos habilitados." },
          action,
        );
      accessProfiles.push(...access[0]?.access);
    }

    const singleAccess = resultPromises[0].access || [];
    let access = [];

    if (singleAccess.length > 0) access = [...singleAccess];

    if (accessProfiles.length > 0)
      accessProfiles.forEach((acc) => access.push(acc));

    if (!access && access.length === 0)
      return unsuccessful(403, { message: "Acceso Restringido." }, action);

    return success(200, access, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
