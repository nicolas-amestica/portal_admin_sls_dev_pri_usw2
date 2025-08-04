// import * as dynamoDbLib from '../../../libs/dynamodb';

// const { DYNAMODB_USER_TABLE } = process.env;

// export const getAccessProfile = async (profile) => {
//     const paramsPerfil = {
//       TableName: DYNAMODB_USER_TABLE,
//       ReturnConsumedCapacity: 'TOTAL',
//       KeyConditionExpression: '#pk = :pk And begins_with(#sk, :sk)',
//       ExpressionAttributeValues: {
//         ':pk': 'PER#4f7cb502-4256-11ec-81d3-0242ac13000H',
//         ':sk': profile,
//       },
//       ExpressionAttributeNames: {
//         '#pk': 'pk',
//         '#sk': 'sk',
//       },
//     };
//     console.log(DYNAMODB_USER_TABLE)
//     const resultPerfil = await dynamoDbLib.call('query', paramsPerfil);
//     return resultPerfil.Items[0].access;
//   }