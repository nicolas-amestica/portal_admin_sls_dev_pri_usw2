/* eslint-disable no-param-reassign */
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getAWSConfigs } from "./configs";

let dynamoDb;

const initClient = async () => {
  const config = await getAWSConfigs();

  dynamoDb = new DynamoDBClient(config);
};

export const query = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    const command = new QueryCommand(params);
    const { Items } = await dynamoDb.send(command);

    if (!Items || Items.length === 0) return null;
    return Items;
  } catch (e) {
    return e;
  }
};

export const getOne = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    const command = new GetCommand(params);
    const { Item } = await dynamoDb.send(command);

    if (!Item) return null;
    return Item;
  } catch (e) {
    return e;
  }
};

export const iterativeQuery = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    let lastEvaluatedKey = null;
    let items = [];
    do {
      const command = new QueryCommand({
        ...params,
        ExclusiveStartKey: lastEvaluatedKey || undefined,
      });
      // eslint-disable-next-line no-await-in-loop
      const { Items, LastEvaluatedKey } = await dynamoDb.send(command);
      items = [...items, ...(Items || [])];
      lastEvaluatedKey = LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return items;
  } catch (e) {
    return e;
  }
};

export const put = async (params) => {
  params = { ...params, ReturnConsumedCapacity: "TOTAL" };
  try {
    if (!dynamoDb) await initClient();
    const command = new PutCommand(params);
    await dynamoDb.send(command);
    if (!params?.Item) return null;
    return params.Item;
  } catch (e) {
    return e;
  }
};

export const remove = async (params) => {
  params = { ...params, ReturnValues: "ALL_OLD" };
  try {
    if (!dynamoDb) await initClient();
    const command = new DeleteCommand(params);
    const { Attributes } = await dynamoDb.send(command);

    if (!Attributes) return null;
    return params.Key;
  } catch (e) {
    return e;
  }
};

export const update = async (params) => {
  params = { ...params, ReturnValues: "ALL_NEW" };
  try {
    if (!dynamoDb) await initClient();
    const command = new UpdateCommand(params);
    const { Attributes } = await dynamoDb.send(command);

    if (!Attributes) return null;

    return Attributes;
  } catch (e) {
    return e;
  }
};

export const scan = async (params) => {
  try {
    if (!dynamoDb) await initClient();
    const command = new ScanCommand(params);
    const { Items } = await dynamoDb.send(command);

    if (!Items || Items.length === 0) return [];
    return Items.map((item) => unmarshall(item));
  } catch (e) {
    return e;
  }
};
