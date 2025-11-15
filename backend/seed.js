const bcrypt = require('bcryptjs');
const { getConnection, closeConnection } = require('./src/config/database');

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    const pool = await getConnection();
    
    // Check if users already exist
    const existingUsers = await pool.request()
      .query('SELECT COUNT(*) as count FROM Users');
    
    if (existingUsers.recordset[0].count > 0) {
      console.log('⚠️  Users already exist. Skipping seed.');
      console.log('If you want to re-seed, delete the database file and restart.');
      await closeConnection();
      return;
    }
    
    // Hash password: "password123"
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Insert admin user
    await pool.request()
      .input('name', 'VARCHAR', 'Admin User')
      .input('email', 'VARCHAR', 'admin')
      .input('password_hash', 'VARCHAR', passwordHash)
      .input('role', 'VARCHAR', 'admin')
      .query(`
        INSERT INTO Users (name, email, password_hash, role)
        VALUES (@name, @email, @password_hash, @role)
      `);
    console.log('✅ Admin user created: admin / password123');
    
    // Insert manager user
    await pool.request()
      .input('name', 'VARCHAR', 'Manager User')
      .input('email', 'VARCHAR', 'manager')
      .input('password_hash', 'VARCHAR', passwordHash)
      .input('role', 'VARCHAR', 'manager')
      .query(`
        INSERT INTO Users (name, email, password_hash, role)
        VALUES (@name, @email, @password_hash, @role)
      `);
    console.log('✅ Manager user created: manager / password123');
    
    // Insert regular user
    await pool.request()
      .input('name', 'VARCHAR', 'Regular User')
      .input('email', 'VARCHAR', 'user')
      .input('password_hash', 'VARCHAR', passwordHash)
      .input('role', 'VARCHAR', 'user')
      .query(`
        INSERT INTO Users (name, email, password_hash, role)
        VALUES (@name, @email, @password_hash, @role)
      `);
    console.log('✅ Regular user created: user / password123');
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('  Admin:   admin / password123');
    console.log('  Manager: manager / password123');
    console.log('  User:    user / password123');
    
    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();


