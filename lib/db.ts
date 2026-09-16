import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "urban_cruise",

  // Pool tuning
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,

  // Performance
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: "+00:00",
  charset: "utf8mb4",

  // Timeouts
  connectTimeout: 10000,
});

export default pool;
