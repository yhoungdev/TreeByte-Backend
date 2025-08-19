
import type { Coupon, CouponStatus, CreateCouponDTO, UpdateCouponDTO } from '@/types/coupon';

type QueryResult<T = any> = { rows: T[] };
type Db = { query: (text: string, params?: unknown[]) => Promise<QueryResult> };

const mapRowToCoupon = (r: any): Coupon => ({
  id: r.id,
  userId: r.user_id,
  projectId: r.project_id,
  purchaseId: Number(r.purchase_id),
  tokenId: Number(r.token_id),
  metadataUrl: r.metadata_url ?? null,
  metadataHash: r.metadata_hash ?? null,
  contractAddress: r.contract_address ?? null,
  activityType: r.activity_type ?? null,
  businessName: r.business_name ?? null,
  location: r.location ?? null,
  status: r.status,
  expirationDate: r.expiration_date ? new Date(r.expiration_date).toISOString() : (() => {
    throw new Error('Coupon expiration_date is required but missing from database');
  })(),
  redemptionCode: r.redemption_code ?? null,
  redeemedAt: r.redeemed_at ? new Date(r.redeemed_at).toISOString() : null,
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : (() => {
    throw new Error('Coupon expiration_date is required but missing from database');
  })(),
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : (() => {
    throw new Error('Coupon expiration_date is required but missing from database');
  })(),
});

const assertFuture = (iso: string, field = 'expirationDate') => {
  const when = new Date(iso).getTime();
  if (Number.isNaN(when) || when <= Date.now()) {
    throw new Error(`${field} must be a valid future datetime`);
  }
};

