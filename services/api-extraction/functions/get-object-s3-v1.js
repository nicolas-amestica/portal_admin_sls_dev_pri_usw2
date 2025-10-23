import * as S3 from "../../../libs/s3-v3";
import { success, unsuccessful } from "../../../helpers/responses";

const { BUCKET } = process.env;

const getFileUrl = async (key) => {
  const params = {
    Bucket: BUCKET,
    Key: key,
  };
  return await S3.getObject(params);
};

export const main = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de objeto en S3.";
  const queryParams = event.queryStringParameters;
  try {
    console.log("queryParams ==>", queryParams);

    const { key } = queryParams;
    if (!key) return unsuccessful(400, { message: "Identificador de objeto inválido." }, action);

    const url = await getFileUrl(key);

    console.log("URL ==>", url);

    return success(200, JSON.stringify({ url }), action, queryParams);
  } catch (error) {
    let { statusCode } = error;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, error, action);
  }
};
