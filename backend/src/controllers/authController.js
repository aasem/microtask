const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getConnection, sql } = require("../config/database");

const register = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const pool = await getConnection();

    // Check if user already exists
    const existingUser = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT id FROM Users WHERE email = @email");

    if (existingUser.recordset.length > 0) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("email", sql.VarChar, email)
      .input("password_hash", sql.VarChar, hashedPassword)
      .input("role", sql.VarChar, role).query(`
        INSERT INTO Users (name, email, password_hash, role, created_at)
        VALUES (@name, @email, @password_hash, @role, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const userId = result.recordset[0].id;

    res.status(201).json({
      message: "User registered successfully",
      user: { id: userId, name, email, role },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(
      "🔐 Login attempt - Email:",
      email,
      "| Password length:",
      password?.length
    );

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ error: "Email and password are required" });
    }

    const pool = await getConnection();

    // Find user by email
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query(
        "SELECT id, name, email, password_hash, role FROM Users WHERE email = @email"
      );

    console.log("📊 Query result - Found users:", result.recordset.length);

    if (result.recordset.length === 0) {
      console.log("❌ User not found for email:", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.recordset[0];
    console.log("✅ User found:", user.email, "| Role:", user.role);
    console.log("🔑 Password hash length:", user.password_hash?.length);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log("🔐 Password verification result:", isValidPassword);

    if (!isValidPassword) {
      console.log("❌ Password verification failed");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    console.log("🎫 Generating JWT token...");
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log("✅ Login successful for user:", user.email);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool
      .request()
      .input("id", sql.Int, req.user.id)
      .query(
        "SELECT id, name, email, role, created_at FROM Users WHERE id = @id"
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.recordset[0] });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
