// Core services
export * from './stellar-client.service';
export * from './error-handler.service';
export * from './connection-manager.service';

// Domain services
export * from './account.service';
export * from './wallet.service';
export * from './transaction.service';
export * from './asset.service';
export * from './trustline.service';

// Re-export commonly used instances
export { stellarClientService } from './stellar-client.service';
export { accountService } from './account.service';
export { walletService } from './wallet.service';
export { transactionService } from './transaction.service';
export { assetService } from './asset.service';
export { trustlineService } from './trustline.service';
export { connectionManager } from './connection-manager.service';