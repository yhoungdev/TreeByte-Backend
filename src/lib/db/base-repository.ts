import { QueryBuilder, PaginationParams, QueryOptions } from '@/lib/db/query-builder';

export class DatabaseError extends Error {
  constructor(message: string, public context?: Record<string, unknown>) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export abstract class BaseRepository<T extends Record<string, any>> {
  protected qb: QueryBuilder<T>;
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.qb = new QueryBuilder<T>(tableName);
  }

  async findById(id: string): Promise<T | null> {
    return this.qb.select('*').where('id' as keyof T, 'eq', id).first();
  }

  async findMany(options?: QueryOptions<T>): Promise<T[]> {
    return this.qb.select('*').list(options);
  }

  async create(payload: Partial<T>): Promise<T | null> {
    return (await this.qb.insert(payload)) as T | null;
  }

  async createMany(payload: Partial<T>[]): Promise<T[] | null> {
    return (await this.qb.insert(payload)) as T[] | null;
  }

  async update(match: Partial<T>, changes: Partial<T>): Promise<T[]> {
    return this.qb.update(match, changes);
  }

  async delete(match: Partial<T>): Promise<number> {
    return this.qb.delete(match);
  }

  async softDelete(match: Partial<T>): Promise<number> {
    return this.qb.softDelete(match);
  }

  async paginate(filters: Partial<Record<keyof T, unknown>>, pagination: PaginationParams) {
    return this.qb.select('*').filterMany(filters).paginate(pagination).list();
  }
}
