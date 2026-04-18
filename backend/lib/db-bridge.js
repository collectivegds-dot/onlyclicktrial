const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to determine if we should use Cloud DB
const isServerless = () => process.env.VERCEL || process.env.NODE_ENV === 'production';

// Initialize Supabase Client
let supabase = null;
if (isServerless()) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('[DB] SUPABASE_URL or SUPABASE_SERVICE_KEY missing in serverless environment.');
    } else {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        console.log('[DB] Supabase client initialized for cloud storage.');
    }
}

class DbBridge {
    constructor(filePath) {
        this.filePath = filePath;
        // The key in Supabase 'app_data' table (e.g., 'db', 'assets')
        this.dbKey = path.basename(filePath, '.json');
        this.memoryStore = null;
    }

    async read() {
        // 1. Try Cloud DB (Supabase) if in Serverless mode
        if (isServerless() && supabase) {
            try {
                const { data, error } = await supabase
                    .from('app_data')
                    .select('data')
                    .eq('key', this.dbKey)
                    .single();
                
                if (error) {
                    if (error.code === 'PGRST116') { // Not found
                        return this._readLocal();
                    }
                    throw error;
                }
                this.memoryStore = data.data;
                return this.memoryStore;
            } catch (e) {
                console.error(`[DB] Supabase Read Error for ${this.dbKey}:`, e.message);
                // Fallback to memory or local if possible
            }
        }

        // 2. Return Memory Store if available
        if (this.memoryStore) return this.memoryStore;

        // 3. Fallback to Local Filesystem
        return this._readLocal();
    }

    _readLocal() {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
                this.memoryStore = data;
                return data;
            }
        } catch (e) {
            console.error(`[DB] Local Read Error for ${this.filePath}:`, e.message);
        }
        return [];
    }

    async write(data) {
        this.memoryStore = data;

        // 1. Write to Cloud DB (Supabase) if in Serverless mode
        if (isServerless() && supabase) {
            try {
                const { error } = await supabase
                    .from('app_data')
                    .upsert({ key: this.dbKey, data: data, updated_at: new Date().toISOString() });
                
                if (error) throw error;
                console.log(`[DB] Successfully saved ${this.dbKey} to Supabase.`);
                return true;
            } catch (e) {
                console.error(`[DB] Supabase Write Error for ${this.dbKey}:`, e.message);
                return false;
            }
        }

        // 2. Local Filesystem Write (Only if not in Vercel)
        if (!process.env.VERCEL) {
            try {
                fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
                return true;
            } catch (e) {
                console.error(`[DB] Local Write Error for ${this.filePath}:`, e.message);
                return false;
            }
        }

        return true; // We saved to memory anyway
    }
}

module.exports = DbBridge;
