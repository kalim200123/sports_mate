import mysql from "mysql2/promise";

/**
 * MySQL Connection Pool
 * Environmental variables must be set in .env
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 50, // Increased from 10
  maxIdle: 10, // Max idle connections
  idleTimeout: 60000, // 60 seconds idle timeout
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;
