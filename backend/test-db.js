const bcrypt = require('bcryptjs');
const { getConnection, sql } = require('./src/config/database');

async function testDatabase() {
  try {
    const pool = await getConnection();
    
    // Check if admin user exists
    const result = await pool.request()
      .input('email', sql.VarChar, 'admin@company.com')
      .query('SELECT id, name, email, password_hash, role FROM Users WHERE email = @email');
    
    if (result.recordset.length === 0) {
      console.log('❌ Admin user not found in database!');
      console.log('Available users:');
      const allUsers = await pool.request().query('SELECT id, email FROM Users');
      console.log(allUsers.recordset);
      return;
    }
    
    const user = result.recordset[0];
    console.log('✅ Found user:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    // Test password
    const isValid = await bcrypt.compare('password123', user.password_hash);
    console.log('Password hash:', user.password_hash);
    console.log('Password valid:', isValid ? '✅' : '❌');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDatabase();
