import type { SupabaseClient } from '@supabase/supabase-js';
import connectionManager from '@/lib/db/connection-manager';
import logger from '@/utils/logger';
import QueryOptimizer from '@/lib/db/query-optimizer';
import { performance } from 'node:perf_hooks';

export type SortDirection = 'asc' | 'desc';

export interface PaginationParams {
  page?: number; // 1-based
  limit?: number;
}

export interface QueryOptions<T> {
  filters?: Partial<Record<keyof T, unknown>>;
  orderBy?: { column: keyof T; direction?: SortDirection }[];
  pagination?: PaginationParams;
  columns?: string;
}

export class QueryBuilder<T extends Record<string, any>> {
  private client: SupabaseClient;
  private table: string;
  private query: any = null;
  private optimizer = QueryOptimizer.getInstance();

  constructor(table: string, client: SupabaseClient = connectionManager.getClient()) {
    this.table = table;
    this.client = client;
  }

  select(columns: string = '*'): this {
    this.query = this.client.from(this.table).select(columns);
    return this;
  }

  where<K extends keyof T>(column: K, op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ilike', value: any): this {
    if (!this.query) this.select('*');
    switch (op) {
      case 'eq': this.query = this.query!.eq(String(column), value); break;
      case 'neq': this.query = this.query!.neq(String(column), value); break;
      case 'gt': this.query = this.query!.gt(String(column), value); break;
      case 'gte': this.query = this.query!.gte(String(column), value); break;
      case 'lt': this.query = this.query!.lt(String(column), value); break;
      case 'lte': this.query = this.query!.lte(String(column), value); break;
      case 'ilike': this.query = this.query!.ilike(String(column), value); break;
    }
    return this;
  }

  filterMany(filters: Partial<Record<keyof T, unknown>>): this {
    if (!filters) return this;
    if (!this.query) this.select('*');
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        this.query = this.query!.eq(k, v as any);
      }
    });
    return this;
  }

  orderBy(column: keyof T, direction: SortDirection = 'asc'): this {
    if (!this.query) this.select('*');
    this.query = this.query!.order(String(column), { ascending: direction === 'asc' });
    return this;
  }

  paginate({ page = 1, limit = 10 }: PaginationParams): this {
    if (!this.query) this.select('*');
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    this.query = this.query!.range(from, to);
    return this;
  }

  async list(options?: QueryOptions<T>): Promise<T[]> {
    const start = performance.now();
    this.applyOptions(options);
    const { data, error } = await this.query!;
    const duration = performance.now() - start;
    this.optimizer.record({ table: this.table, duration, filters: options?.filters });
    if (error) throw new Error(`DB query error [${this.table}]: ${error.message}`);
    return (data || []) as T[];
  }

  async first(options?: QueryOptions<T>): Promise<T | null> {
    this.applyOptions(options);
    // enforce single
    // Supabase supports single() at the end
    const start = performance.now();
    const { data, error } = await (this.query as any).single();
    const duration = performance.now() - start;
    this.optimizer.record({ table: this.table, duration, filters: options?.filters });
    if (error && (error as any).code !== 'PGRST116') throw new Error(`DB fetch error [${this.table}]: ${error.message}`);
    return (data as T) || null;
  }

  async count(filters?: Partial<Record<keyof T, unknown>>): Promise<number> {
    const start = performance.now();
    let query: any = this.client.from(this.table).select('*', { head: true, count: 'exact' });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          query = query.eq(k, v);
        }
      });
    }
    const { count, error } = await query;
    const duration = performance.now() - start;
    this.optimizer.record({ table: this.table, duration, filters });
    if (error) throw new Error(`DB count error [${this.table}]: ${error.message}`);
    return count || 0;
  }

  async insert(payload: Partial<T> | Partial<T>[], returning: boolean = true): Promise<T | T[] | null> {
    const arrayPayload = Array.isArray(payload) ? payload : [payload];
    const start = performance.now();
  let insertQuery: any = this.client.from(this.table).insert(arrayPayload as any);
  if (returning) insertQuery = insertQuery.select('*');
  const { data, error } = await insertQuery;
    const duration = performance.now() - start;
    this.optimizer.record({ table: this.table, duration, kind: 'insert' });
    if (error) throw new Error(`DB insert error [${this.table}]: ${error.message}`);
    if (!returning) return null;
    if (Array.isArray(payload)) {
      return (data || []) as unknown as T[];
    }
    return (data && data[0] ? (data[0] as T) : null);
  }

  async update(match: Partial<T>, changes: Partial<T>): Promise<T[]>{
    const start = performance.now();
    let query: any = this.client.from(this.table).update(changes as any);
    Object.entries(match).forEach(([k, v]) => { query = query.eq(k, v as any); });
    query = query.select('*');
    const { data, error } = await query;
    const duration = performance.now() - start;
    this.optimizer.record({ table: this.table, duration, kind: 'update', filters: match });
    if (error) throw new Error(`DB update error [${this.table}]: ${error.message}`);
    return (data || []) as T[];
  }

  async delete(match: Partial<T>): Promise<number> {
    const start = performance.now();
    let query: any = this.client.from(this.table).delete();
    Object.entries(match).forEach(([k, v]) => { query = query.eq(k, v as any); });
    const { error, count } = await query.select('*', { count: 'exact' });
    const duration = performance.now() - start;
    this.optimizer.record({ table: this.table, duration, kind: 'delete', filters: match });
    if (error) throw new Error(`DB delete error [${this.table}]: ${error.message}`);
    return count || 0;
  }

  // Soft delete if the table has a deleted_at column; otherwise falls back to hard delete
  async softDelete(match: Partial<T>): Promise<number> {
    try {
      const updates = await this.update(match, { deleted_at: new Date().toISOString() } as any);
      return updates.length;
    } catch (e) {
      logger.warn(`Soft delete not supported on table ${this.table}; performing hard delete`);
      return this.delete(match);
    }
  }

  private applyOptions(options?: QueryOptions<T>): void {
    if (!this.query) this.select(options?.columns || '*');
    if (!options) return;
    if (options.filters) this.filterMany(options.filters);
    if (options.orderBy) options.orderBy.forEach(o => this.orderBy(o.column, o.direction));
    if (options.pagination) this.paginate(options.pagination);
  }
}
