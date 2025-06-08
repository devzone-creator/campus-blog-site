const { Pool } = require('pg');

const pool = new Pool({
  user: 'mosteck',         // replace with your macOS user
  host: 'localhost',
  database: 'campus_blog',
  password: '    ',                      // leave empty if no password
  port: 5432,
});

module.exports = pool;