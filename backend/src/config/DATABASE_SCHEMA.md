# Database Schema Documentation

## Overview

This document describes the database schema for the Task Management application. The schema is created on first run and uses SQLite via sql.js.

## Tables

### 1. Users

Stores user accounts with login capability (admin, manager, user roles).

| Column        | Type     | Constraints               | Description                        |
| ------------- | -------- | ------------------------- | ---------------------------------- |
| id            | INTEGER  | PRIMARY KEY AUTOINCREMENT | Unique user identifier             |
| name          | TEXT     | NOT NULL                  | User's full name                   |
| email         | TEXT     | NOT NULL UNIQUE           | User's email (used for login)      |
| password_hash | TEXT     | NOT NULL                  | Bcrypt hashed password             |
| role          | TEXT     | NOT NULL DEFAULT 'user'   | User role: admin, manager, or user |
| created_at    | DATETIME | NOT NULL DEFAULT now      | Account creation timestamp         |

### 2. DivUsers

Division users without login capability (simplified users for task assignment).

| Column     | Type     | Constraints               | Description                |
| ---------- | -------- | ------------------------- | -------------------------- |
| id         | INTEGER  | PRIMARY KEY AUTOINCREMENT | Unique div user identifier |
| name       | TEXT     | NOT NULL                  | Division user's name       |
| user_id    | INTEGER  | NOT NULL UNIQUE           | Reference to managing User |
| created_at | DATETIME | NOT NULL DEFAULT now      | Creation timestamp         |

**Foreign Keys:**

- `user_id` → `Users(id)` ON DELETE CASCADE

### 3. Tasks

Main task records.

| Column               | Type     | Constraints                    | Description                                             |
| -------------------- | -------- | ------------------------------ | ------------------------------------------------------- |
| id                   | INTEGER  | PRIMARY KEY AUTOINCREMENT      | Unique task identifier                                  |
| title                | TEXT     | NOT NULL                       | Task title                                              |
| description          | TEXT     | NULL                           | Detailed task description                               |
| assigned_to_div      | INTEGER  | NULL                           | Assigned division (User)                                |
| assigned_to_div_user | INTEGER  | NULL                           | Assigned division user (DivUser)                        |
| created_by           | INTEGER  | NOT NULL                       | User who created the task                               |
| assignment_date      | DATE     | NOT NULL DEFAULT now           | Date task was assigned                                  |
| due_date             | DATETIME | NULL                           | Task deadline                                           |
| status               | TEXT     | NOT NULL DEFAULT 'in_progress' | Status: in_progress, completed, or suspended (overdue) |
| tags                 | TEXT     | NULL                           | Legacy tags column (kept for compatibility)             |

**Foreign Keys:**

- `assigned_to_div` → `Users(id)` ON DELETE SET NULL
- `assigned_to_div_user` → `DivUsers(id)` ON DELETE SET NULL
- `created_by` → `Users(id)` ON DELETE NO ACTION

### 4. Subtasks

Sub-items of tasks for breaking down work.

| Column     | Type     | Constraints                    | Description                      |
| ---------- | -------- | ------------------------------ | -------------------------------- |
| id         | INTEGER  | PRIMARY KEY AUTOINCREMENT      | Unique subtask identifier        |
| task_id    | INTEGER  | NOT NULL                       | Parent task reference            |
| title      | TEXT     | NOT NULL                       | Subtask title                    |
| status     | TEXT     | NOT NULL DEFAULT 'in_progress' | Status: in_progress, completed, or suspended |
| created_at | DATETIME | NOT NULL DEFAULT now           | Creation timestamp               |

**Foreign Keys:**

- `task_id` → `Tasks(id)` ON DELETE CASCADE

### 5. TaskHistory

Audit log of task changes.

| Column             | Type     | Constraints               | Description                     |
| ------------------ | -------- | ------------------------- | ------------------------------- |
| id                 | INTEGER  | PRIMARY KEY AUTOINCREMENT | Unique history entry identifier |
| task_id            | INTEGER  | NOT NULL                  | Task that was changed           |
| changed_by         | INTEGER  | NOT NULL                  | User who made the change        |
| change_type        | TEXT     | NOT NULL                  | Type of change (see list below) |
| field_name         | TEXT     | NULL                      | Name of field that changed      |
| old_value          | TEXT     | NULL                      | Previous value                  |
| new_value          | TEXT     | NULL                      | New value                       |
| change_description | TEXT     | NULL                      | Human-readable description      |
| created_at         | DATETIME | NOT NULL DEFAULT now      | When change occurred            |

**Change Types:**

- status_change
- assignment_change
- tags_change
- due_date_change
- subtask_added
- task_created

