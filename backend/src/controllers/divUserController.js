const { getConnection, sql } = require("../config/database");

// Get all DivUsers
const getAllDivUsers = async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT
        du.id, du.name, du.user_id, du.created_at,
        u.name as linked_user_name, u.email as linked_user_email
      FROM DivUsers du
      INNER JOIN Users u ON du.user_id = u.id
      ORDER BY du.name ASC
    `);

    res.json({ divUsers: result.recordset });
  } catch (error) {
    console.error("Get all DivUsers error:", error);
    res.status(500).json({ error: "Failed to fetch DivUsers" });
  }
};

// Get DivUser by ID
const getDivUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request().input("id", sql.Int, id).query(`
      SELECT
        du.id, du.name, du.user_id, du.created_at,
        u.name as linked_user_name, u.email as linked_user_email
      FROM DivUsers du
      INNER JOIN Users u ON du.user_id = u.id
      WHERE du.id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "DivUser not found" });
    }

    res.json({ divUser: result.recordset[0] });
  } catch (error) {
    console.error("Get DivUser by ID error:", error);
    res.status(500).json({ error: "Failed to fetch DivUser" });
  }
};

// Create DDG/ADDG
const createDivUser = async (req, res) => {
  try {
    const { name, user_id } = req.body;

    if (!name || !user_id) {
      return res.status(400).json({ error: "Name and user_id are required" });
    }

    // Only admin and manager can create DivUsers
    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ error: "Only admins and managers can create DivUsers" });
    }

    const pool = await getConnection();

    // Verify user_id exists
    const userCheck = await pool
      .request()
      .input("userId", sql.Int, user_id)
      .query("SELECT id FROM Users WHERE id = @userId");

    if (userCheck.recordset.length === 0) {
      return res.status(400).json({ error: "Invalid user_id" });
    }

    // Check if DivUser already exists for this user
    const existingCheck = await pool
      .request()
      .input("userId", sql.Int, user_id)
      .query("SELECT id FROM DivUsers WHERE user_id = @userId");

    if (existingCheck.recordset.length > 0) {
      return res
        .status(400)
        .json({ error: "DivUser already exists for this user" });
    }

    const result = await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("user_id", sql.Int, user_id).query(`
        INSERT INTO DivUsers (name, user_id)
        VALUES (@name, @user_id);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const divUserId = result.recordset[0].id;

    res.status(201).json({
      message: "DivUser created successfully",
      divUserId,
    });
  } catch (error) {
    console.error("Create DDG/ADDG error:", error);
    res.status(500).json({ error: "Failed to create DDG/ADDG" });
  }
};

// Update DDG/ADDG
const updateDivUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, user_id } = req.body;

    // Only admin and manager can update DDG/ADDG
    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ error: "Only admins and managers can update DDG/ADDG" });
    }

    const pool = await getConnection();

    // Check if DDG/ADDG exists
    const divUserCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT id, user_id FROM DivUsers WHERE id = @id");

    if (divUserCheck.recordset.length === 0) {
      return res.status(404).json({ error: "DDG/ADDG not found" });
    }

    const currentDivUser = divUserCheck.recordset[0];

    // If user_id provided, verify it exists and isn't already used by another DDG/ADDG
    if (user_id && user_id !== currentDivUser.user_id) {
      const userCheck = await pool
        .request()
        .input("userId", sql.Int, user_id)
        .query("SELECT id FROM Users WHERE id = @userId");

      if (userCheck.recordset.length === 0) {
        return res.status(400).json({ error: "Invalid user_id" });
      }

      // Check if another DDG/ADDG already uses this user_id
      const existingCheck = await pool
        .request()
        .input("userId", sql.Int, user_id)
        .input("currentId", sql.Int, id)
        .query(
          "SELECT id FROM DivUsers WHERE user_id = @userId AND id != @currentId"
        );

      if (existingCheck.recordset.length > 0) {
        return res
          .status(400)
          .json({ error: "DDG/ADDG already exists for this user" });
      }
    }

    // Build update query
    let updateFields = [];
    let request = pool.request().input("id", sql.Int, id);

    if (name !== undefined) {
      updateFields.push("name = @name");
      request.input("name", sql.VarChar, name);
    }
    if (user_id !== undefined && user_id !== currentDivUser.user_id) {
      updateFields.push("user_id = @user_id");
      request.input("user_id", sql.Int, user_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    await request.query(
      `UPDATE DivUsers SET ${updateFields.join(", ")} WHERE id = @id`
    );

    res.json({ message: "DDG/ADDG updated successfully" });
  } catch (error) {
    console.error("Update DDG/ADDG error:", error);
    res.status(500).json({ error: "Failed to update DDG/ADDG" });
  }
};

// Delete DDG/ADDG
const deleteDivUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin and manager can delete DivUsers
    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ error: "Only admins and managers can delete DivUsers" });
    }

    const pool = await getConnection();

    // Check if DivUser exists
    const divUserCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT id FROM DivUsers WHERE id = @id");

    if (divUserCheck.recordset.length === 0) {
      return res.status(404).json({ error: "DivUser not found" });
    }

    // Check if any tasks reference this DivUser
    const taskCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Tasks WHERE assigned_to_div_user = @id"
      );

    if (taskCheck.recordset[0].count > 0) {
      return res.status(400).json({
        error: "Cannot delete DivUser as it is referenced by tasks",
      });
    }

    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM DivUsers WHERE id = @id");

    res.json({ message: "DivUser deleted successfully" });
  } catch (error) {
    console.error("Delete DivUser error:", error);
    res.status(500).json({ error: "Failed to delete DivUser" });
  }
};

module.exports = {
  getAllDivUsers,
  getDivUserById,
  createDivUser,
  updateDivUser,
  deleteDivUser,
};
