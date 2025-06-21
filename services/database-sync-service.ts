import { pool } from '@/lib/postgresql-client';
import { Pool } from 'pg';

class DatabaseSyncService {
  private productionPool: Pool;
  private isEnabled: boolean = true;

  constructor() {
    this.productionPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: 'ooak_future_production',
      user: process.env.POSTGRES_USER || 'vikasalagarsamy',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: false,
      max: 20,
    });
    console.log('🔄 Database Sync Service initialized');
  }

  async syncQuery(query: string, params: any[] = []) {
    if (!this.isEnabled) return;
    
    try {
      await this.productionPool.query(query, params);
      console.log(`✅ Synced to production: ${query.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Sync failed:`, error);
    }
  }
}

export const dbSync = new DatabaseSyncService();

export async function syncedQuery(query: string, params: any[] = []) {
  const result = await pool.query(query, params);
  
  if (query.trim().toUpperCase().startsWith('INSERT') || 
      query.trim().toUpperCase().startsWith('UPDATE') || 
      query.trim().toUpperCase().startsWith('DELETE')) {
    dbSync.syncQuery(query, params);
  }
  
  return result;
} 