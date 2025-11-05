-- Migration Script: Add Task History Tracking
-- Run this script if you have an existing TaskManagementDB database
-- This will add the TaskHistory table without dropping existing data

USE TaskManagementDB;
GO

-- Check if TaskHistory table already exists
IF OBJECT_ID('TaskHistory', 'U') IS NULL
BEGIN
    PRINT 'Creating TaskHistory table...';
    
    -- Create TaskHistory Table
    CREATE TABLE TaskHistory (
        id INT PRIMARY KEY IDENTITY(1,1),
        task_id INT NOT NULL,
        changed_by INT NOT NULL,
        change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('status_change', 'assignment_change', 'tags_change', 'due_date_change', 'subtask_added', 'notes_updated', 'priority_change', 'task_created')),
        field_name VARCHAR(50),
        old_value TEXT,
        new_value TEXT,
        change_description TEXT,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES Users(id) ON DELETE NO ACTION
    );
    
    PRINT 'TaskHistory table created successfully!';
END
ELSE
BEGIN
    PRINT 'TaskHistory table already exists. Skipping creation.';
END
GO

-- Create indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_taskhistory_task_id')
BEGIN
    PRINT 'Creating index on task_id...';
    CREATE INDEX idx_taskhistory_task_id ON TaskHistory(task_id);
    PRINT 'Index created successfully!';
END
ELSE
BEGIN
    PRINT 'Index idx_taskhistory_task_id already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_taskhistory_changed_by')
BEGIN
    PRINT 'Creating index on changed_by...';
    CREATE INDEX idx_taskhistory_changed_by ON TaskHistory(changed_by);
    PRINT 'Index created successfully!';
END
ELSE
BEGIN
    PRINT 'Index idx_taskhistory_changed_by already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_taskhistory_created_at')
BEGIN
    PRINT 'Creating index on created_at...';
    CREATE INDEX idx_taskhistory_created_at ON TaskHistory(created_at);
    PRINT 'Index created successfully!';
END
ELSE
BEGIN
    PRINT 'Index idx_taskhistory_created_at already exists.';
END
GO

PRINT 'Migration completed successfully!';
PRINT 'Task history tracking is now enabled.';
GO
