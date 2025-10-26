const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'astro_auth',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

const createTables = async () => {
    try {
        // Users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(255),
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255) UNIQUE,
                password_hash VARCHAR(255),
                google_id VARCHAR(255) UNIQUE,
                profile_picture VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created/verified');

        // Reviews table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Reviews table created/verified');

        // Conversations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) DEFAULT 'New Chat',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Conversations table created/verified');

        // Messages
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                sender VARCHAR(20) CHECK (sender IN ('user', 'ai')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Messages table created/verified');

        // Try to create embeddings table with vector extension (optional)
        try {
            await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS embeddings (
                    id SERIAL PRIMARY KEY,
                    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
                    embedding VECTOR(1536),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Embeddings table created/verified with vector support');
        } catch (vectorErr) {
            // Vector extension not available - this is optional
            // Uncomment below to see the warning:
            // console.log('⚠️  Vector extension not available - skipping embeddings table');
            // console.log('   To enable vector search, install pgvector: https://github.com/pgvector/pgvector');
        }

        console.log('✅ All core tables created successfully');
    } catch (err) {
        console.error('❌ Error creating database tables:', err);
        throw err;
    }
};

createTables();

module.exports = pool;
