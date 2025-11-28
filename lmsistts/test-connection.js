require('dotenv').config();

console.log('=== Checking Environment Variables ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***EXISTS***' : '❌ NOT FOUND');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('');

// Test MySQL connection
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('=== Testing Connection ===');
connection.connect((err) => {
  if (err) {
    console.error('❌ Connection Failed!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('SQL State:', err.sqlState);
    process.exit(1);
  }
  
  console.log('✅ Connection Successful!');
  console.log('Connected as:', connection.threadId);
  
  connection.query('SELECT DATABASE() as db', (err, results) => {
    if (err) throw err;
    console.log('Current Database:', results[0].db);
    connection.end();
  });
});