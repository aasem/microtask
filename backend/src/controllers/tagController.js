const { getConnection, sql } = require('../config/database');

// Get all tags
const getAllTags = async (req, res) => {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT id, name, created_at
      FROM Tags
      ORDER BY name ASC
    `);

    res.json({ tags: result.recordset });
  } catch (error) {
    console.error('Get all tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

// Create a new tag
const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const trimmedName = name.trim();

    // Validate tag name length
    if (trimmedName.length > 50) {
      return res.status(400).json({ error: 'Tag name must be 50 characters or less' });
    }

    const pool = await getConnection();

    // Check if tag already exists
    const existingTag = await pool.request()
      .input('name', sql.VarChar, trimmedName)
      .query('SELECT id, name FROM Tags WHERE name = @name');

    if (existingTag.recordset.length > 0) {
      // Return existing tag
      return res.json({ 
        tag: existingTag.recordset[0],
        message: 'Tag already exists'
      });
    }

    // Create new tag
    const insertResult = await pool.request()
      .input('name', sql.VarChar, trimmedName)
      .query(`
        INSERT INTO Tags (name)
        VALUES (@name);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const tagId = insertResult.recordset[0].id;

    // Fetch the complete tag record
    const tagResult = await pool.request()
      .input('id', sql.Int, tagId)
      .query('SELECT id, name, created_at FROM Tags WHERE id = @id');

    res.status(201).json({
      tag: tagResult.recordset[0],
      message: 'Tag created successfully'
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

// Delete a tag (only admin)
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can delete tags
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete tags' });
    }

    const pool = await getConnection();

    // Check if tag exists
    const tagCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM Tags WHERE id = @id');

    if (tagCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Delete tag (TaskTags will be deleted automatically due to CASCADE)
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Tags WHERE id = @id');

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};

module.exports = {
  getAllTags,
  createTag,
  deleteTag,
};
