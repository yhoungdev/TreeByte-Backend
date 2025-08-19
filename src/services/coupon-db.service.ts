import { 
  Coupon, 
  CouponStatus, 
  CreateCouponDTO, 
  UpdateCouponDTO,
  CouponFilters,
  CouponQueryOptions,
  CouponQueryResult,
  CouponWithRelations
} from '@/types/coupon';

type QueryResult<T = any> = { rows: T[] };
type Db = { query: (text: string, params?: unknown[]) => Promise<QueryResult> };

// Helper to map database rows to Coupon objects
const mapRowToCoupon = (r: any): Coupon => ({
  id: r.id,
  user_id: r.user_id,
  project_id: r.project_id,
  purchase_id: Number(r.purchase_id),
  token_id: BigInt(r.token_id),
  metadata_url: r.metadata_url ?? null,
  metadata_hash: r.metadata_hash ?? null,
  contract_address: r.contract_address ?? null,
  activity_type: r.activity_type ?? null,
  business_name: r.business_name ?? null,
  location: r.location ?? null,
  status: r.status,
  // Fix: expirationDate should always have a value from the database
  expiration_date: r.expiration_date ? new Date(r.expiration_date).toISOString() : (() => {
    throw new Error('Coupon expiration_date is required but missing from database');
  })(),
  redemption_code: r.redemption_code ?? null,
  redeemed_at: r.redeemed_at ? new Date(r.redeemed_at).toISOString() : null,
  created_at: r.created_at ? new Date(r.created_at).toISOString() : (() => {
    throw new Error('Coupon created_at is required but missing from database');
  })(),
  updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : (() => {
    throw new Error('Coupon updated_at is required but missing from database');
  })(),
});

// Validation helper
function assertFuture(iso: string, field = 'expirationDate') {
  const when = new Date(iso).getTime();
  if (Number.isNaN(when) || when <= Date.now()) {
    throw new Error(`${field} must be a valid future datetime`);
  }
}

