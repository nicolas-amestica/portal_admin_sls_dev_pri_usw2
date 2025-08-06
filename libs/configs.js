import { fromIni } from "@aws-sdk/credential-providers";

const { AWS_REGION, STAGE, IS_OFFLINE } = process.env;

export const getAWSConfigs = async () => {
  let profile;
  if (STAGE === "dev") profile = `pa-${STAGE}`;
  if (STAGE === "qa") profile = `pa-${STAGE}`;
  if (STAGE === "prd") profile = `pa-${STAGE}`;

  if (IS_OFFLINE === "true")
    return { region: AWS_REGION, credentials: fromIni({ profile }) };

  return { region: AWS_REGION };
};
