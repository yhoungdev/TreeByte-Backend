import { config } from '@/config/app-config';

export const STELLAR_CONFIG = {
  horizonURL: config.stellar.horizonUrl,
  friendbotURL: config.stellar.friendbotUrl || '',
  networkPassphrase: config.stellar.networkPassphrase,
  fundingAccountSecret: config.stellar.fundingAccountSecret || '',
};
