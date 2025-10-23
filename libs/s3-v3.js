import { getAWSConfigs } from './configs';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

let s3;

const initClient = async () => {
  const config = await getAWSConfigs();
  s3 = new S3Client({ ...config, maxAttempts: 3 });
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
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
};
