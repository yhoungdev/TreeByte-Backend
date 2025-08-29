// A minimal adapter to satisfy createCouponDbService(Db) which expects a { query(sql, params) } API.
// Since Supabase JS client doesn't support raw SQL with parameter binding, we implement the minimal
// queries used by coupon-db.service via query builder equivalents.
import connectionManager from '@/lib/db/connection-manager';

type QueryResult<T = any> = { rows: T[] };

export const supabaseSqlAdapter = {
  async query(text: string, params: unknown[] = []): Promise<QueryResult> {
  const client = connectionManager.getClient();
    // Implement only the specific SQL patterns used in coupon-db.service
    // Pattern: SELECT * FROM coupons WHERE id = $1;
    if (/^\s*SELECT \* FROM coupons WHERE id = \$1;?\s*$/i.test(text)) {
      const id = params[0] as string;
      const { data, error } = await client.from('coupons').select('*').eq('id', id).limit(1);
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Pattern: SELECT * FROM coupons WHERE token_id = $1;
    if (/^\s*SELECT \* FROM coupons WHERE token_id = \$1;?\s*$/i.test(text)) {
      const tokenId = params[0] as string | number;
      const { data, error } = await client.from('coupons').select('*').eq('token_id', tokenId).limit(1);
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Pattern: UPDATE coupons SET status = 'redeemed', redeemed_at = NOW() WHERE id = $1 RETURNING *;
    if (/UPDATE coupons SET status = 'redeemed', redeemed_at = NOW\(\) WHERE id = \$1 RETURNING \*/i.test(text)) {
      const id = params[0] as string;
      const { data, error } = await client
        .from('coupons')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq('id', id)
        .select('*');
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Pattern: UPDATE coupons SET status = 'expired' WHERE id = $1 RETURNING *;
    if (/UPDATE coupons SET status = 'expired' WHERE id = \$1 RETURNING \*/i.test(text)) {
      const id = params[0] as string;
      const { data, error } = await client
        .from('coupons')
        .update({ status: 'expired' })
        .eq('id', id)
        .select('*');
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Pattern dynamic update built in updateCoupon
    if (/^UPDATE coupons SET .* WHERE id = \$\d+ RETURNING \*/i.test(text)) {
      // Extract fields and final param (id)
      // This branch is used only from updateCoupon; instead of parsing, we map from provided params order.
      const id = params[params.length - 1] as string;
      // Heuristic: map column names from SQL into values order
      const setMatch = text.match(/^UPDATE coupons SET (.*) WHERE id/i);
      const setClause = setMatch ? setMatch[1] : '';
      const columns = setClause.split(',').map((c) => c.trim().split('=')[0].trim());
      const values = params.slice(0, params.length - 1);
      const payload: Record<string, unknown> = {};
      columns.forEach((col, idx) => {
        payload[col] = values[idx];
      });
      const { data, error } = await client
        .from('coupons')
        .update(payload)
        .eq('id', id)
        .select('*');
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Pattern: INSERT INTO coupons (...) VALUES (...) RETURNING *;
    if (/^\s*INSERT INTO coupons \(/i.test(text)) {
      // Map params according to the insert order defined in coupon-db.service
      const [
        user_id, project_id, purchase_id, token_id,
        metadata_url, metadata_hash, contract_address,
        activity_type, business_name, location,
        expiration_date, redemption_code,
      ] = params as any[];
      const insertPayload = {
        user_id, project_id, purchase_id, token_id,
        metadata_url, metadata_hash, contract_address,
        activity_type, business_name, location,
        expiration_date, redemption_code,
      };
      const { data, error } = await client.from('coupons').insert(insertPayload).select('*');
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Pattern: INSERT INTO coupon_redemptions (...)
    if (/^\s*INSERT INTO coupon_redemptions \(/i.test(text)) {
      const [coupon_id, user_id, tx_hash, location, notes, business_verification, status] = params as any[];
      const { data, error } = await client
        .from('coupon_redemptions')
        .insert({ coupon_id, user_id, tx_hash, location, notes, business_verification, status })
        .select('id');
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Pattern: SELECT COUNT(*) FROM coupons WHERE user_id = $1
    if (/^\s*SELECT COUNT\(\*\) FROM coupons WHERE user_id = \$1\s*$/i.test(text)) {
      const userId = params[0] as string;
      const { count, error } = await client.from('coupons').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      if (error) throw new Error(error.message);
      return { rows: [{ count }] as any };
    }

    // Pattern: SELECT COUNT(*) FROM coupons WHERE status = 'active' AND expiration_date > NOW()
    if (/SELECT COUNT\(\*\) FROM coupons WHERE status = 'active' AND expiration_date > NOW\(\)/i.test(text)) {
      const { count, error } = await client
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gt('expiration_date', new Date().toISOString());
      if (error) throw new Error(error.message);
      return { rows: [{ count }] as any };
    }

    // Pattern: UPDATE coupons SET status = 'active'...'expired' bulk (used by bulkUpdateExpiredCoupons)
    if (/UPDATE coupons SET status = 'expired' WHERE status = 'active' AND expiration_date <= NOW\(\) RETURNING id/i.test(text)) {
      const nowIso = new Date().toISOString();
      const { data, error } = await client
        .from('coupons')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lte('expiration_date', nowIso)
        .select('id');
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    // Generic select * from coupons with optional where/order/limit/offset seen in service methods
    if (/^SELECT \* FROM coupons WHERE/i.test(text)) {
      // This path is used only for listing in service methods; skip for redemption path
      const { data, error } = await client.from('coupons').select('*');
      if (error) throw new Error(error.message);
      return { rows: data || [] };
    }

    throw new Error(`Unsupported SQL in supabase adapter: ${text}`);
  },
};
