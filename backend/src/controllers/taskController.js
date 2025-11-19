const { getConnection, sql } = require("../config/database");

// Helper function to log task history
const logTaskHistory = async (
  pool,
  taskId,
  changedBy,
  changeType,
  fieldName,
  oldValue,
  newValue,
  description
) => {
  try {
    await pool
      .request()
      .input("task_id", sql.Int, taskId)
      .input("changed_by", sql.Int, changedBy)
      .input("change_type", sql.VarChar, changeType)
      .input("field_name", sql.VarChar, fieldName || null)
      .input("old_value", sql.Text, oldValue ? String(oldValue) : null)
      .input("new_value", sql.Text, newValue ? String(newValue) : null)
      .input("change_description", sql.Text, description || null).query(`
        INSERT INTO TaskHistory (task_id, changed_by, change_type, field_name, old_value, new_value, change_description)
        VALUES (@task_id, @changed_by, @change_type, @field_name, @old_value, @new_value, @change_description)
      `);
  } catch (error) {
    console.error("Error logging task history:", error);
  }
};

const normalizeDateTimeInput = (value) => {
  if (!value) return null;
  const parsedDate = new Date(value);
  if (isNaN(parsedDate.getTime())) {
    return null;
  }
  const isoString = parsedDate.toISOString().replace("Z", "").replace("T", " ");
  return isoString.split(".")[0];
};