**Foreign Keys:**

- `task_id` → `Tasks(id)` ON DELETE CASCADE
- `changed_by` → `Users(id)` ON DELETE NO ACTION

### 6. Tags

Reusable tags for categorizing tasks.

| Column     | Type     | Constraints               | Description           |
| ---------- | -------- | ------------------------- | --------------------- |
| id         | INTEGER  | PRIMARY KEY AUTOINCREMENT | Unique tag identifier |
| name       | TEXT     | NOT NULL UNIQUE           | Tag name              |
| created_at | DATETIME | NOT NULL DEFAULT now      | Creation timestamp    |

### 7. TaskTags

Junction table linking tasks to tags (many-to-many).

| Column     | Type     | Constraints               | Description            |
| ---------- | -------- | ------------------------- | ---------------------- |
| id         | INTEGER  | PRIMARY KEY AUTOINCREMENT | Unique link identifier |
| task_id    | INTEGER  | NOT NULL                  | Task reference         |
| tag_id     | INTEGER  | NOT NULL                  | Tag reference          |
| created_at | DATETIME | NOT NULL DEFAULT now      | When tag was added     |

**Unique Constraint:** (task_id, tag_id)

**Foreign Keys:**

- `task_id` → `Tasks(id)` ON DELETE CASCADE
- `tag_id` → `Tags(id)` ON DELETE CASCADE

### 8. Files

File attachments for tasks and subtasks.

| Column            | Type     | Constraints               | Description                             |
| ----------------- | -------- | ------------------------- | --------------------------------------- |
| id                | INTEGER  | PRIMARY KEY AUTOINCREMENT | Unique file identifier                  |
| filename          | TEXT     | NOT NULL                  | Stored filename (system)                |
| original_filename | TEXT     | NOT NULL                  | Original uploaded filename              |
| file_path         | TEXT     | NOT NULL                  | File system path                        |
| file_size         | INTEGER  | NOT NULL                  | File size in bytes                      |
| mime_type         | TEXT     | NOT NULL                  | MIME type of file                       |
| task_id           | INTEGER  | NULL                      | Parent task (if attached to task)       |
| subtask_id        | INTEGER  | NULL                      | Parent subtask (if attached to subtask) |
| uploaded_by       | INTEGER  | NOT NULL                  | User who uploaded                       |
| created_at        | DATETIME | NOT NULL DEFAULT now      | Upload timestamp                        |

**Check Constraint:** File must be attached to either a task OR a subtask (not both, not neither)

**Foreign Keys:**

- `task_id` → `Tasks(id)` ON DELETE CASCADE
- `subtask_id` → `Subtasks(id)` ON DELETE CASCADE
- `uploaded_by` → `Users(id)` ON DELETE NO ACTION

## Indexes

Performance indexes for common queries:

- `idx_divusers_user_id` on DivUsers(user_id)
- `idx_tasks_assigned_to_div` on Tasks(assigned_to_div)
- `idx_tasks_assigned_to_div_user` on Tasks(assigned_to_div_user)
- `idx_tasks_created_by` on Tasks(created_by)
- `idx_tasks_status` on Tasks(status)
- `idx_tasks_due_date` on Tasks(due_date)
- `idx_subtasks_task_id` on Subtasks(task_id)
- `idx_taskhistory_task_id` on TaskHistory(task_id)
- `idx_taskhistory_changed_by` on TaskHistory(changed_by)
- `idx_taskhistory_created_at` on TaskHistory(created_at)
- `idx_tags_name` on Tags(name)
- `idx_tasktags_task_id` on TaskTags(task_id)
- `idx_tasktags_tag_id` on TaskTags(tag_id)
- `idx_files_task_id` on Files(task_id)
- `idx_files_subtask_id` on Files(subtask_id)
- `idx_files_uploaded_by` on Files(uploaded_by)

## Schema Initialization

The schema is automatically created on first run when the database file doesn't exist. If the database already exists, the initialization is skipped to preserve existing data.

## Migrations

For future schema changes, create separate migration files in a dedicated migrations directory. The current `database.js` only handles initial schema creation.

## Data Persistence

The application uses sql.js (SQLite in-memory with file persistence):

- Database is loaded into memory on startup
- Changes are automatically saved to disk after write operations
- External modifications (e.g., from seed scripts) are detected and reloaded automatically
- Database location: `database/taskmanagement.db` (configurable via DB_PATH env variable)

## Seeding

To seed initial users, run:

```bash
npm run seed
```

This creates three default users:

- admin / password123 (role: admin)
- manager / password123 (role: manager)
- user / password123 (role: user)
