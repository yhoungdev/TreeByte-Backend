import logger from '@/utils/logger';

interface QueryRecord {
  table: string;
  duration: number; // ms
  kind?: 'insert' | 'update' | 'delete' | 'select';
  filters?: Record<string, unknown> | undefined;
}

class QueryOptimizer {
  private static instance: QueryOptimizer;
  private records: QueryRecord[] = [];

  static getInstance(): QueryOptimizer {
    if (!this.instance) this.instance = new QueryOptimizer();
    return this.instance;
  }

  record(r: QueryRecord): void {
    this.records.push({ kind: r.kind || 'select', ...r });
    if (r.duration > 200) {
      logger.warn(`Slow query on ${r.table} took ${r.duration.toFixed(1)}ms`);
    }
  }

  getSlowQueries(thresholdMs = 200): QueryRecord[] {
    return this.records.filter(r => r.duration >= thresholdMs);
  }

  suggestIndexes(): Array<{ table: string; columns: string[] }> {
    // naive suggestions: count filter usage
    const usage: Record<string, Record<string, number>> = {};
    for (const r of this.records) {
      if (!r.filters) continue;
      usage[r.table] = usage[r.table] || {};
      Object.keys(r.filters).forEach(col => {
        usage[r.table][col] = (usage[r.table][col] || 0) + 1;
      });
    }
    const suggestions: Array<{ table: string; columns: string[] }> = [];
    Object.entries(usage).forEach(([table, cols]) => {
      const top = Object.entries(cols)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c);
      if (top.length) suggestions.push({ table, columns: top });
    });
    return suggestions;
  }
}

export default QueryOptimizer;