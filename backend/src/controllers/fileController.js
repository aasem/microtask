const { getConnection, sql } = require("../config/database");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow common document and image types
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images and common document formats are allowed."
      )
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload file for task
const uploadTaskFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { task_id } = req.body;

    if (!task_id) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "task_id is required" });
    }

    const pool = await getConnection();

    // Verify task exists and user has access
    const taskCheck = await pool
      .request()
      .input("taskId", sql.Int, task_id)
      .query("SELECT id, assigned_to_div FROM Tasks WHERE id = @taskId");

    if (taskCheck.recordset.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskCheck.recordset[0];

    // Permission check
    if (req.user.role === "user" && task.assigned_to_div !== req.user.id) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Access denied" });
    }

    // Save file record to database
    const result = await pool
      .request()
      .input("filename", sql.VarChar, req.file.filename)
      .input("original_filename", sql.VarChar, req.file.originalname)
      .input("file_path", sql.VarChar, req.file.path)
      .input("file_size", sql.Int, req.file.size)
      .input("mime_type", sql.VarChar, req.file.mimetype)
      .input("task_id", sql.Int, task_id)
      .input("uploaded_by", sql.Int, req.user.id).query(`
        INSERT INTO Files (filename, original_filename, file_path, file_size, mime_type, task_id, uploaded_by)
        VALUES (@filename, @original_filename, @file_path, @file_size, @mime_type, @task_id, @uploaded_by);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const fileId = result.recordset[0].id;

    res.status(201).json({
      message: "File uploaded successfully",
      fileId,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload task file error:", error);
    // Clean up file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to upload file" });
  }
};

// Upload file for subtask
const uploadSubtaskFile = async (req, res) => {
  try {
    console.log("Upload subtask file - req.body:", req.body);
    console.log("Upload subtask file - req.file:", req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { subtask_id } = req.body;
    console.log("Subtask ID received:", subtask_id, "Type:", typeof subtask_id);

    if (!subtask_id) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "subtask_id is required" });
    }

    const pool = await getConnection();

    // Verify subtask exists and user has access to parent task
    console.log("Checking if subtask exists with ID:", subtask_id);
    const subtaskCheck = await pool
      .request()
      .input("subtaskId", sql.Int, subtask_id).query(`
        SELECT s.id, t.assigned_to_div
        FROM Subtasks s
        INNER JOIN Tasks t ON s.task_id = t.id
        WHERE s.id = @subtaskId
      `);
    
    console.log("Subtask check result:", subtaskCheck.recordset);

    if (subtaskCheck.recordset.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Subtask not found" });
    }

    const subtask = subtaskCheck.recordset[0];

    // Permission check
    if (req.user.role === "user" && subtask.assigned_to_div !== req.user.id) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Access denied" });
    }

    // Save file record to database
    const result = await pool
      .request()
      .input("filename", sql.VarChar, req.file.filename)
      .input("original_filename", sql.VarChar, req.file.originalname)
      .input("file_path", sql.VarChar, req.file.path)
      .input("file_size", sql.Int, req.file.size)
      .input("mime_type", sql.VarChar, req.file.mimetype)
      .input("subtask_id", sql.Int, subtask_id)
      .input("uploaded_by", sql.Int, req.user.id).query(`
        INSERT INTO Files (filename, original_filename, file_path, file_size, mime_type, subtask_id, uploaded_by)
        VALUES (@filename, @original_filename, @file_path, @file_size, @mime_type, @subtask_id, @uploaded_by);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const fileId = result.recordset[0].id;

    console.log("Subtask file uploaded successfully, fileId:", fileId);
    
    res.status(201).json({
      message: "File uploaded successfully",
      fileId,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload subtask file error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      number: error.number,
    });
    // Clean up file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: "Failed to upload file",
      details: error.message 
    });
  }
};

// Get files for a task
const getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.params;
    const pool = await getConnection();

    // Verify task exists and user has access
    const taskCheck = await pool
      .request()
      .input("taskId", sql.Int, taskId)
      .query("SELECT id, assigned_to_div FROM Tasks WHERE id = @taskId");

    if (taskCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskCheck.recordset[0];

    // Permission check
    if (req.user.role === "user" && task.assigned_to_div !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.request().input("taskId", sql.Int, taskId).query(`
      SELECT 
        f.id, f.filename, f.original_filename, f.file_size, f.mime_type, f.created_at,
        u.name as uploaded_by_name, u.email as uploaded_by_email
      FROM Files f
      LEFT JOIN Users u ON f.uploaded_by = u.id
      WHERE f.task_id = @taskId
      ORDER BY f.created_at DESC
    `);

    res.json({ files: result.recordset });
  } catch (error) {
    console.error("Get task files error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

// Get files for a subtask
const getSubtaskFiles = async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const pool = await getConnection();

    // Verify subtask exists and user has access
    const subtaskCheck = await pool
      .request()
      .input("subtaskId", sql.Int, subtaskId).query(`
        SELECT s.id, t.assigned_to_div
        FROM Subtasks s
        INNER JOIN Tasks t ON s.task_id = t.id
        WHERE s.id = @subtaskId
      `);

    if (subtaskCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Subtask not found" });
    }

    const subtask = subtaskCheck.recordset[0];

    // Permission check
    if (req.user.role === "user" && subtask.assigned_to_div !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.request().input("subtaskId", sql.Int, subtaskId)
      .query(`
      SELECT 
        f.id, f.filename, f.original_filename, f.file_size, f.mime_type, f.created_at,
        u.name as uploaded_by_name, u.email as uploaded_by_email
      FROM Files f
      LEFT JOIN Users u ON f.uploaded_by = u.id
      WHERE f.subtask_id = @subtaskId
      ORDER BY f.created_at DESC
    `);

    res.json({ files: result.recordset });
  } catch (error) {
    console.error("Get subtask files error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const pool = await getConnection();

    // Get file info from database
    const result = await pool.request().input("fileId", sql.Int, fileId).query(`
      SELECT f.*, t.assigned_to_div
      FROM Files f
      LEFT JOIN Tasks t ON f.task_id = t.id
      LEFT JOIN Subtasks s ON f.subtask_id = s.id
      LEFT JOIN Tasks t2 ON s.task_id = t2.id
      WHERE f.id = @fileId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = result.recordset[0];

    // Permission check
    if (req.user.role === "user" && file.assigned_to_div !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.file_path)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    // Send file
    res.download(file.file_path, file.original_filename);
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const pool = await getConnection();

    // Get file info
    const result = await pool.request().input("fileId", sql.Int, fileId).query(`
      SELECT f.*, t.assigned_to_div, t.created_by
      FROM Files f
      LEFT JOIN Tasks t ON f.task_id = t.id
      LEFT JOIN Subtasks s ON f.subtask_id = s.id
      LEFT JOIN Tasks t2 ON s.task_id = t2.id
      WHERE f.id = @fileId
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = result.recordset[0];

    // Permission check: admin, manager, task creator, or file uploader can delete
    if (
      req.user.role === "user" &&
      file.uploaded_by !== req.user.id &&
      file.assigned_to_div !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete file from disk
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Delete file record from database
    await pool
      .request()
      .input("fileId", sql.Int, fileId)
      .query("DELETE FROM Files WHERE id = @fileId");

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};

module.exports = {
  upload,
  uploadTaskFile,
  uploadSubtaskFile,
  getTaskFiles,
  getSubtaskFiles,
  downloadFile,
  deleteFile,
};
