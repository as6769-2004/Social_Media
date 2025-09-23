const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "9709303105",
  database: "social_media",
  waitForConnections: true,
  connectionLimit: 100,
});

module.exports = pool;
