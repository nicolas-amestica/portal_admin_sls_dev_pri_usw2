import { getAWSConfigs } from './configs';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

let s3;

const initClient = async () => {
  const config = await getAWSConfigs();
  console.log(config);
  s3 = new S3Client(config);
};

export const putObject = async (params) => {
  if (!s3) await initClient();
  const command = new PutObjectCommand(params);
  const response = await s3.send(command);
  return response;
};

export const getObject = async (params) => {
  if (!s3) await initClient();
  const command = new GetObjectCommand(params);
  const response = await s3.send(command);
  return response;
};