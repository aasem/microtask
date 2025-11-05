-- Task Management Database Schema
-- Microsoft SQL Server

-- Create Database (run separately if needed)
-- CREATE DATABASE TaskManagementDB;
-- GO

USE TaskManagementDB;
GO

-- Drop tables if they exist (for clean setup)
IF OBJECT_ID('TaskHistory', 'U') IS NOT NULL DROP TABLE TaskHistory;
IF OBJECT_ID('Subtasks', 'U') IS NOT NULL DROP TABLE Subtasks;
IF OBJECT_ID('Tasks', 'U') IS NOT NULL DROP TABLE Tasks;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

-- Users Table
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Tasks Table
CREATE TABLE Tasks (
    id INT PRIMARY KEY IDENTITY(1,1),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    assigned_to INT,
    created_by INT NOT NULL,
    assignment_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
    tags VARCHAR(255),
    notes TEXT,
    FOREIGN KEY (assigned_to) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE NO ACTION
);
GO

-- Subtasks Table
CREATE TABLE Subtasks (
    id INT PRIMARY KEY IDENTITY(1,1),
    task_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'completed')),
    FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE
);
GO

-- TaskHistory Table
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
GO

-- Create Indexes for better performance
CREATE INDEX idx_tasks_assigned_to ON Tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON Tasks(created_by);
CREATE INDEX idx_tasks_status ON Tasks(status);
CREATE INDEX idx_tasks_due_date ON Tasks(due_date);
CREATE INDEX idx_subtasks_task_id ON Subtasks(task_id);
CREATE INDEX idx_taskhistory_task_id ON TaskHistory(task_id);
CREATE INDEX idx_taskhistory_changed_by ON TaskHistory(changed_by);
CREATE INDEX idx_taskhistory_created_at ON TaskHistory(created_at);
GO

PRINT 'Database schema created successfully!';
GO