const getAllTasks = async (req, res) => {
  try {
    const pool = await getConnection();
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        t.id, t.title, t.description, t.priority, t.assigned_to_div, t.assigned_to_div_user, 
        t.assignment_date, t.due_date, t.status, t.notes, t.created_by,
        u.name as assigned_to_div_name, u.email as assigned_to_div_email,
        du.name as assigned_to_div_user_name,
        c.name as created_by_name
      FROM Tasks t
      LEFT JOIN Users u ON t.assigned_to_div = u.id
      LEFT JOIN DivUsers du ON t.assigned_to_div_user = du.id
      LEFT JOIN Users c ON t.created_by = c.id
    `;

    // Role-based filtering
    if (userRole === "user") {
      query += ` WHERE t.assigned_to_div = @userId`;
    }
    // Admin and Manager see all tasks (or you can filter manager by team)

    query += ` ORDER BY t.due_date ASC, t.priority DESC`;

    const request = pool.request();
    if (userRole === "user") {
      request.input("userId", sql.Int, userId);
    }

    const result = await request.query(query);
    const tasks = result.recordset;

    // Fetch tags for all tasks
    for (const task of tasks) {
      const tagsResult = await pool.request().input("taskId", sql.Int, task.id)
        .query(`
          SELECT tg.id, tg.name
          FROM Tags tg
          INNER JOIN TaskTags tt ON tg.id = tt.tag_id
          WHERE tt.task_id = @taskId
          ORDER BY tg.name
        `);
      task.tags = tagsResult.recordset;
    }

    res.json({ tasks });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const result = await pool.request().input("id", sql.Int, id).query(`
        SELECT 
          t.id, t.title, t.description, t.priority, t.assigned_to_div, t.assigned_to_div_user,
          t.assignment_date, t.due_date, t.status, t.notes, t.created_by,
          u.name as assigned_to_div_name, u.email as assigned_to_div_email,
          du.name as assigned_to_div_user_name, c.name as created_by_name
        FROM Tasks t
        LEFT JOIN Users u ON t.assigned_to_div = u.id
        LEFT JOIN DivUsers du ON t.assigned_to_div_user = du.id
        LEFT JOIN Users c ON t.created_by = c.id
        WHERE t.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = result.recordset[0];

    // Check permissions
    if (req.user.role === "user" && task.assigned_to_div !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Fetch tags
    const tagsResult = await pool.request().input("taskId", sql.Int, id).query(`
        SELECT tg.id, tg.name
        FROM Tags tg
        INNER JOIN TaskTags tt ON tg.id = tt.tag_id
        WHERE tt.task_id = @taskId
        ORDER BY tg.name
      `);
    task.tags = tagsResult.recordset;

    // Fetch subtasks
    const subtasksResult = await pool
      .request()
      .input("taskId", sql.Int, id)
      .query("SELECT id, title, status FROM Subtasks WHERE task_id = @taskId");

    task.subtasks = subtasksResult.recordset;

    // Fetch files for each subtask
    for (let subtask of task.subtasks) {
      const subtaskFilesResult = await pool
        .request()
        .input("subtaskId", sql.Int, subtask.id).query(`
          SELECT id, filename, original_filename, file_size, mime_type, created_at
          FROM Files 
          WHERE subtask_id = @subtaskId
          ORDER BY created_at DESC
        `);
      subtask.files = subtaskFilesResult.recordset;
    }

    // Fetch files
    const filesResult = await pool.request().input("taskId", sql.Int, id)
      .query(`
        SELECT id, filename, original_filename, file_size, mime_type, created_at
        FROM Files 
        WHERE task_id = @taskId
        ORDER BY created_at DESC
      `);

    task.files = filesResult.recordset;

    res.json({ task });
  } catch (error) {
    console.error("Get task by ID error:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = "medium",
      assigned_to_div,
      assigned_to_div_user,
      due_date,
      status = "not_started",
      tag_ids = [],
      notes,
      subtasks = [],
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Only admin and manager can create tasks
    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ error: "Only admins and managers can create tasks" });
    }

    const pool = await getConnection();

    // Insert task
    const result = await pool
      .request()
      .input("title", sql.VarChar, title)
      .input("description", sql.Text, description || null)
      .input("priority", sql.VarChar, priority)
      .input("assigned_to_div", sql.Int, assigned_to_div || null)
      .input("assigned_to_div_user", sql.Int, assigned_to_div_user || null)
      .input("created_by", sql.Int, req.user.id)
      .input(
        "assignment_date",
        sql.Date,
        new Date().toISOString().split("T")[0]
      )
      .input("due_date", sql.Text, normalizeDateTimeInput(due_date))
      .input("status", sql.VarChar, status)
      .input("notes", sql.Text, notes || null).query(`
        INSERT INTO Tasks (title, description, priority, assigned_to_div, assigned_to_div_user, created_by, assignment_date, due_date, status, notes)
        VALUES (@title, @description, @priority, @assigned_to_div, @assigned_to_div_user, @created_by, @assignment_date, @due_date, @status, @notes);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const taskId = result.recordset[0].id;

    // Log task creation
    await logTaskHistory(
      pool,
      taskId,
      req.user.id,
      "task_created",
      null,
      null,
      null,
      `Task "${title}" created`
    );

    // Insert tag associations
    if (tag_ids && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await pool
          .request()
          .input("task_id", sql.Int, taskId)
          .input("tag_id", sql.Int, tagId).query(`
            INSERT INTO TaskTags (task_id, tag_id)
            VALUES (@task_id, @tag_id)
          `);
      }

      // Get tag names for logging
      const placeholders = tag_ids.map((_, idx) => `@tagId${idx}`).join(", ");
      const tagNamesRequest = pool.request();
      tag_ids.forEach((tagId, idx) => {
        tagNamesRequest.input(`tagId${idx}`, sql.Int, tagId);
      });
      const tagNames = await tagNamesRequest.query(`
        SELECT name FROM Tags WHERE id IN (${placeholders})
      `);
      const tagNamesList = tagNames.recordset.map((t) => t.name).join(", ");

      await logTaskHistory(
        pool,
        taskId,
        req.user.id,
        "tags_change",
        "tags",
        null,
        tagNamesList,
        `Tags added: ${tagNamesList}`
      );
    }

    // Insert subtasks if provided
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        await pool
          .request()
          .input("task_id", sql.Int, taskId)
          .input("title", sql.VarChar, subtask.title)
          .input("status", sql.VarChar, subtask.status || "not_started").query(`
            INSERT INTO Subtasks (task_id, title, status)
            VALUES (@task_id, @title, @status)
          `);

        // Log subtask creation
        await logTaskHistory(
          pool,
          taskId,
          req.user.id,
          "subtask_added",
          "subtask",
          null,
          subtask.title,
          `Subtask "${subtask.title}" added`
        );
      }
    }

    // Fetch the complete task with subtasks and files
    const createdTaskResult = await pool
      .request()
      .input("taskId", sql.Int, taskId).query(`
      SELECT
        t.*,
        c.name as created_by_name, c.email as created_by_email,
        ad.name as assigned_to_div_name, ad.email as assigned_to_div_email,
        adu.name as assigned_to_div_user_name
      FROM Tasks t
      LEFT JOIN Users c ON t.created_by = c.id
      LEFT JOIN Users ad ON t.assigned_to_div = ad.id
      LEFT JOIN DivUsers adu ON t.assigned_to_div_user = adu.id
      WHERE t.id = @taskId
    `);

    const createdTask = createdTaskResult.recordset[0];

    // Fetch tags
    const tagsResult = await pool.request().input("taskId", sql.Int, taskId)
      .query(`
      SELECT tg.id, tg.name
      FROM Tags tg
      INNER JOIN TaskTags tt ON tg.id = tt.tag_id
      WHERE tt.task_id = @taskId
      ORDER BY tg.name
    `);
    createdTask.tags = tagsResult.recordset;

    // Fetch subtasks
    const subtasksResult = await pool.request().input("taskId", sql.Int, taskId)
      .query(`
      SELECT s.id, s.task_id, s.title, s.status, s.created_at
      FROM Subtasks s
      WHERE s.task_id = @taskId
      ORDER BY s.created_at
    `);
    createdTask.subtasks = subtasksResult.recordset;

    // Fetch files for each subtask
    for (let subtask of createdTask.subtasks) {
      const subtaskFilesResult = await pool
        .request()
        .input("subtaskId", sql.Int, subtask.id).query(`
          SELECT id, filename, original_filename, file_size, mime_type, created_at
          FROM Files 
          WHERE subtask_id = @subtaskId
          ORDER BY created_at DESC
        `);
      subtask.files = subtaskFilesResult.recordset;
    }

    // Fetch files
    const filesResult = await pool.request().input("taskId", sql.Int, taskId)
      .query(`
      SELECT
        f.id, f.filename, f.original_filename, f.file_size, f.mime_type, f.created_at,
        u.name as uploaded_by_name, u.email as uploaded_by_email
      FROM Files f
      LEFT JOIN Users u ON f.uploaded_by = u.id
      WHERE f.task_id = @taskId
      ORDER BY f.created_at DESC
    `);
    createdTask.files = filesResult.recordset;

    res.status(201).json({
      message: "Task created successfully",
      task: createdTask,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      assigned_to_div,
      assigned_to_div_user,
      due_date,
      status,
      tag_ids,
      notes,
      subtasks,
    } = req.body;

    const pool = await getConnection();

    // Check if task exists and get current data
    const taskCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Tasks WHERE id = @id");

    if (taskCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskCheck.recordset[0];

    // Permission check
    if (req.user.role === "user" && task.assigned_to_div !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only edit tasks assigned to you" });
    }

    // Get assigned user/divUser names for history logging
    let oldAssignedDivName = null;
    let newAssignedDivName = null;
    let oldAssignedDivUserName = null;
    let newAssignedDivUserName = null;

    if (
      assigned_to_div !== undefined &&
      assigned_to_div !== task.assigned_to_div &&
      req.user.role !== "user"
    ) {
      if (task.assigned_to_div) {
        const oldUser = await pool
          .request()
          .input("userId", sql.Int, task.assigned_to_div)
          .query("SELECT name FROM Users WHERE id = @userId");
        oldAssignedDivName = oldUser.recordset[0]?.name;
      }
      if (assigned_to_div) {
        const newUser = await pool
          .request()
          .input("userId", sql.Int, assigned_to_div)
          .query("SELECT name FROM Users WHERE id = @userId");
        newAssignedDivName = newUser.recordset[0]?.name;
      }
    }

    if (
      assigned_to_div_user !== undefined &&
      assigned_to_div_user !== task.assigned_to_div_user &&
      req.user.role !== "user"
    ) {
      if (task.assigned_to_div_user) {
        const oldDivUser = await pool
          .request()
          .input("divUserId", sql.Int, task.assigned_to_div_user)
          .query("SELECT name FROM DivUsers WHERE id = @divUserId");
        oldAssignedDivUserName = oldDivUser.recordset[0]?.name;
      }
      if (assigned_to_div_user) {
        const newDivUser = await pool
          .request()
          .input("divUserId", sql.Int, assigned_to_div_user)
          .query("SELECT name FROM DivUsers WHERE id = @divUserId");
        newAssignedDivUserName = newDivUser.recordset[0]?.name;
      }
    }

    // Build update query
    let updateFields = [];
    let request = pool.request().input("id", sql.Int, id);

    if (title !== undefined) {
      updateFields.push("title = @title");
      request.input("title", sql.VarChar, title);
    }
    if (description !== undefined) {
      updateFields.push("description = @description");
      request.input("description", sql.Text, description);
    }
    if (priority !== undefined && priority !== task.priority) {
      updateFields.push("priority = @priority");
      request.input("priority", sql.VarChar, priority);
      // Log priority change
      await logTaskHistory(
        pool,
        id,
        req.user.id,
        "priority_change",
        "priority",
        task.priority,
        priority,
        `Priority changed from ${task.priority} to ${priority}`
      );
    }
    if (
      assigned_to_div !== undefined &&
      assigned_to_div !== task.assigned_to_div &&
      req.user.role !== "user"
    ) {
      updateFields.push("assigned_to_div = @assigned_to_div");
      request.input("assigned_to_div", sql.Int, assigned_to_div);
      // Log assignment change
      await logTaskHistory(
        pool,
        id,
        req.user.id,
        "assignment_change",
        "assigned_to_div",
        oldAssignedDivName || "Unassigned",
        newAssignedDivName || "Unassigned",
        `Task division reassigned from ${
          oldAssignedDivName || "Unassigned"
        } to ${newAssignedDivName || "Unassigned"}`
      );
    }
    if (
      assigned_to_div_user !== undefined &&
      assigned_to_div_user !== task.assigned_to_div_user &&
      req.user.role !== "user"
    ) {
      updateFields.push("assigned_to_div_user = @assigned_to_div_user");
      request.input("assigned_to_div_user", sql.Int, assigned_to_div_user);
      // Log div user assignment change
      await logTaskHistory(
        pool,
        id,
        req.user.id,
        "assignment_change",
        "assigned_to_div_user",
        oldAssignedDivUserName || "Unassigned",
        newAssignedDivUserName || "Unassigned",
        `Task DivUser reassigned from ${
          oldAssignedDivUserName || "Unassigned"
        } to ${newAssignedDivUserName || "Unassigned"}`
      );
    }
    if (due_date !== undefined) {
      // Normalize both datetimes to ISO format for comparison
      const oldDateTime = task.due_date
        ? new Date(task.due_date).toISOString()
        : null;
      const newDateTime = due_date ? new Date(due_date).toISOString() : null;
      const normalizedDueDate = normalizeDateTimeInput(due_date);

      if (oldDateTime !== newDateTime) {
        updateFields.push("due_date = @due_date");
        request.input("due_date", sql.Text, normalizedDueDate);

        // Format for logging
        const oldDateFormatted = oldDateTime
          ? new Date(oldDateTime).toLocaleString()
          : "None";
        const newDateFormatted = newDateTime
          ? new Date(newDateTime).toLocaleString()
          : "None";

        // Log due date change
        await logTaskHistory(
          pool,
          id,
          req.user.id,
          "due_date_change",
          "due_date",
          oldDateFormatted,
          newDateFormatted,
          `Due date changed from ${oldDateFormatted} to ${newDateFormatted}`
        );
      }
    }
    if (status !== undefined && status !== task.status) {
      updateFields.push("status = @status");
      request.input("status", sql.VarChar, status);
      // Log status change
      await logTaskHistory(
        pool,
        id,
        req.user.id,
        "status_change",
        "status",
        task.status,
        status,
        `Status changed from ${task.status} to ${status}`
      );
    }
    // Handle tag updates
    if (tag_ids !== undefined) {
      // Get existing tags
      const existingTags = await pool.request().input("taskId", sql.Int, id)
        .query(`
          SELECT tg.id, tg.name
          FROM Tags tg
          INNER JOIN TaskTags tt ON tg.id = tt.tag_id
          WHERE tt.task_id = @taskId
        `);

      const existingTagIds = existingTags.recordset.map((t) => t.id);
      const existingTagNames = existingTags.recordset
        .map((t) => t.name)
        .join(", ");

      // Delete existing tag associations
      await pool
        .request()
        .input("taskId", sql.Int, id)
        .query("DELETE FROM TaskTags WHERE task_id = @taskId");

      // Insert new tag associations
      if (tag_ids && tag_ids.length > 0) {
        for (const tagId of tag_ids) {
          await pool
            .request()
            .input("task_id", sql.Int, id)
            .input("tag_id", sql.Int, tagId).query(`
              INSERT INTO TaskTags (task_id, tag_id)
              VALUES (@task_id, @tag_id)
            `);
        }

        // Get new tag names for logging
        const placeholders = tag_ids.map((_, idx) => `@tagId${idx}`).join(", ");
        const newTagsRequest = pool.request();
        tag_ids.forEach((tagId, idx) => {
          newTagsRequest.input(`tagId${idx}`, sql.Int, tagId);
        });
        const newTags = await newTagsRequest.query(`
          SELECT name FROM Tags WHERE id IN (${placeholders})
        `);
        const newTagNames = newTags.recordset.map((t) => t.name).join(", ");

        // Log tags change if different
        const tagsChanged =
          JSON.stringify(existingTagIds.sort()) !==
          JSON.stringify(tag_ids.sort());
        if (tagsChanged) {
          await logTaskHistory(
            pool,
            id,
            req.user.id,
            "tags_change",
            "tags",
            existingTagNames || "None",
            newTagNames,
            `Tags changed from "${
              existingTagNames || "None"
            }" to "${newTagNames}"`
          );
        }
      } else if (existingTagIds.length > 0) {
        // All tags removed
        await logTaskHistory(
          pool,
          id,
          req.user.id,
          "tags_change",
          "tags",
          existingTagNames,
          "None",
          `All tags removed (was: "${existingTagNames}")`
        );
      }
    }
    if (notes !== undefined && notes !== task.notes) {
      updateFields.push("notes = @notes");
      request.input("notes", sql.Text, notes);
      // Log notes update
      await logTaskHistory(
        pool,
        id,
        req.user.id,
        "notes_updated",
        "notes",
        task.notes || "None",
        notes || "None",
        `Notes changed from "${task.notes || "None"}" to "${notes || "None"}"`
      );
    }

    if (updateFields.length > 0) {
      await request.query(
        `UPDATE Tasks SET ${updateFields.join(", ")} WHERE id = @id`
      );
    }

    // Update subtasks if provided
    if (subtasks) {
      // Get existing subtasks with their files for preservation
      const existingSubtasks = await pool
        .request()
        .input("taskId", sql.Int, id)
        .query("SELECT id, title FROM Subtasks WHERE task_id = @taskId");

      const existingTitles = existingSubtasks.recordset.map((st) => st.title);

      // Get files for existing subtasks to preserve them
      const subtaskFilesMap = new Map();
      for (const existingSubtask of existingSubtasks.recordset) {
        const filesResult = await pool
          .request()
          .input("subtaskId", sql.Int, existingSubtask.id).query(`
            SELECT id, filename, original_filename, file_path, file_size, mime_type, uploaded_by, created_at
            FROM Files 
            WHERE subtask_id = @subtaskId
          `);
        if (filesResult.recordset.length > 0) {
          subtaskFilesMap.set(existingSubtask.title, filesResult.recordset);
        }
      }

      // Delete existing subtasks (this will cascade delete files)
      await pool
        .request()
        .input("taskId", sql.Int, id)
        .query("DELETE FROM Subtasks WHERE task_id = @taskId");

      // Insert new subtasks and restore files
      for (const subtask of subtasks) {
        const insertResult = await pool
          .request()
          .input("task_id", sql.Int, id)
          .input("title", sql.VarChar, subtask.title)
          .input("status", sql.VarChar, subtask.status || "not_started").query(`
            INSERT INTO Subtasks (task_id, title, status)
            VALUES (@task_id, @title, @status);
            SELECT last_insert_rowid() AS id;
          `);

        const newSubtaskId = insertResult.recordset[0].id;

        // Restore files for this subtask if they existed before
        if (subtaskFilesMap.has(subtask.title)) {
          const filesToRestore = subtaskFilesMap.get(subtask.title);
          for (const file of filesToRestore) {
            await pool
              .request()
              .input("filename", sql.VarChar, file.filename)
              .input("original_filename", sql.VarChar, file.original_filename)
              .input("file_path", sql.VarChar, file.file_path)
              .input("file_size", sql.Int, file.file_size)
              .input("mime_type", sql.VarChar, file.mime_type)
              .input("subtask_id", sql.Int, newSubtaskId)
              .input("uploaded_by", sql.Int, file.uploaded_by)
              .input("created_at", sql.VarChar, file.created_at).query(`
                INSERT INTO Files (filename, original_filename, file_path, file_size, mime_type, subtask_id, uploaded_by, created_at)
                VALUES (@filename, @original_filename, @file_path, @file_size, @mime_type, @subtask_id, @uploaded_by, @created_at)
              `);
          }
        }

        // Log if this is a new subtask
        if (!existingTitles.includes(subtask.title)) {
          await logTaskHistory(
            pool,
            id,
            req.user.id,
            "subtask_added",
            "subtask",
            null,
            subtask.title,
            `Subtask "${subtask.title}" added`
          );
        }
      }
    }

    // Fetch the updated complete task
    const updatedTaskResult = await pool.request().input("taskId", sql.Int, id)
      .query(`
      SELECT
        t.*,
        c.name as created_by_name, c.email as created_by_email,
        ad.name as assigned_to_div_name, ad.email as assigned_to_div_email,
        adu.name as assigned_to_div_user_name
      FROM Tasks t
      LEFT JOIN Users c ON t.created_by = c.id
      LEFT JOIN Users ad ON t.assigned_to_div = ad.id
      LEFT JOIN DivUsers adu ON t.assigned_to_div_user = adu.id
      WHERE t.id = @taskId
    `);

    const updatedTask = updatedTaskResult.recordset[0];

    // Fetch tags
    const tagsResult = await pool.request().input("taskId", sql.Int, id).query(`
      SELECT tg.id, tg.name
      FROM Tags tg
      INNER JOIN TaskTags tt ON tg.id = tt.tag_id
      WHERE tt.task_id = @taskId
      ORDER BY tg.name
    `);
    updatedTask.tags = tagsResult.recordset;

    // Fetch subtasks
    const subtasksResult = await pool.request().input("taskId", sql.Int, id)
      .query(`
      SELECT s.id, s.task_id, s.title, s.status, s.created_at
      FROM Subtasks s
      WHERE s.task_id = @taskId
      ORDER BY s.created_at
    `);
    updatedTask.subtasks = subtasksResult.recordset;

    // Fetch files for each subtask
    for (let subtask of updatedTask.subtasks) {
      const subtaskFilesResult = await pool
        .request()
        .input("subtaskId", sql.Int, subtask.id).query(`
          SELECT id, filename, original_filename, file_size, mime_type, created_at
          FROM Files 
          WHERE subtask_id = @subtaskId
          ORDER BY created_at DESC
        `);
      subtask.files = subtaskFilesResult.recordset;
    }

    // Fetch files
    const filesResult = await pool.request().input("taskId", sql.Int, id)
      .query(`
      SELECT
        f.id, f.filename, f.original_filename, f.file_size, f.mime_type, f.created_at,
        u.name as uploaded_by_name, u.email as uploaded_by_email
      FROM Files f
      LEFT JOIN Users u ON f.uploaded_by = u.id
      WHERE f.task_id = @taskId
      ORDER BY f.created_at DESC
    `);
    updatedTask.files = filesResult.recordset;

    res.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Check if task exists
    const taskCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT assigned_to_div, created_by FROM Tasks WHERE id = @id");

    if (taskCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Only admin and manager can delete tasks
    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ error: "Only admins and managers can delete tasks" });
    }

    // Delete associated files from disk and database
    const filesResult = await pool
      .request()
      .input("taskId", sql.Int, id)
      .query("SELECT file_path FROM Files WHERE task_id = @taskId");

    for (const file of filesResult.recordset) {
      const fs = require("fs");
      if (fs.existsSync(file.file_path)) {
        fs.unlinkSync(file.file_path);
      }
    }

    await pool
      .request()
      .input("taskId", sql.Int, id)
      .query("DELETE FROM Files WHERE task_id = @taskId");

    // Delete subtasks (cascade will handle subtask files)
    await pool
      .request()
      .input("taskId", sql.Int, id)
      .query("DELETE FROM Subtasks WHERE task_id = @taskId");

    // Delete task
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Tasks WHERE id = @id");

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

