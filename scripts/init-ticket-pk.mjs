#!/usr/bin/env node
/**
 * Crea en SSM el pk fijo de la tabla de tickets (una vez por stage).
 * Uso: node scripts/init-ticket-pk.mjs --stage dev
 */
import { parseArgs } from 'node:util';
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import { ulid } from 'ulid';

const { values } = parseArgs({
  options: {
    stage: { type: 'string', default: 'dev' },
    region: { type: 'string', default: 'us-west-2' },
  },
});

const stage = values.stage;
const region = values.region;
const name = `/pa/${stage}/ticket-table-pk`;
const value = `APP#INDOMITO_HUB#TIC#${ulid()}`;

process.env.AWS_PROFILE ||= `pa-${stage}`;
const client = new SSMClient({ region });

async function main() {
  try {
    await client.send(new GetParameterCommand({ Name: name }));
    console.log(`Ya existe ${name} — no se sobrescribe.`);
    process.exit(0);
  } catch (e) {
    if (e.name !== 'ParameterNotFound') {
      console.error(e);
      process.exit(1);
    }
  }

  await client.send(
    new PutParameterCommand({
      Name: name,
      Value: value,
      Type: 'String',
      Description: 'Partition key fija para tabla tickets (single-table)',
    }),
  );

  console.log(`Creado ${name} = ${value}`);
  console.log(`AWS_PROFILE=${process.env.AWS_PROFILE}`);
}

main();
