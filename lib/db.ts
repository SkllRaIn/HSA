import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

let pool: Pool | null = null;
const isPostgresSync = process.env.DATABASE_URL ? true : false;

export const getPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('render.com') || process.env.DATABASE_URL.includes('elephantsql.com') ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
};

// JSON Fallback
const DB_PATH = path.join(process.cwd(), "db.json");
const getJsonDb = () => JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
const saveJsonDb = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Unified Interface
export const db = {
  async query(text: string, params?: any[]) {
    const p = getPool();
    if (p) {
      return p.query(text, params);
    }
    throw new Error("PostgreSQL not configured. Set DATABASE_URL.");
  },
  
  async getComputers() {
    if (isPostgresSync) {
      const res = await this.query('SELECT * FROM computers ORDER BY created_at DESC');
      return res.rows.map(r => ({
        ...r,
        agentId: r.agent_id,
        serialNumber: r.serial_number,
        assignedTo: r.assigned_to,
        lastIp: r.last_ip,
        vncActive: r.vnc_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastSeen: r.last_seen
      }));
    }
    return getJsonDb().computers;
  },

  async getComputerById(id: string) {
      if (isPostgresSync) {
          const res = await this.query('SELECT * FROM computers WHERE id = $1', [id]);
          return res.rows[0];
      }
      return getJsonDb().computers.find((c: any) => c.id === id);
  },

  async updateComputer(id: string, data: any) {
    if (isPostgresSync) {
        const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'history' && k !== 'software' && k !== 'agentId');
        if (fields.length > 0) {
            const setClause = fields.map((f, i) => `${f.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)} = $${i + 2}`).join(', ');
            const values = fields.map(f => data[f]);
            await this.query(`UPDATE computers SET ${setClause}, updated_at = NOW() WHERE id = $1`, [id, ...values]);
        }
        
        // Sync software if provided
        if (data.software && Array.isArray(data.software)) {
            await this.query('DELETE FROM software WHERE computer_id = $1', [id]);
            for (const sw of data.software) {
                await this.query('INSERT INTO software (computer_id, name, version, publisher) VALUES ($1, $2, $3, $4)', [id, sw.name, sw.version, sw.publisher]);
            }
        }
        return this.getComputerById(id);
    }
    const json = getJsonDb();
    const idx = json.computers.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
        json.computers[idx] = { ...json.computers[idx], ...data, updatedAt: new Date().toISOString() };
        saveJsonDb(json);
        return json.computers[idx];
    }
    return null;
  },

  async upsertComputer(data: any) {
    if (!isPostgresSync) return null;
    
    const { serialNumber, ...rest } = data;
    const existing = await this.query('SELECT id FROM computers WHERE serial_number = $1', [serialNumber]);
    
    if (existing.rows.length > 0) {
      const id = existing.rows[0].id;
      return this.updateComputer(id, rest);
    } else {
      const id = data.id || "auto-" + Math.random().toString(36).substr(2, 5);
      const fields = ['id', 'agent_id', 'name', 'hostname', 'model', 'manufacturer', 'serial_number', 'status', 'assigned_to', 'location', 'cpu', 'cpu_cores', 'ram', 'storage', 'gpu', 'motherboard', 'os', 'last_ip', 'vnc_active', 'notes', 'last_seen'];
      const values = [
        id,
        data.agentId,
        data.name || 'Unknown PC',
        data.hostname,
        data.model || 'Unknown',
        data.manufacturer || 'Unknown',
        serialNumber,
        data.status || 'In Use',
        data.assignedTo || 'Auto-detected',
        data.location || 'Auto-detected',
        data.cpu,
        data.cpuCores,
        data.ram,
        data.storage,
        data.gpu,
        data.motherboard,
        data.os,
        data.lastIp,
        data.vncActive || false,
        data.notes || 'Agent Auto-reg',
        new Date().toISOString()
      ];
      
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      await this.query(`INSERT INTO computers (${fields.join(', ')}) VALUES (${placeholders})`, values);
      
      // Sync software
      if (data.software && Array.isArray(data.software)) {
        await this.query('DELETE FROM software WHERE computer_id = $1', [id]);
        for (const sw of data.software) {
          await this.query('INSERT INTO software (computer_id, name, version, publisher) VALUES ($1, $2, $3, $4)', [id, sw.name, sw.version, sw.publisher]);
        }
      }
      
      return this.getComputerById(id);
    }
  }
};

export const initSchema = async () => {
    if (!isPostgresSync) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT REFERENCES groups(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS computers (
                id TEXT PRIMARY KEY,
                agent_id TEXT,
                name TEXT,
                hostname TEXT,
                group_id TEXT REFERENCES groups(id),
                model TEXT,
                manufacturer TEXT,
                serial_number TEXT UNIQUE,
                status TEXT,
                assigned_to TEXT,
                location TEXT,
                cpu TEXT,
                cpu_cores INTEGER,
                ram TEXT,
                storage TEXT,
                gpu TEXT,
                motherboard TEXT,
                os TEXT,
                last_ip TEXT,
                vnc_active BOOLEAN,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                last_seen TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS software (
                id SERIAL PRIMARY KEY,
                computer_id TEXT REFERENCES computers(id) ON DELETE CASCADE,
                name TEXT,
                version TEXT,
                publisher TEXT
            );

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT
            );
        `);
        console.log("PostgreSQL schema initialized");
    } catch (err) {
        console.error("Failed to initialize PG schema:", err);
    }
};
