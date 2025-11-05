-- Migration: Add Tags and TaskTags tables
-- This migration creates a proper tag management system

USE TaskManagementDB;
GO

-- Create Tags Table
IF OBJECT_ID('Tags', 'U') IS NULL
BEGIN
    CREATE TABLE Tags (
        id INT PRIMARY KEY IDENTITY(1,1),
        name VARCHAR(50) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_tags_name ON Tags(name);
    PRINT 'Tags table created successfully!';
END
ELSE
BEGIN
    PRINT 'Tags table already exists.';
END
GO

-- Create TaskTags Junction Table
IF OBJECT_ID('TaskTags', 'U') IS NULL
BEGIN
    CREATE TABLE TaskTags (
        id INT PRIMARY KEY IDENTITY(1,1),
        task_id INT NOT NULL,
        tag_id INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES Tags(id) ON DELETE CASCADE,
        UNIQUE(task_id, tag_id)
    );
    
    CREATE INDEX idx_tasktags_task_id ON TaskTags(task_id);
    CREATE INDEX idx_tasktags_tag_id ON TaskTags(tag_id);
    PRINT 'TaskTags table created successfully!';
END
ELSE
BEGIN
    PRINT 'TaskTags table already exists.';
END
GO

-- Migrate existing tags from Tasks.tags column to new structure
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tasks') AND name = 'tags')
BEGIN
    DECLARE @taskId INT;
    DECLARE @tags VARCHAR(255);
    DECLARE @tagName VARCHAR(50);
    DECLARE @tagId INT;
    DECLARE @pos INT;
    DECLARE @nextPos INT;
    
    DECLARE task_cursor CURSOR FOR 
        SELECT id, tags FROM Tasks WHERE tags IS NOT NULL AND tags != '';
    
    OPEN task_cursor;
    FETCH NEXT FROM task_cursor INTO @taskId, @tags;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Split comma-separated tags
        SET @tags = LTRIM(RTRIM(@tags)) + ',';
        SET @pos = 1;
        
        WHILE CHARINDEX(',', @tags, @pos) > 0
        BEGIN
            SET @nextPos = CHARINDEX(',', @tags, @pos);
            SET @tagName = LTRIM(RTRIM(SUBSTRING(@tags, @pos, @nextPos - @pos)));
            
            IF LEN(@tagName) > 0
            BEGIN
                -- Insert tag if it doesn't exist
                IF NOT EXISTS (SELECT 1 FROM Tags WHERE name = @tagName)
                BEGIN
                    INSERT INTO Tags (name) VALUES (@tagName);
                END
                
                -- Get tag ID
                SELECT @tagId = id FROM Tags WHERE name = @tagName;
                
                -- Link tag to task if not already linked
                IF NOT EXISTS (SELECT 1 FROM TaskTags WHERE task_id = @taskId AND tag_id = @tagId)
                BEGIN
                    INSERT INTO TaskTags (task_id, tag_id) VALUES (@taskId, @tagId);
                END
            END
            
            SET @pos = @nextPos + 1;
        END
        
        FETCH NEXT FROM task_cursor INTO @taskId, @tags;
    END
    
    CLOSE task_cursor;
    DEALLOCATE task_cursor;
    
    PRINT 'Existing tags migrated successfully!';
END
GO

PRINT 'Tags migration completed successfully!';
GO
