import { BaseRepository } from '@/lib/db/base-repository';
import { QueryBuilder } from '@/lib/db/query-builder';
import type { Project } from '@/types/database';

export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super('projects');
  }

  async findByAssetCode(assetCode: string): Promise<Project[]> {
    return new QueryBuilder<Project>('projects').select('*').where('asset_code', 'eq', assetCode).list();
  }

  async paginateProjects(page: number, limit: number): Promise<{ data: Project[]; total: number; page: number; limit: number }>{
    const qb = new QueryBuilder<Project>('projects');
    const data = await qb.select('*').paginate({ page, limit }).list();
    // Count total
    const total = await new QueryBuilder<Project>('projects').count();
    return { data, total, page, limit };
  }

  async searchByName(term: string, page = 1, limit = 10): Promise<{ data: Project[]; total: number; page: number; limit: number }>{
    const qb = new QueryBuilder<Project>('projects');
    const data = await qb.select('*').where('name', 'ilike', `%${term}%`).paginate({ page, limit }).list();
    const total = await new QueryBuilder<Project>('projects').count({ name: term as any });
    return { data, total, page, limit };
  }
}
