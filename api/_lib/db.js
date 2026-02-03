import mysql from 'mysql2/promise';

// For serverless, we cache the pool globally to reuse across function invocations
let pool;

const getPool = () => {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'savvy_tabungan',
            waitForConnections: true,
            connectionLimit: 5, // Lower limit for serverless
            queueLimit: 0,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    return pool;
};

export const query = (sql, params = []) => {
    const pool = getPool();
    return pool.execute(sql, params);
};
