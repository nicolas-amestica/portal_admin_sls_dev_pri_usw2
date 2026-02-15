import * as S3 from "../../../libs/s3-v3";
import { success, unsuccessful } from "../../../helpers/responses";
import { standardMiddleware } from "../../../libs/middleware/index.js";

const { BUCKET_INFO_GI } = process.env;

const handler = async (event) => {
  console.log("event ==>", event);
  const action = "Obtención de objeto en S3.";
  const queryParams = event.queryParams;    const { key } = queryParams || {};
    if (!key) {
      return unsuccessful(
        400,
        { message: "Identificador de objeto inválido." },
        action
      );
    }

    const params = {
      Bucket: BUCKET_INFO_GI,
      Key: key,
    };

    const url = await S3.getObject(params);

    return success(200, url, action);
};

export const main = standardMiddleware(handler);
