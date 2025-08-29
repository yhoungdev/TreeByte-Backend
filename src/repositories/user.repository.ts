import { BaseRepository } from '@/lib/db/base-repository';
import { QueryBuilder } from '@/lib/db/query-builder';
import type { User } from '@/types/database';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    return new QueryBuilder<User>('users').select('*').where('email', 'eq', email).first();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }

  async search(term: string, limit = 20): Promise<User[]> {
    return new QueryBuilder<User>('users')
      .select('*')
      .where('email', 'ilike', `%${term}%`)
      .paginate({ page: 1, limit })
      .list();
  }
}
