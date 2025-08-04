import jwt from 'jsonwebtoken';

import { success } from '../../helpers/responses';
import { getParameterStore } from '../../libs/ssm';

const { SECRET_KEY } = process.env;

/**
 * Validar que el token tenga permisos para acceder al método de la petición.
 *
 * @param {String} method - Método, se espera alguno de los siguientes: [GET, POST, PUT,PATCH, DELETE].
 * @param {string} allowances - Permisos, compuesto de una o varias letras que hacen referencias al CRUD.
 * @return {string} - Devuelve la llave[effect] del permiso: Allow o denegación: Deny.
 */
const validateAccessToMethod = (method, allowances) => {
  if (method === 'POST' && allowances.includes('c')) return 'Allow';
  if (method === 'GET' && allowances.includes('r')) return 'Allow';
  if (method === 'PUT' && allowances.includes('u')) return 'Allow';
  if (method === 'PATCH' && allowances.includes('u')) return 'Allow';
  if (method === 'DELETE' && allowances.includes('d')) return 'Allow';

  return 'Deny';
};

/**
 * Crea una política para permitir o denegar el permiso de ejecución de una función lambda.
 *
 * @param {string} effect - Efecto de la política pueden ser: Allow o Deny.
 * @param {string} resource - ARN del recurso en AWS, en este caso se espera el ARN de una función lambda.
 * @return {object} - Definición de una política de AWS para permitir o denegar permiso para ejecutar una función lambda mediante un apiGateway.
 */
const createPolicy = (effect, resource) => {
  const authResponse = {};
  authResponse.principalId = 'user';

  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
};

const validateAccessToEndpoint = (methodArn, endpoints) => {
  if(!endpoints){
    return "Allow";
  }
  const allow = endpoints.some((path) => methodArn.includes(path));
  return allow ? "Allow" : "Deny";
};

const validateAccess = (accessToMethod, accessToEndpoint) => {
  if (accessToMethod === "Deny" || accessToEndpoint === "Deny") return "Deny";
  return "Allow";
};

const generatePolicy = async (token, methodArn, method) => {
  try {
    const secretsKeys = [SECRET_KEY];
    const secrets = await getParameterStore(secretsKeys);

    const { Value: SECRET } = secrets.find((secret) => secret.Name === SECRET_KEY);
    const decoded = jwt.verify(token, SECRET);
    const payload = decoded.body;
    const allowances = payload.allowances.toLowerCase();
    const { endpoints } = payload;
    const accessToMethod = validateAccessToMethod(method, allowances);
    const accessToEndpoint = validateAccessToEndpoint(methodArn, endpoints);

    const conditionKey = validateAccess(accessToMethod, accessToEndpoint);

    if (conditionKey === 'Deny')
      console.log(`No tiene autorización para acceder al método ${method}`);

    return createPolicy(conditionKey, methodArn);
  } catch (error) {
    console.log('Error: el token recibido no pasó el proceso de validación');
    return createPolicy('Deny', methodArn);
  }
};

export const authorize = async (event) => {
  console.log(event);
  const { methodArn, authorizationToken } = event;
  const token = authorizationToken.replace('Bearer ', '');
  const httpMethod = methodArn.split('/')[2];
  try {
    const policy = await generatePolicy(token, methodArn, httpMethod);
    console.log('policy: ', policy);
    return policy;
  } catch (error) {
    console.log(error);
    return error.message;
  }
};

export const generateToken = async (event) => {
  const secretsKeys = [SECRET_KEY];
  const secrets = await getParameterStore(secretsKeys);

  const { Value: SECRET } = secrets.find((secret) => secret.Name === SECRET_KEY);
  const { allowances } = JSON.parse(event.body);
  const TIMEOUT = '365d';
  const token = jwt.sign({ body: { allowances } }, SECRET, { expiresIn: `${TIMEOUT}` });
  return success(200, { token }, 'generar token');
};
