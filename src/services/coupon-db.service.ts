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