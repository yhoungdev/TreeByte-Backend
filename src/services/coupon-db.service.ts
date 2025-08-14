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