const getTaskSummary = async (req, res) => {
  try {
    const pool = await getConnection();
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = "";
    const request = pool.request();

    if (userRole === "user") {
      whereClause = "WHERE assigned_to_div = @userId";
      request.input("userId", sql.Int, userId);
    }

    const result = await request.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
        SUM(
          CASE 
            WHEN due_date IS NOT NULL 
              AND datetime(substr(due_date, 1, 19)) < datetime('now') 
              AND status != 'completed' 
            THEN 1 
            ELSE 0 
          END
        ) as overdue
      FROM Tasks
      ${whereClause}
    `);

    res.json({ summary: result.recordset[0] });
  } catch (error) {
    console.error("Get task summary error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};

const getTaskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    // Check if task exists
    const taskCheck = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT id, assigned_to_div FROM Tasks WHERE id = @id");

    if (taskCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskCheck.recordset[0];

    // Permission check
    if (req.user.role === "user" && task.assigned_to_div !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Fetch task history
    const result = await pool.request().input("taskId", sql.Int, id).query(`
        SELECT 
          th.id, th.change_type, th.field_name, th.old_value, th.new_value, 
          th.change_description, th.created_at,
          u.name as changed_by_name, u.email as changed_by_email
        FROM TaskHistory th
        LEFT JOIN Users u ON th.changed_by = u.id
        WHERE th.task_id = @taskId
        ORDER BY th.created_at DESC
      `);

    res.json({ history: result.recordset });
  } catch (error) {
    console.error("Get task history error:", error);
    res.status(500).json({ error: "Failed to fetch task history" });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskSummary,
  getTaskHistory,
};
