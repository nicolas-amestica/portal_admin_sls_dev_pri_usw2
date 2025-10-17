import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import {resolvePromises} from '../../../helpers/allsettled';
import { uuidv7 } from "uuidv7";
import { success, unsuccessful } from "../../../helpers/responses";
import * as S3 from '../../../libs/s3-v3';

const parser = require('lambda-multipart-data-parser');

const {
  DYNAMODB_PROGRAM_TABLE,
  PROGRAM_TABLE_ID,
  BUCKET_INFO_GI
} = process.env;

const uploadFile = async (file) => {
  const extension = file.filename.split('.').pop().toLowerCase();
  const params = {
    Bucket: BUCKET_INFO_GI,
    Key: `balances/${uuidv7()}.${extension}`,
    Body: file.content,
    ContentType: file.contentType,
    ContentEncoding: file.encoding
  };
  
  try {
    const result = await S3.putObject(params);
    console.log("Archivo subido exitosamente:", result);
    return result;
  } catch (error) {
    console.error("Error subiendo archivo a S3:", error);
    throw error;
  }
};

const getProgramFromDynamodb = async ({ sortKey }) => {
    const query = {
        TableName: DYNAMODB_PROGRAM_TABLE,
        Key: { pk: PROGRAM_TABLE_ID, sk: sortKey },
    };

    console.log(query);
    
    const paperworkPromise = dynamoDbLib.getOne(query);
    const [paperwork] = await resolvePromises([paperworkPromise]);



    return paperwork;
};

export const main = async (event) => {
  // console.log("event ==>", event);
  const action = "Creación de balance del viaje.";
  const formPayload = await parser.parse(event);
  console.log("formPayload ==>", formPayload);
  const file = formPayload.files?.[0];  
  const requiredFields = ['sk', 'amount', 'files', 'paymentObservation'];
  const missing = requiredFields.filter((f) => !formPayload[f]);
  
  try {

    if (missing.length) return unsuccessful(400, { message: `Faltan campos requeridos: ${missing.join(', ')}` }, action);
    const { sk } = formPayload;
    const [program] = await getProgramFromDynamodb({ sortKey: sk });

    const fileUploaded = await uploadFile(file);



    // const params = {
    //   TableName: DYNAMODB_PROGRAM_TABLE,
    //   ReturnConsumedCapacity: 'TOTAL',
    //   KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    //   ExpressionAttributeValues: {
    //     ':pk': pk,
    //     ':sk': sk,
    //   },
    //   ExpressionAttributeNames: {
    //     '#pk': 'pk',
    //     '#sk': 'sk'
    //   }
    // };

    // const [result] = await dynamoDbLib.query(params);

    return success(200, program, action);
  } catch (e) {
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};