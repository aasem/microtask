const { getConnection, sql } = require('../config/database');

const getAllTasks = async (req, res) => {
  try {
    const pool = await getConnection();
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        t.id, t.title, t.description, t.priority, t.assignment_date, 
        t.due_date, t.status, t.tags, t.notes, t.created_by,
        u.name as assigned_to_name, u.email as assigned_to_email,
        c.name as created_by_name
      FROM Tasks t
      LEFT JOIN Users u ON t.assigned_to = u.id
      LEFT JOIN Users c ON t.created_by = c.id
    `;

    // Role-based filtering
    if (userRole === 'user') {
      query += ` WHERE t.assigned_to = @userId`;
    }
    // Admin and Manager see all tasks (or you can filter manager by team)

    query += ` ORDER BY t.due_date ASC, t.priority DESC`;

    const request = pool.request();
    if (userRole === 'user') {
      request.input('userId', sql.Int, userId);
    }

    const result = await request.query(query);

    res.json({ tasks: result.recordset });
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          t.id, t.title, t.description, t.priority, t.assigned_to, t.assignment_date, 
          t.due_date, t.status, t.tags, t.notes, t.created_by,
          u.name as assigned_to_name, u.email as assigned_to_email,
          c.name as created_by_name
        FROM Tasks t
        LEFT JOIN Users u ON t.assigned_to = u.id
        LEFT JOIN Users c ON t.created_by = c.id
        WHERE t.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.recordset[0];

    // Check permissions
    if (req.user.role === 'user' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch subtasks
    const subtasksResult = await pool.request()
      .input('taskId', sql.Int, id)
      .query('SELECT id, title, status FROM Subtasks WHERE task_id = @taskId');

    task.subtasks = subtasksResult.recordset;

    res.json({ task });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      assigned_to,
      due_date,
      status = 'not_started',
      tags,
      notes,
      subtasks = []
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Only admin and manager can create tasks
    if (req.user.role === 'user') {
      return res.status(403).json({ error: 'Only admins and managers can create tasks' });
    }

    const pool = await getConnection();

    // Insert task
    const result = await pool.request()
      .input('title', sql.VarChar, title)
      .input('description', sql.Text, description || null)
      .input('priority', sql.VarChar, priority)
      .input('assigned_to', sql.Int, assigned_to || null)
      .input('created_by', sql.Int, req.user.id)
      .input('assignment_date', sql.Date, new Date())
      .input('due_date', sql.Date, due_date || null)
      .input('status', sql.VarChar, status)
      .input('tags', sql.VarChar, tags || null)
      .input('notes', sql.Text, notes || null)
      .query(`
        INSERT INTO Tasks (title, description, priority, assigned_to, created_by, assignment_date, due_date, status, tags, notes)
        VALUES (@title, @description, @priority, @assigned_to, @created_by, @assignment_date, @due_date, @status, @tags, @notes);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const taskId = result.recordset[0].id;

    // Insert subtasks if provided
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        await pool.request()
          .input('task_id', sql.Int, taskId)
          .input('title', sql.VarChar, subtask.title)
          .input('status', sql.VarChar, subtask.status || 'not_started')
          .query(`
            INSERT INTO Subtasks (task_id, title, status)
            VALUES (@task_id, @title, @status)
          `);
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      taskId
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      assigned_to,
      due_date,
      status,
      tags,
      notes,
      subtasks
    } = req.body;

    const pool = await getConnection();

    // Check if task exists and get current data
    const taskCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT assigned_to, created_by FROM Tasks WHERE id = @id');

    if (taskCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskCheck.recordset[0];

    // Permission check
    if (req.user.role === 'user' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit tasks assigned to you' });
    }

    // Build update query
    let updateFields = [];
    let request = pool.request().input('id', sql.Int, id);

    if (title !== undefined) {
      updateFields.push('title = @title');
      request.input('title', sql.VarChar, title);
    }
    if (description !== undefined) {
      updateFields.push('description = @description');
      request.input('description', sql.Text, description);
    }
    if (priority !== undefined) {
      updateFields.push('priority = @priority');
      request.input('priority', sql.VarChar, priority);
    }
    if (assigned_to !== undefined && req.user.role !== 'user') {
      updateFields.push('assigned_to = @assigned_to');
      request.input('assigned_to', sql.Int, assigned_to);
    }
    if (due_date !== undefined) {
      updateFields.push('due_date = @due_date');
      request.input('due_date', sql.Date, due_date);
    }
    if (status !== undefined) {
      updateFields.push('status = @status');
      request.input('status', sql.VarChar, status);
    }
    if (tags !== undefined) {
      updateFields.push('tags = @tags');
      request.input('tags', sql.VarChar, tags);
    }
    if (notes !== undefined) {
      updateFields.push('notes = @notes');
      request.input('notes', sql.Text, notes);
    }

    if (updateFields.length > 0) {
      await request.query(`UPDATE Tasks SET ${updateFields.join(', ')} WHERE id = @id`);
    }

    // Update subtasks if provided
    if (subtasks) {
      // Delete existing subtasks
      await pool.request()
        .input('taskId', sql.Int, id)
        .query('DELETE FROM Subtasks WHERE task_id = @taskId');

      // Insert new subtasks
      for (const subtask of subtasks) {
        await pool.request()
          .input('task_id', sql.Int, id)
          .input('title', sql.VarChar, subtask.title)
          .input('status', sql.VarChar, subtask.status || 'not_started')
          .query(`
            INSERT INTO Subtasks (task_id, title, status)
            VALUES (@task_id, @title, @status)
          `);
      }
    }

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Check if task exists
    const taskCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT assigned_to, created_by FROM Tasks WHERE id = @id');

    if (taskCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only admin and manager can delete tasks
    if (req.user.role === 'user') {
      return res.status(403).json({ error: 'Only admins and managers can delete tasks' });
    }

    // Delete subtasks first
    await pool.request()
      .input('taskId', sql.Int, id)
      .query('DELETE FROM Subtasks WHERE task_id = @taskId');

    // Delete task
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Tasks WHERE id = @id');

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

const getTaskSummary = async (req, res) => {
  try {
    const pool = await getConnection();
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = '';
    const request = pool.request();

    if (userRole === 'user') {
      whereClause = 'WHERE assigned_to = @userId';
      request.input('userId', sql.Int, userId);
    }

    const result = await request.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN due_date < CAST(GETDATE() AS DATE) AND status != 'completed' THEN 1 ELSE 0 END) as overdue
      FROM Tasks
      ${whereClause}
    `);

    res.json({ summary: result.recordset[0] });
  } catch (error) {
    console.error('Get task summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskSummary,
};
