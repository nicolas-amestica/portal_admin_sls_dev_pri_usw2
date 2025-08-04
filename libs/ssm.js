import AWS from 'aws-sdk';

const {AWS_REGION, PROFILE, IS_OFFLINE} = process.env;

let ssm;
ssm = new AWS.SSM({region: AWS_REGION});

if (IS_OFFLINE === 'true') {
    const origin = new AWS.SharedIniFileCredentials({profile: PROFILE});
    ssm = new AWS.SSM({region: AWS_REGION, credentials: origin});
}

export const getParameterStore = async (secretsKeys) => {
    try {
        const {Parameters} = await ssm
            .getParameters({Names: secretsKeys, WithDecryption: true})
            .promise();

        if (!Parameters) return null;

        return Parameters;
    } catch (e) {
        console.error(e);
        return null;
    }
};
