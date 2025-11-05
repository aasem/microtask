# Tag Multi-Select Feature Implementation

## Overview
Implemented a comprehensive tag management system with multi-select dropdown functionality and the ability to add new tags on-the-fly. Tags are now stored in a dedicated database table with proper many-to-many relationships.

## Database Changes

### New Tables Created
1. **Tags Table** - Stores unique tag names
   - `id` (INT, Primary Key)
   - `name` (VARCHAR(50), Unique)
   - `created_at` (DATETIME)

2. **TaskTags Junction Table** - Many-to-many relationship between tasks and tags
   - `id` (INT, Primary Key)
   - `task_id` (INT, Foreign Key → Tasks)
   - `tag_id` (INT, Foreign Key → Tags)
   - `created_at` (DATETIME)
   - Unique constraint on (task_id, tag_id)

### Migration File
- **File**: `database/migration_add_tags_table.sql`
- **Features**:
  - Creates Tags and TaskTags tables
  - Migrates existing comma-separated tags from Tasks.tags column to new structure
  - Adds appropriate indexes for performance

### To Apply Migration
Run the migration SQL file against your database:
```sql
-- Execute in SQL Server Management Studio or via command line
sqlcmd -S your_server -d TaskManagementDB -i database/migration_add_tags_table.sql
```

## Backend Changes

### New Files
1. **`backend/src/controllers/tagController.js`**
   - `getAllTags()` - Fetch all available tags
   - `createTag(name)` - Create a new tag (returns existing if duplicate)
   - `deleteTag(id)` - Delete a tag (admin only)

2. **`backend/src/routes/tagRoutes.js`**
   - `GET /api/v1/tags` - Get all tags
   - `POST /api/v1/tags` - Create new tag
   - `DELETE /api/v1/tags/:id` - Delete tag (admin only)

### Modified Files
1. **`backend/src/server.js`**
   - Added tag routes to server

2. **`backend/src/controllers/taskController.js`**
   - Updated `getAllTasks()` to fetch tags from Tags table
   - Updated `getTaskById()` to fetch tags from Tags table
   - Updated `createTask()` to accept `tag_ids` array and create TaskTags associations
   - Updated `updateTask()` to accept `tag_ids` array and update TaskTags associations
   - Added proper history logging for tag changes

### API Changes
**Request Format Change:**
- **Before**: `tags: "urgent, backend, bug"` (comma-separated string)
- **After**: `tag_ids: [1, 3, 5]` (array of tag IDs)

**Response Format Change:**
- **Before**: `tags: "urgent, backend, bug"` (string)
- **After**: `tags: [{id: 1, name: "urgent"}, {id: 3, name: "backend"}]` (array of objects)

## Frontend Changes

### New Files
1. **`frontend/src/services/tagService.ts`**
   - Service for tag-related API calls
   - `getAllTags()`, `createTag()`, `deleteTag()`

2. **`frontend/src/components/TagMultiSelect.tsx`**
   - Multi-select dropdown component with search
   - Ability to create new tags inline
   - Visual tag badges with remove buttons
   - Click-outside to close dropdown
   - Keyboard support (Enter to create tag)

### Modified Files
1. **`frontend/src/services/taskService.ts`**
   - Updated `Task` interface: `tags?: Tag[]` (was `tags?: string`)
   - Added `Tag` interface

2. **`frontend/src/components/TaskModal.tsx`**
   - Replaced text input with `TagMultiSelect` component
   - Updated form data handling to work with tag objects
   - Converts tags to `tag_ids` array before sending to backend

3. **`frontend/src/components/TaskCard.tsx`**
   - Updated to display tags from array of objects

4. **`frontend/src/pages/TaskView.tsx`**
   - Updated to display tags from array of objects

## Features

### Tag Multi-Select Component
- **Search**: Type to filter existing tags
- **Create New**: Type a new tag name and press Enter or click "Create"
- **Multi-Select**: Click tags to add/remove from selection
- **Visual Feedback**: Selected tags shown as badges with remove buttons
- **Dropdown**: Shows all available tags with checkboxes
- **Duplicate Prevention**: Automatically selects existing tag if name matches

### Tag Management
- **Centralized Storage**: All tags stored in dedicated Tags table
- **Reusability**: Same tag can be used across multiple tasks
- **Validation**: Tag names limited to 50 characters
- **Case-Insensitive Search**: Easy to find existing tags
- **Admin Control**: Only admins can delete tags (optional feature)

## Usage Instructions

### For Users
1. **Creating/Editing a Task**:
   - Click in the Tags field
   - Type to search existing tags or enter a new tag name
   - Click on tags to select/deselect them
   - Press Enter or click "Create" to add a new tag
   - Selected tags appear as badges that can be removed by clicking the X

2. **Viewing Tasks**:
   - Tags appear as badges on task cards
   - Tags are displayed in the task detail view

### For Developers
1. **Run the database migration** first
2. **Restart the backend server** to load new routes
3. **Frontend changes** are automatically picked up by the dev server

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Backend server starts without errors
- [ ] Can fetch all tags via API
- [ ] Can create new tags via API
- [ ] Can create task with tags
- [ ] Can update task tags
- [ ] Tags display correctly on task cards
- [ ] Tags display correctly in task detail view
- [ ] Multi-select dropdown works properly
- [ ] Can create new tags from dropdown
- [ ] Duplicate tag names are handled correctly
- [ ] Tag history is logged properly

## Notes

- The old `tags` column in the Tasks table is preserved but no longer used
- You can optionally drop it after confirming the migration worked
- Tag names are trimmed of whitespace automatically
- Empty tag names are rejected
- The migration script is idempotent (safe to run multiple times)