export const createCouponDbService = (db: Db) => {
  const createCoupon = async (dto: CreateCouponDTO): Promise<Coupon> => {
    assertFuture(dto.expirationDate, 'expirationDate');
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
      dto.userId, dto.projectId, dto.purchaseId, dto.tokenId,
      dto.metadataUrl ?? null, dto.metadataHash ?? null, dto.contractAddress ?? null,
      dto.activityType ?? null, dto.businessName ?? null, dto.location ?? null,
      dto.expirationDate, dto.redemptionCode ?? null,
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

  const getCouponsByUserId = async (userId: string): Promise<Coupon[]> => {
    const { rows } = await db.query(
      'SELECT * FROM coupons WHERE user_id = $1 ORDER BY created_at DESC;',
      [userId],
    );
    return rows.map(mapRowToCoupon);
  };

  const updateCouponStatus = async (id: string, next: Extract<CouponStatus, 'redeemed' | 'expired'>): Promise<Coupon> => {
    // Enforce transitions: active -> redeemed|expired only
    const { rows: curRows } = await db.query('SELECT id, status FROM coupons WHERE id = $1;', [id]);
    if (!curRows[0]) throw new Error('Coupon not found');
    const current: CouponStatus = curRows[0].status;
    if (current !== 'active') {
      throw new Error(`Invalid status transition: ${current} -> ${next}`);
    }
    const sql =
      next === 'redeemed'
        ? `UPDATE coupons SET status = 'redeemed', redeemed_at = NOW() WHERE id = $1 RETURNING *;`
        : `UPDATE coupons SET status = 'expired' WHERE id = $1 RETURNING *;`;
    const { rows } = await db.query(sql, [id]);
    return mapRowToCoupon(rows[0]);
  };

  const getActiveCoupons = async (): Promise<Coupon[]> => {
    const { rows } = await db.query(
      "SELECT * FROM coupons WHERE status = 'active' AND expiration_date > NOW() ORDER BY expiration_date ASC;",
    );
    return rows.map(mapRowToCoupon);
  };

  const getExpiredCoupons = async (): Promise<Coupon[]> => {
    const { rows } = await db.query(
      "SELECT * FROM coupons WHERE status = 'expired' OR expiration_date <= NOW() ORDER BY expiration_date DESC;",
    );
    return rows.map(mapRowToCoupon);
  };

  // Optional generic updater (for metadata/location/expiration)
  const updateCoupon = async (id: string, patch: UpdateCouponDTO): Promise<Coupon> => {
    if (patch.expirationDate) assertFuture(patch.expirationDate, 'expirationDate');
    // Build dynamic SET clause safely
    const fields: string[] = [];
    const params: unknown[] = [];
    const push = (col: string, val: unknown) => { params.push(val); fields.push(`${col} = $${params.length}`); };
    if ('metadataUrl' in patch) push('metadata_url', patch.metadataUrl ?? null);
    if ('metadataHash' in patch) push('metadata_hash', patch.metadataHash ?? null);
    if ('contractAddress' in patch) push('contract_address', patch.contractAddress ?? null);
    if ('activityType' in patch) push('activity_type', patch.activityType ?? null);
    if ('businessName' in patch) push('business_name', patch.businessName ?? null);
    if ('location' in patch) push('location', patch.location ?? null);
    if ('expirationDate' in patch) push('expiration_date', patch.expirationDate!);
    if ('redemptionCode' in patch) push('redemption_code', patch.redemptionCode ?? null);
    if (fields.length === 0) return (await getCouponById(id))!;
    params.push(id);
    const sql = `UPDATE coupons SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *;`;
    const { rows } = await db.query(sql, params);
    if (!rows[0]) throw new Error('Coupon not found or not updated');
    return mapRowToCoupon(rows[0]);
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
  };
};
=======
import supabase from '@/lib/db/db';
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


export class CouponDbService {

  static async createCoupon(couponData: CreateCouponDTO): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create coupon: ${error.message}`);
    }

    return data as Coupon;
  }
 
  static async getCouponById(id: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; 
      }
      throw new Error(`Failed to get coupon by ID: ${error.message}`);
    }

    return data as Coupon;
  }

  static async getCouponByTokenId(tokenId: number): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('token_id', tokenId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; 
      }
      throw new Error(`Failed to get coupon by token ID: ${error.message}`);
    }

    return data as Coupon;
  }

  static async getCouponsByUserId(
    userId: string,
    options?: CouponQueryOptions
  ): Promise<CouponQueryResult> {
    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (options?.sort_by) {
      query = query.order(options.sort_by, {
        ascending: options.sort_order === 'asc'
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options?.filters) {
      query = this.applyFilters(query, options.filters);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
      if (options.offset) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get user coupons: ${error.message}`);
    }

    const totalCount = count || 0;
    const hasMore = options?.limit ? 
      (options.offset || 0) + options.limit < totalCount : false;
    const nextOffset = hasMore ? 
      (options?.offset || 0) + (options?.limit || 0) : undefined;

    return {
      data: data as Coupon[],
      total_count: totalCount,
      has_more: hasMore,
      next_offset: nextOffset
    };
  }

  static async updateCouponStatus(
    id: string,
    status: CouponStatus,
    redeemed_at?: string
  ): Promise<Coupon> {
    const updateData: Partial<Coupon> = { status };
   
    if (status === CouponStatus.REDEEMED) {
      updateData.redeemed_at = redeemed_at || new Date().toISOString();
    }

    if (status !== CouponStatus.REDEEMED) {
      updateData.redeemed_at = null;
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update coupon status: ${error.message}`);
    }

    return data as Coupon;
  }

  static async getActiveCoupons(options?: CouponQueryOptions): Promise<CouponQueryResult> {
    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .eq('status', CouponStatus.ACTIVE)
      .gt('expiration_date', new Date().toISOString());

    if (options?.filters) {
      query = this.applyFilters(query, options.filters);
    }

    if (options?.sort_by) {
      query = query.order(options.sort_by, {
        ascending: options.sort_order === 'asc'
      });
    } else {
      query = query.order('expiration_date', { ascending: true });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
      if (options.offset) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get active coupons: ${error.message}`);
    }

    const totalCount = count || 0;
    const hasMore = options?.limit ? 
      (options.offset || 0) + options.limit < totalCount : false;
    const nextOffset = hasMore ? 
      (options?.offset || 0) + (options?.limit || 0) : undefined;

    return {
      data: data as Coupon[],
      total_count: totalCount,
      has_more: hasMore,
      next_offset: nextOffset
    };
  }


  static async getExpiredCoupons(options?: CouponQueryOptions): Promise<CouponQueryResult> {
    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .lt('expiration_date', new Date().toISOString());

    if (options?.filters) {
      query = this.applyFilters(query, options.filters);
    }

    if (options?.sort_by) {
      query = query.order(options.sort_by, {
        ascending: options.sort_order === 'asc'
      });
    } else {
      query = query.order('expiration_date', { ascending: false });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
      if (options.offset) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get expired coupons: ${error.message}`);
    }

    const totalCount = count || 0;
    const hasMore = options?.limit ? 
      (options.offset || 0) + options.limit < totalCount : false;
    const nextOffset = hasMore ? 
      (options?.offset || 0) + (options?.limit || 0) : undefined;

    return {
      data: data as Coupon[],
      total_count: totalCount,
      has_more: hasMore,
      next_offset: nextOffset
    };
  }

 
  static async updateCoupon(id: string, updateData: UpdateCouponDTO): Promise<Coupon> {
    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update coupon: ${error.message}`);
    }

    return data as Coupon;
  }

 static async redeemCoupon(id: string, location?: string): Promise<Coupon> {
    const updateData: UpdateCouponDTO = {
      status: CouponStatus.REDEEMED,
      redeemed_at: new Date().toISOString()
    };

    if (location) {
      updateData.location = location;
    }

    return this.updateCoupon(id, updateData);
  }


  static async getCouponWithRelations(id: string): Promise<CouponWithRelations | null> {
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        user:user_id(id, email, name),
        project:project_id(id, name, description),
        purchase:purchase_id(id, amount, currency, transaction_hash)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get coupon with relations: ${error.message}`);
    }

    return data as CouponWithRelations;
  }

 
  static async bulkUpdateExpiredCoupons(): Promise<number> {
    const { data, error } = await supabase
      .from('coupons')
      .update({ status: CouponStatus.EXPIRED })
      .eq('status', CouponStatus.ACTIVE)
      .lt('expiration_date', new Date().toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to bulk update expired coupons: ${error.message}`);
    }

    return data.length;
  }

  static async deleteCoupon(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete coupon: ${error.message}`);
    }

    return true;
  }


  private static applyFilters(query: any, filters: CouponFilters) {

    const currentTimestamp = new Date().toISOString();

    const exactFilters = [
      { key: 'project_id', field: 'project_id' },
      { key: 'status', field: 'status' },
      { key: 'activity_type', field: 'activity_type' }
    ] as const;
    
    const likeFilters = [
      { key: 'business_name', field: 'business_name' },
      { key: 'location', field: 'location' }
    ] as const;

    exactFilters.forEach(({ key, field }) => {
      if (filters[key]) {
        query = query.eq(field, filters[key]);
      }
    });

    likeFilters.forEach(({ key, field }) => {
      if (filters[key]) {
        query = query.ilike(field, `%${filters[key]}%`);
      }
    });

    if (filters.token_ids?.length) {
      query = query.in('token_id', filters.token_ids);
    }

    if (filters.expired !== undefined) {
      const operator = filters.expired ? 'lt' : 'gt';
      query = query[operator]('expiration_date', currentTimestamp);
    }

    return query;
  }

  static async getCouponStats(userId: string): Promise<{
    total: number;
    active: number;
    redeemed: number;
    expired: number;
  }> {
    const { data, error } = await supabase
      .from('coupons')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get coupon stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      active: 0,
      redeemed: 0,
      expired: 0
    };

    const now = new Date().toISOString();

    data.forEach((coupon: any) => {
      switch (coupon.status) {
        case CouponStatus.ACTIVE:
          if (coupon.expiration_date <= now) {
            stats.expired++;
          } else {
            stats.active++;
          }
          break;
        case CouponStatus.REDEEMED:
          stats.redeemed++;
          break;
        case CouponStatus.EXPIRED:
          stats.expired++;
          break;
      }
    });

    return stats;
  }
}

