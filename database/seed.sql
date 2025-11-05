-- Seed data for Task Management System
-- Password for all users: "password123"
-- Hash generated with bcrypt, 10 rounds

USE TaskManagementDB;
GO

-- Insert sample users
-- Note: In production, generate proper hashed passwords using bcrypt
-- The hash below is for "password123"
INSERT INTO Users (name, email, password_hash, role) VALUES
('Admin User', 'admin@company.com', '$2a$10$PL8YKbKhy3OSlmEPQOshre7Wfg.Uwzml5DPiKbBs/LEQnrTwENQcu', 'admin'),
('Manager One', 'manager1@company.com', '$2a$10$PL8YKbKhy3OSlmEPQOshre7Wfg.Uwzml5DPiKbBs/LEQnrTwENQcu', 'manager'),
('John Doe', 'john@company.com', '$2a$10$PL8YKbKhy3OSlmEPQOshre7Wfg.Uwzml5DPiKbBs/LEQnrTwENQcu', 'user')
GO

-- Insert sample tasks
INSERT INTO Tasks (title, description, priority, assigned_to, created_by, due_date, status, tags) VALUES
('Setup development environment', 'Install required software and configure development tools', 'high', 4, 2, DATEADD(day, 2, GETDATE()), 'in_progress', 'setup,development'),
('Create database schema', 'Design and implement the database structure', 'high', 5, 2, DATEADD(day, 3, GETDATE()), 'completed', 'database,backend'),
('Implement authentication API', 'Build JWT-based authentication endpoints', 'high', 4, 2, DATEADD(day, 5, GETDATE()), 'not_started', 'backend,security'),
('Design UI mockups', 'Create wireframes and mockups for the application', 'medium', 6, 3, DATEADD(day, 7, GETDATE()), 'in_progress', 'design,frontend'),
('Write API documentation', 'Document all API endpoints with examples', 'medium', 5, 2, DATEADD(day, 10, GETDATE()), 'not_started', 'documentation'),
('Setup CI/CD pipeline', 'Configure automated testing and deployment', 'low', 4, 1, DATEADD(day, 14, GETDATE()), 'not_started', 'devops,automation'),
('Review security vulnerabilities', 'Conduct security audit and fix issues', 'high', 4, 1, DATEADD(day, -2, GETDATE()), 'blocked', 'security,urgent'),
('Create user manual', 'Write comprehensive user documentation', 'low', 6, 3, DATEADD(day, 20, GETDATE()), 'not_started', 'documentation,user');
GO

-- Insert sample subtasks
INSERT INTO Subtasks (task_id, title, status) VALUES
(1, 'Install Node.js and npm', 'completed'),
(1, 'Install Visual Studio Code', 'completed'),
(1, 'Setup Git repository', 'not_started'),
(2, 'Create Users table', 'completed'),
(2, 'Create Tasks table', 'completed'),
(2, 'Create Subtasks table', 'completed'),
(4, 'Create login page mockup', 'completed'),
(4, 'Create dashboard mockup', 'not_started'),
(4, 'Create task detail mockup', 'not_started');
GO

PRINT 'Sample data inserted successfully!';
PRINT 'Test user credentials:';
PRINT '  Admin: admin@company.com / password123';
PRINT '  Manager: manager1@company.com / password123';
PRINT '  User: john@company.com / password123';
GO
