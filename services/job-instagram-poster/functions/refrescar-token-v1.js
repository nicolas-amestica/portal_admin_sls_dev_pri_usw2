import { getParameterValue } from '../../../libs/parameter-store.js';
import http from '../helpers/instagram-api.js';

const SSM_KEY = process.env.IG_SECRET_KEY;

/**
 * Handler mensual: refresca el Long-Lived Token de Instagram
 * antes de que expire (vence a los 60 días).
 *
 * Trigger: EventBridge cron — día 1 de cada mes a las 10:00 UTC
 *
 * Meta Graph API endpoint:
 * GET /oauth/access_token?grant_type=ig_refresh_token&access_token={token}
 */
export const main = async () => {
  console.log('[ig-token-refresh] Iniciando refresco de Long-Lived Token');

  const igConfigRaw = await getParameterValue(SSM_KEY);
  const igConfig = JSON.parse(igConfigRaw);

  const newToken = await http.refreshLongLivedToken(igConfig.accessToken);

  // Actualizar el token en SSM Parameter Store
  const { SSMClient, PutParameterCommand } = await import('@aws-sdk/client-ssm');
  const ssm = new SSMClient({ region: process.env.AWS_REGION });

  await ssm.send(new PutParameterCommand({
    Name: SSM_KEY,
    Value: JSON.stringify({ ...igConfig, accessToken: newToken }),
    Type: 'SecureString',
    Overwrite: true,
  }));

  console.log('[ig-token-refresh] ✓ Token refrescado y almacenado en SSM');
  return { refreshed: true };
};
