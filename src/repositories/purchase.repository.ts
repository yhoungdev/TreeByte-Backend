import { BaseRepository } from '@/lib/db/base-repository';
import { QueryBuilder } from '@/lib/db/query-builder';
import type { Purchase } from '@/types/database';

export class PurchaseRepository extends BaseRepository<Purchase> {
  constructor() {
    super('purchases');
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const data = await new QueryBuilder<Purchase>('purchases')
      .select('*')
      .where('user_id', 'eq', userId)
      .orderBy('purchase_date', 'desc')
      .paginate({ page, limit })
      .list();
    const total = await new QueryBuilder<Purchase>('purchases').count({ user_id: userId } as any);
    return { data, total, page, limit };
  }

  async projectStats(projectId: string) {
    // Note: Supabase JS v2 currently lacks server-side SQL builder for aggregates across many columns in one call.
    // We can fetch and reduce client-side or create Postgres RPC for analytics in future iteration.
    const purchases = await new QueryBuilder<Purchase>('purchases')
      .select('*')
      .where('project_id', 'eq', projectId)
      .list();
    const totalCount = purchases.length;
    const totalAmount = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { totalCount, totalAmount };
  }
}
