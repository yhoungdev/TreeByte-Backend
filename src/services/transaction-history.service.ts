import { transactionService } from '@/services/stellar';
import type { TransactionHistory } from '@/services/stellar/transaction.service';

export const getTransactionHistory = async (publicKey: string) => {
  const transactions = await transactionService.getTransactionHistory(publicKey, 10);

  return transactions.map((tx: TransactionHistory) => ({
    hash: tx.hash,
    asset_code: 'XLM', // This will need to be enhanced to get actual asset codes from operations
    amount: 'N/A', // This will need to be enhanced to get actual amounts from operations
    created_at: tx.created_at,
    memo: tx.memo,
    status: tx.successful ? 'Success' : 'Failed',
  }));
};