// Factory function to create the coupon service
export const createCouponDbService = (db: Db) => {
  const createCoupon = async (dto: CreateCouponDTO): Promise<Coupon> => {
    assertFuture(dto.expiration_date, 'expirationDate');
    const sql = `
      INSERT INTO coupons (
        user_id, project_id, purchase_id, token_id,
        metadata_url, metadata_hash, contract_address,
        activity_type, business_name, location,
        expiration_date, redemption_code
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;
    const params = [
      dto.user_id, dto.project_id, dto.purchase_id, dto.token_id,
      dto.metadata_url ?? null, dto.metadata_hash ?? null, dto.contract_address ?? null,
      dto.activity_type ?? null, dto.business_name ?? null, dto.location ?? null,
      dto.expiration_date, dto.redemption_code ?? null,
    ];
    const { rows } = await db.query(sql, params);
    if (!rows[0]) throw new Error('Failed to insert coupon');
    return mapRowToCoupon(rows[0]);
  };

  const getCouponById = async (id: string): Promise<Coupon | null> => {
    const { rows } = await db.query('SELECT * FROM coupons WHERE id = $1;', [id]);
    return rows[0] ? mapRowToCoupon(rows[0]) : null;
  };

  const getCouponByTokenId = async (tokenId: number): Promise<Coupon | null> => {
    const { rows } = await db.query('SELECT * FROM coupons WHERE token_id = $1;', [tokenId]);
    return rows[0] ? mapRowToCoupon(rows[0]) : null;
  };

  const getCouponsByUserId = async (
    userId: string,
    options?: CouponQueryOptions
  ): Promise<CouponQueryResult> => {
    let sql = 'SELECT * FROM coupons WHERE user_id = $1';
    const params: unknown[] = [userId];

    // Add ordering
    if (options?.sort_by) {
      const direction = options.sort_order === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${options.sort_by} ${direction}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }

    // Add filters
    if (options?.filters?.status) {
      params.push(options.filters.status);
      sql += ` AND status = $${params.length}`;
    }
    
    // Add pagination
    if (options?.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
      if (options.offset) {
        params.push(options.offset);
        sql += ` OFFSET $${params.length}`;
      }
    }

    const { rows } = await db.query(sql, params);
    const data = rows.map(mapRowToCoupon);

    // Get total count for pagination
    const countResult = await db.query('SELECT COUNT(*) FROM coupons WHERE user_id = $1', [userId]);
    const totalCount = parseInt(countResult.rows[0].count);
    const hasMore = options?.limit ? (options.offset || 0) + options.limit < totalCount : false;
    const nextOffset = hasMore ? (options?.offset || 0) + (options?.limit || 0) : undefined;

    return {
      data,
      total_count: totalCount,
      has_more: hasMore,
      next_offset: nextOffset
    };
  };

  const updateCouponStatus = async (
    id: string, 
    next: Extract<CouponStatus, 'redeemed' | 'expired'>
  ): Promise<Coupon> => {
    // Enforce transitions: active -> redeemed|expired only
    const { rows: curRows } = await db.query('SELECT id, status FROM coupons WHERE id = $1;', [id]);
    if (!curRows[0]) throw new Error('Coupon not found');
    const current: CouponStatus = curRows[0].status;
    if (current !== 'active') {
      throw new Error(`Invalid status transition: ${current} -> ${next}`);
    }
    
    const sql = next === 'redeemed'
      ? `UPDATE coupons SET status = 'redeemed', redeemed_at = NOW() WHERE id = $1 RETURNING *;`
      : `UPDATE coupons SET status = 'expired' WHERE id = $1 RETURNING *;`;
    
    const { rows } = await db.query(sql, [id]);
    return mapRowToCoupon(rows[0]);
  };

  const getActiveCoupons = async (options?: CouponQueryOptions): Promise<CouponQueryResult> => {
    let sql = "SELECT * FROM coupons WHERE status = 'active' AND expiration_date > NOW()";
    const params: unknown[] = [];

    // Add ordering
    const sortColumn = (() => { switch (options?.sort_by) {
       case 'created_at':
        case 'expiration_date':
        case 'token_id':
        case 'status':
            return options.sort_by;
        default:
            return 'created_at';
        }
      })();
      const direction = options?.sort_order === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${sortColumn} ${direction}`;


    // Add pagination
    if (options?.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
      if (options.offset) {
        params.push(options.offset);
        sql += ` OFFSET $${params.length}`;
      }
    }

    const { rows } = await db.query(sql, params);
    const data = rows.map(mapRowToCoupon);

    // Get total count
    const countResult = await db.query("SELECT COUNT(*) FROM coupons WHERE status = 'active' AND expiration_date > NOW()");
    const totalCount = parseInt(countResult.rows[0].count);
    const hasMore = options?.limit ? (options.offset || 0) + options.limit < totalCount : false;
    const nextOffset = hasMore ? (options?.offset || 0) + (options?.limit || 0) : undefined;

    return {
      data,
      total_count: totalCount,
      has_more: hasMore,
      next_offset: nextOffset
    };
  };

  const getExpiredCoupons = async (options?: CouponQueryOptions): Promise<CouponQueryResult> => {
    let sql = "SELECT * FROM coupons WHERE status = 'expired' OR expiration_date <= NOW()";
    const params: unknown[] = [];

    const where: string[] = ['user_id = $1'];
    if (options?.filters?.status) { params.push(options.filters.status); where.push(`status = $${params.length}`); }
    if (options?.filters?.activity_type) { params.push(options.filters.activity_type); where.push(`activity_type = $${params.length}`); }
    if (options?.filters?.expires_before) { params.push(options.filters.expires_before); where.push(`expiration_date < $${params.length}`); }
    if (options?.filters?.expires_after) { params.push(options.filters.expires_after); where.push(`expiration_date >= $${params.length}`); }
    if (options?.filters?.token_ids) { params.push(options.filters.token_ids); where.push(`token_id = $${params.length}`); }

    sql = `SELECT * FROM coupons WHERE ${where.join(' AND ')}`;

    // Add ordering
    if (options?.sort_by) {
      const direction = options.sort_order === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${options.sort_by} ${direction}`;
    } else {
      sql += ' ORDER BY expiration_date DESC';
    }

    // Add pagination
    if (options?.limit) {
      params.push(options.limit);
      sql += ` LIMIT $${params.length}`;
      if (options.offset) {
        params.push(options.offset);
        sql += ` OFFSET $${params.length}`;
      }
    }


    const { rows } = await db.query(sql, params);
    const data = rows.map(mapRowToCoupon);

    // Get total count
    const countResult = await db.query("SELECT COUNT(*) FROM coupons WHERE status = 'expired' OR expiration_date <= NOW()");
    const totalCount = parseInt(countResult.rows[0].count);
    const hasMore = options?.limit ? (options.offset || 0) + options.limit < totalCount : false;
    const nextOffset = hasMore ? (options?.offset || 0) + (options?.limit || 0) : undefined;

    return {
      data,
      total_count: totalCount,
      has_more: hasMore,
      next_offset: nextOffset
    };
  };

  const updateCoupon = async (id: string, patch: UpdateCouponDTO): Promise<Coupon> => {
    // Fix: Check property presence and ensure it's a valid string
    if ('expiration_date' in patch && patch.expiration_date) {
      assertFuture(patch.expiration_date, 'expirationDate');
    }
    
    // Build dynamic SET clause safely
    const fields: string[] = [];
    const params: unknown[] = [];
    const push = (col: string, val: unknown) => { 
      params.push(val); 
      fields.push(`${col} = $${params.length}`); 
    };
    
    if ('metadata_url' in patch) push('metadata_url', patch.metadata_url ?? null);
    if ('metadata_hash' in patch) push('metadata_hash', patch.metadata_hash ?? null);
    if ('contract_address' in patch) push('contract_address', patch.contract_address ?? null);
    if ('activity_type' in patch) push('activity_type', patch.activity_type ?? null);
    if ('business_name' in patch) push('business_name', patch.business_name ?? null);
    if ('location' in patch) push('location', patch.location ?? null);
    if ('expiration_date' in patch && patch.expiration_date) push('expiration_date', patch.expiration_date);
    if ('redemption_code' in patch) push('redemption_code', patch.redemption_code ?? null);
    if ('redeemed_at' in patch) push('redeemed_at', patch.redeemed_at ?? null);
    
    if (fields.length === 0) {
      // No fields to update, just return existing coupon
      const existing = await getCouponById(id);
      if (!existing) throw new Error('Coupon not found');
      return existing;
    }
    
    params.push(id);
    const sql = `UPDATE coupons SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *;`;
    const { rows } = await db.query(sql, params);
    if (!rows[0]) throw new Error('Coupon not found or not updated');
    return mapRowToCoupon(rows[0]);
  };


  const redeemCoupon = async (id: string, location?: string): Promise<Coupon> => {
    let updated = await updateCouponStatus(id, CouponStatus.REDEEMED);
    if (location) {
      updated = await updateCoupon(id, { location });
    }
    return updated;
  };

  const bulkUpdateExpiredCoupons = async (): Promise<number> => {
    const { rows } = await db.query(
      "UPDATE coupons SET status = 'expired' WHERE status = 'active' AND expiration_date <= NOW() RETURNING id"
    );
    return rows.length;
  };

  const deleteCoupon = async (id: string): Promise<boolean> => {
    const { rows } = await db.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
    return rows.length > 0;
  };

  const getCouponStats = async (userId: string): Promise<{
    total: number;
    active: number;
    redeemed: number;
    expired: number;
  }> => {
    const { rows } = await db.query('SELECT status, expiration_date FROM coupons WHERE user_id = $1', [userId]);
    
    const stats = {
      total: rows.length,
      active: 0,
      redeemed: 0,
      expired: 0
    };

    const now = Date.now();

    rows.forEach((coupon: any) => {
     const expMillis = new Date(coupon.expiration_date).getTime();
     const isExpired = Number.isFinite(expMillis) && expMillis <= now;
     switch (coupon.status) {
       case 'active':
         if (isExpired) {
           stats.expired++;
         } else {
           stats.active++;
         }
         break;
       case 'redeemed':
         stats.redeemed++;
         break;
       case 'expired':
         stats.expired++;
         break;
     }
   });

    return stats;
  };

  return {
    createCoupon,
    getCouponById,
    getCouponByTokenId,
    getCouponsByUserId,
    updateCouponStatus,
    getActiveCoupons,
    getExpiredCoupons,
    updateCoupon,
    redeemCoupon,
    bulkUpdateExpiredCoupons,
    deleteCoupon,
    getCouponStats,
  };
};