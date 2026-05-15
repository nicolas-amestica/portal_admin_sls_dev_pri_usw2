import { success } from '../../../helpers/responses.js';
import * as dynamoDbLib from '../../../libs/dynamodb-v3.js';
import { standardMiddleware } from '../../../libs/middleware/index.js';
import { buildTicketKeys } from '../helpers/fn-build-ticket.js';
import { normalizeTicketForResponse } from '../helpers/fn-normalize-ticket-response.js';
import { validateTicketPayload } from '../helpers/fn-validate-ticket-payload.js';
import { TICKET_STATUS } from '../constants/ticket-status.const.js';

const ACTION = 'Crear ticket';

/**
 * @description Crea un ticket en DynamoDB (Query-only modelo por período).
 */
const handler = async (event) => {
  const { content, priority, createdBy } = event.body;

  if (!createdBy?.id || !createdBy?.email || !createdBy?.name) {
    const err = new Error('createdBy con id, email y name es requerido');
    err.statusCode = 400;
    throw err;
  }

  validateTicketPayload({ content, priority });

  const now = new Date();
  const { id, pk, sk } = buildTicketKeys(now);
  const item = {
    pk,
    sk,
    id,
    content,
    priority,
    status: TICKET_STATUS.ABIERTO,
    comments: [],
    createdBy,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const result = await dynamoDbLib.put({
    TableName: process.env.DYNAMODB_TICKET_TABLE,
    Item: item,
  });

  return success(201, normalizeTicketForResponse(result), ACTION);
};

export const main = standardMiddleware(handler);
