/*const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.databaseURI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        process.exit();
    }
}

module.exports = connectDB;*/



/*
// config/db.js
const mysql = require('mysql2/promise');

const connectDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: 'srv1250.hstgr.io', // o el host de tu hosting
            user: 'u522428285_admin',
            password: 'Minecon$2710',
            database: 'u522428285_ordenar'
        });

        console.log('✅ MySQL Connected');
        return connection;
    } catch (err) {
        console.error('❌ MySQL connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;*/

const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.dbHost,
  user: config.dbUser,
  password: config.dbPass,
  database: config.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test de conexión al arrancar para detectar errores rápido
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL conectado correctamente a", config.dbHost);
    connection.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("🔐 Error de acceso: Tu IP local no está autorizada en Hostinger.");
      console.error("👉 Solución: Ve al panel de Hostinger → Bases de datos → MySQL remoto → Agrega tu IP.");
      console.error("   Tu IP actual:", err.sqlMessage?.match(/@'([^']+)'/)?.[1] || "desconocida");
    }
    // NO hacemos process.exit() para que el servidor siga corriendo
  }
})();

module.exports = pool;









