const bcrypt = require('bcryptjs');
const { getConnection, sql } = require('../config/database');

const getAllUsers = async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query('SELECT id, name, email, role, created_at FROM Users ORDER BY created_at DESC');

    res.json({ users: result.recordset });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, name, email, role, created_at FROM Users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.recordset[0] });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const pool = await getConnection();

    // Check if user exists
    const userCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Users WHERE id = @id');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query dynamically
    let updateFields = [];
    let request = pool.request().input('id', sql.Int, id);

    if (name) {
      updateFields.push('name = @name');
      request.input('name', sql.VarChar, name);
    }
    if (email) {
      updateFields.push('email = @email');
      request.input('email', sql.VarChar, email);
    }
    if (role) {
      updateFields.push('role = @role');
      request.input('role', sql.VarChar, role);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = @password_hash');
      request.input('password_hash', sql.VarChar, hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await request.query(`UPDATE Users SET ${updateFields.join(', ')} WHERE id = @id`);

    // Fetch updated user
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, name, email, role, created_at FROM Users WHERE id = @id');

    res.json({ 
      message: 'User updated successfully',
      user: result.recordset[0] 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Check if user exists
    const userCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, role FROM Users WHERE id = @id');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user (tasks will be handled by cascade or manual cleanup)
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE id = @id');

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
