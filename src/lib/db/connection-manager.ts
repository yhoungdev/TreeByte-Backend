import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config/app-config';
import logger from '@/utils/logger';

class ConnectionManager {
  private static instance: ConnectionManager;
  private client: SupabaseClient | null = null;
  private lastHealthyAt: number | null = null;

  static getInstance(): ConnectionManager {
    if (!this.instance) this.instance = new ConnectionManager();
    return this.instance;
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(config.database.url, config.database.key);
      logger.info('Supabase client initialized');
    }
    return this.client;
  }

  async healthCheck(timeoutMs = 3000): Promise<boolean> {
    const client = this.getClient();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // cheap HEAD-like count-only call
      const { error } = await client.from('projects').select('*', { head: true, count: 'exact' });
      if (error) {
        logger.warn(`Supabase health check error: ${error.message}`);
        return false;
      }
      this.lastHealthyAt = Date.now();
      return true;
    } catch (e: any) {
      logger.error(`Supabase health check failed: ${e.message}`);
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  async reconnect(): Promise<void> {
    logger.warn('Reinitializing Supabase client');
    this.client = createClient(config.database.url, config.database.key);
  }
}

export default ConnectionManager.getInstance();
