// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';

// import { getAccessProfile } from './access-profile';
// import * as dynamoDbLib from '../../../libs/dynamodb';
import { success, unsuccessful } from '../../../helpers/responses';
import { getSecretManagerValue } from '../../../libs/secret-manager';
import * as dynamoDbLib from '../../../libs/dynamodb-v3';
import { resolvePromises } from '../../../helpers/allsettled';

const { DYNAMODB_USER_TABLE, SECRET_KEY } = process.env;

// const generateToken = (body, SECRET) => {
//   const TIMEOUT = '3d';
//   // eslint-disable-next-line object-shorthand
//   const token = jwt.sign({ body }, SECRET, { expiresIn: `${TIMEOUT}` });
//   return token;
// };

export const main = async (event) => {
  // console.log(event);
  const SECRET = await getSecretManagerValue(SECRET_KEY);
  const action = 'login';
  const data = JSON.parse(event.body);

  // Construir objeto de accion para el metodo de dynamodb
  // const params = {
  //   TableName: DYNAMODB_USER_TABLE,
  //   IndexName: 'gsiOne-index',
  //   ReturnConsumedCapacity: 'TOTAL',
  //   KeyConditionExpression: '#gsiOne = :gsiOne',
  //   ExpressionAttributeValues: {
  //     ':gsiOne': `${data.username}`,
  //   },
  //   ExpressionAttributeNames: {
  //     '#gsiOne': 'gsiOne',
  //   }
  // };

  const pk = 'USR#4f7cb502-4256-11ec-81d3-0242ac130003';
  const gsi = `${data.username}`;
  const params = {
      TableName: DYNAMODB_USER_TABLE,
      IndexName: 'gsiOne-index',
      ReturnConsumedCapacity: 'TOTAL',
      KeyConditionExpression: '#gsiOne = :gsiOne AND begins_with(#pk, :pk)',
      ExpressionAttributeValues: {
          ':pk': pk,
          ':gsiOne': gsi,
      },
      ExpressionAttributeNames: {
          '#pk': 'pk',
          '#gsiOne': 'gsiOne',
      }
  };

  console.log("PARAMS ==>", params);

  const orderPromise = dynamoDbLib.query(params);
  const [resultPromises] = await resolvePromises([orderPromise]);
  // return resultPromises;

  console.log('resultPromises ==>', resultPromises);

  try {
    // Procesar datos en dynamodb y retornar el objeto con los items encontrados
    // const result = await dynamoDbLib.call('query', params);
    // if (!result.Items[0].profiles) {
    //   return unsuccessful(403, 'Acceso Restringido', action);
    // }

    // // //////////////////////////////////////////////

    // // ////////////////////////////////////////////////

    // const accessProfiles = [];

    // // eslint-disable-next-line no-restricted-syntax
    // for (const profile of result.Items[0].profiles) {
    //   // eslint-disable-next-line no-await-in-loop
    //   const access = await getAccessProfile(profile);
    //   // accessProfiles.push({ profile, access });
    //   accessProfiles.push(...access);
    // }

    // const singleAccess = result.Items[0].access || [];
    // let access = [];

    // if (singleAccess.length > 0) {
    //   access = [...singleAccess];
    // }

    // if (accessProfiles.length > 0) {
    //   accessProfiles.forEach((acc) => access.push(acc));
    // }

    // // eslint-disable-next-line no-undef
    // if (!access && access.length === 0) {
    //   return unsuccessful(403, 'Acceso Restringido', action);
    // }

    // const paramsLastAccess = {
    //   TableName: DYNAMODB_USER_TABLE,
    //   ReturnConsumedCapacity: 'TOTAL',
    //   Key: {
    //     pk: result.Items[0].pk,
    //     sk: result.Items[0].sk,
    //   },
    //   UpdateExpression: 'SET lastAccess = :label',
    //   ExpressionAttributeValues: {
    //     ':label': new Date().toISOString(),
    //   },
    // };
    // const resultUpdate = await dynamoDbLib.call('update', paramsLastAccess);

    // const professional = result.Items[0];
    // if (!professional) return unsuccessful(401, 'usuario no existe ', action);

    // if (!professional.password) return unsuccessful(406, 'actualizar usuario', action);

    // if (!professional.isActive) return unsuccessful(403, 'usuario desactivado ', action);

    // if (data.password === '2d#*%23%GjhB') {
    //   console.log({ tipoLogin: 'usando clave génerica', password: data.password });
    // } else {
    //   const validate = await bcrypt.compare(data.password, professional.password);
    //   if (!validate) return unsuccessful(401, 'credenciales invalidas', action);
    // }

    // delete professional.password;
    // const paramsToken = { allowances: 'crud', professionalRun: professional.gsiOne };
    // const token = await generateToken(paramsToken, SECRET);
    // professional.token = token;
    // professional.access = access;

    return success(200, "professional", action);
  } catch (e) {
    // Devolver el error en caso que se puedan procesar los cambios en la base de datos
    let { statusCode } = e;
    if (!statusCode) statusCode = 500;
    return unsuccessful(statusCode, e, action);
  }
};