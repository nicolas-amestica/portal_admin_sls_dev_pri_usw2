import { utils, write } from "xlsx";
import { MAP_TABLE_NAME } from "../../../helpers/mapper-tables";
import * as dynamoDbLib from "../../../libs/dynamodb-v3";
import { unsuccessful, success } from "../../../helpers/responses";

export const main = async (event) => {
  const action = "Extraer datos de tablas";

  try {
    if (!event.pathParameters)
      return unsuccessful(
        400,
        { message: "Faltan los pathParameters en la solicitud." },
        action
      );
    const pathParameters = event.pathParameters.pkName;

    const pk = MAP_TABLE_NAME[pathParameters]?.id;

    if (!pk)
      return unsuccessful(
        400,
        { message: "Ha ingresado un valor pk no válido." },
        action
      );

    const params = {
      TableName: MAP_TABLE_NAME[pathParameters]?.tableName,
      ReturnConsumedCapacity: "TOTAL",
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeValues: {
        ":pk": pk,
      },
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
    };

    const result = await dynamoDbLib.query(params);

    if (Array.isArray(result)) {
      result.forEach(item => {
        if (item.hasOwnProperty("content")) {
          item.content = JSON.stringify(item.content);
        }
      });
    } else if (result && result.hasOwnProperty("content")) {
      result.content = JSON.stringify(result.content);
    }

    const wb = utils.book_new();
    const ws = utils.json_to_sheet(result);
    utils.book_append_sheet(wb, ws, "Data");

    const excelBuffer = write(wb, { type: "buffer", bookType: "xlsx" });
    const base64Data = excelBuffer.toString("base64");

    const base64File = Buffer.from(base64Data, "base64").toString("base64");

    return success(200, { base64File }, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};
