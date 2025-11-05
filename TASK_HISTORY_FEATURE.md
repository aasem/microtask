# Task History Tracking Feature

## Overview

The Task History Tracking feature provides a comprehensive timeline of all changes made to tasks in the system. Every modification to a task is automatically logged and can be viewed in a beautiful, interactive timeline interface.

## What's Tracked

The system automatically tracks the following changes:

### 1. **Task Creation**
- When a new task is created
- Who created it

### 2. **Status Changes**
- Changes from one status to another (e.g., "not_started" → "in_progress")
- Previous and new status values

### 3. **Assignment Changes**
- When a task is assigned or reassigned to different users
- Previous assignee and new assignee names

### 4. **Priority Changes**
- Changes in task priority (high, medium, low)
- Previous and new priority values

### 5. **Due Date Changes**
- Updates to the task due date
- Previous and new due date values

### 6. **Tags Changes**
- Modifications to task tags
- Previous and new tag values

### 7. **Notes Updates**
- When task notes are added or modified
- Records that notes were updated (doesn't store full note content for privacy)

### 8. **Subtasks Added**
- When new subtasks are added to a task
- Name of the added subtask

## Database Schema

### TaskHistory Table

```sql
CREATE TABLE TaskHistory (
    id INT PRIMARY KEY IDENTITY(1,1),
    task_id INT NOT NULL,
    changed_by INT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    change_description TEXT,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES Users(id) ON DELETE NO ACTION
);
```

**Change Types:**
- `task_created`
- `status_change`
- `assignment_change`
- `priority_change`
- `due_date_change`
- `tags_change`
- `notes_updated`
- `subtask_added`

## API Endpoints

### Get Task History

```
GET /api/v1/tasks/:id/history
```

**Authentication:** Required (JWT token)

**Authorization:** 
- Admins and Managers: Can view history of any task
- Users: Can only view history of tasks assigned to them

**Response:**

```json
{
  "history": [
    {
      "id": 1,
      "change_type": "status_change",
      "field_name": "status",
      "old_value": "not_started",
      "new_value": "in_progress",
      "change_description": "Status changed from not_started to in_progress",
      "created_at": "2025-11-05T10:30:00.000Z",
      "changed_by_name": "John Doe",
      "changed_by_email": "john@example.com"
    },
    {
      "id": 2,
      "change_type": "task_created",
      "field_name": null,
      "old_value": null,
      "new_value": null,
      "change_description": "Task \"Update website design\" created",
      "created_at": "2025-11-05T09:00:00.000Z",
      "changed_by_name": "Jane Smith",
      "changed_by_email": "jane@example.com"
    }
  ]
}
```

## Frontend Implementation

### TaskView Page

Navigate to any task by clicking on a task card in the dashboard. The TaskView page has two tabs:

#### 1. Task Details Tab
- Displays complete task information
- Shows assignee, creator, dates, tags, notes, and subtasks
- Clean, organized layout with icons

#### 2. History Timeline Tab
- Interactive timeline showing all changes
- Each change shows:
  - Type of change (with icon)
  - Description of what changed
  - Who made the change
  - When the change occurred
  - Previous and new values (when applicable)
- Sorted by most recent first
- Visual timeline with connecting line

### Navigation

- Click any task card in the dashboard to view its details and history
- Task cards are now clickable (cursor changes to pointer on hover)
- Edit and delete buttons still work as before (clicking them won't navigate)
- "Back to Dashboard" button returns to main view

## Installation & Setup

### For New Installations

The TaskHistory table is included in the main `schema.sql` file. Simply run:

```bash
sqlcmd -S localhost -d master -i database/schema.sql
```

### For Existing Installations

If you already have the database set up, run the migration script:

```bash
sqlcmd -S localhost -d TaskManagementDB -i database/migration_add_history.sql
```

This script will:
- Check if TaskHistory table exists
- Create the table if it doesn't exist
- Create necessary indexes
- Skip if already exists (safe to run multiple times)

## Usage Examples

### Viewing Task History

1. **From Dashboard:**
   - Click on any task card
   - The TaskView page opens
   - Click "History Timeline" tab

2. **History Timeline Shows:**
   - All changes in chronological order (newest first)
   - Color-coded change types with icons
   - User who made each change
   - Timestamp of each change
   - Before/after values for applicable changes

### What Triggers History Logging

History is automatically logged when:
- A new task is created
- Task status is updated
- Task is assigned/reassigned
- Task priority changes
- Due date is modified
- Tags are changed
- Notes are updated
- New subtasks are added

**No manual intervention required** - all logging happens automatically in the backend.

## Benefits

### For Team Members
- Full transparency on task changes
- Easy to track who did what and when
- Understanding of task evolution over time
- Accountability for changes

### For Managers
- Monitor task progress and activity
- Identify bottlenecks or frequent changes
- Audit trail for important tasks
- Better project oversight

### For Admins
- Complete audit trail
- Data integrity verification
- Troubleshooting and support
- Compliance and reporting

## Technical Details

### Backend Implementation

The task history logging is implemented using a helper function:

```javascript
const logTaskHistory = async (pool, taskId, changedBy, changeType, fieldName, oldValue, newValue, description)
```

This function is called automatically within:
- `createTask()` - logs task creation and subtasks
- `updateTask()` - compares old vs new values and logs changes

### Automatic Change Detection

The `updateTask` function compares incoming values with existing task data:
- Only logs changes when values actually differ
- Fetches user names for assignment changes
- Formats dates consistently
- Handles null/undefined values gracefully

### Performance Considerations

- Indexed on `task_id`, `changed_by`, and `created_at` for fast queries
- History queries are separate from main task queries
- Pagination can be added if history grows large
- CASCADE delete ensures history is removed when task is deleted

## Future Enhancements

Potential additions for future versions:

1. **History Filtering**
   - Filter by change type
   - Filter by date range
   - Filter by user

2. **Bulk Change Detection**
   - Group related changes together
   - Show bulk updates more clearly

3. **Restore Functionality**
   - Revert to previous task states
   - Undo recent changes

4. **Export History**
   - Export timeline to PDF
   - CSV export for reporting

5. **Notifications**
   - Email alerts on specific changes
   - Webhook integrations

## Troubleshooting

### History Not Showing

1. **Check database:**
   ```sql
   SELECT COUNT(*) FROM TaskHistory WHERE task_id = <your_task_id>;
   ```

2. **Verify migration ran:**
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TaskHistory';
   ```

3. **Check backend logs** for any errors during task updates

### Permission Issues

- Users can only view history for tasks assigned to them
- 403 error means insufficient permissions
- Admins and Managers can view all task history

## Security & Privacy

- History requires authentication (JWT token)
- Role-based access control applied
- Notes content not stored in history (only update event recorded)
- All changes attributed to specific users
- Cannot modify or delete history entries (append-only)

## Code Files Modified/Added

### Backend
- `database/schema.sql` - Added TaskHistory table
- `database/migration_add_history.sql` - Migration script (NEW)
- `backend/src/controllers/taskController.js` - Added history logging
- `backend/src/routes/taskRoutes.js` - Added history endpoint

### Frontend
- `frontend/src/services/taskService.ts` - Added TaskHistory interface and service
- `frontend/src/pages/TaskView.tsx` - New page component
- `frontend/src/components/TaskCard.tsx` - Made clickable
- `frontend/src/App.tsx` - Added TaskView route

### Documentation
- `README.md` - Updated features and API docs
- `TASK_HISTORY_FEATURE.md` - This comprehensive guide (NEW)

---

**Version:** 1.0  
**Last Updated:** November 5, 2025  
**Author:** Task Management System Development Team
