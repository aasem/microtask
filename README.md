# Task Management System

A comprehensive, role-based task management web application built with React, Express, and SQLite3.

## 🎯 Features

- **Role-Based Access Control (RBAC)**

  - Admin: Full control over users and tasks
  - Manager: Can create and manage tasks, view team members
  - User: Can view and update assigned tasks

- **Task Management**

  - Create, read, update, and delete tasks
  - Set priorities (High, Medium, Low)
  - Track status (Not Started, In Progress, Completed, Blocked)
  - Add due dates and tags
  - Create subtasks
  - Add notes and comments
  - **Task History Tracking**: View complete timeline of all changes made to a task
    - Status changes
    - Assignment changes
    - Tag modifications
    - Due date updates
    - New subtasks added
    - Notes updates

- **Dashboard & Analytics**

  - Real-time task summary (Total, In Progress, Completed, Overdue)
  - Filter tasks by priority, status, and due date
  - Visual task cards with overdue indicators

- **User Management** (Admin only)
  - Create and manage users
  - Assign roles
  - Update user information

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **date-fns** for date formatting

### Backend

- **Express.js** (Node.js)
- **SQLite3** (via sql.js) for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

## 🚀 Quick Start

1. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file** in `backend` directory with:

   ```env
   PORT=5000
   JWT_SECRET=your_secure_random_secret_key_here
   JWT_EXPIRES_IN=24h
   ```

3. **Seed the database:**

   ```bash
   npm run seed
   ```

4. **Start backend server:**

   ```bash
   npm run dev
   ```

5. **In a new terminal, install frontend dependencies:**

   ```bash
   cd frontend
   npm install
   ```

6. **Start frontend server:**

   ```bash
   npm run dev
   ```

7. **Open your browser** and navigate to `http://localhost:3000`

**Login credentials:**

- Admin: `admin@example.com` / `password123`
- Manager: `manager@example.com` / `password123`
- User: `user@example.com` / `password123`

## 🚀 Getting Started (Detailed)

### 1. Clone the Repository

```bash
cd TaskTodoApp
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development

# Optional: Custom database path (defaults to database/taskmanagement.db)
# DB_PATH=./database/taskmanagement.db

JWT_SECRET=your_secure_random_secret_key_here
JWT_EXPIRES_IN=24h
```

**Note:** The database schema is automatically created on first run. The database file will be created at `database/taskmanagement.db` (or the path specified in `DB_PATH`).

#### Seed Sample Data

After installing dependencies, seed the database with sample users:

```bash
npm run seed
```

**Default Users:**

- Admin: `admin@example.com` / `password123`
- Manager: `manager@example.com` / `password123`
- User: `user@example.com` / `password123`

**Note:** The seed script will skip if users already exist. To re-seed, delete the database file (`database/taskmanagement.db`) and run the seed command again.

#### Start Backend Server

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
TaskTodoApp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   └── taskController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── taskRoutes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskModal.tsx
│   │   │   ├── DashboardCards.tsx
│   │   │   └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── taskService.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   └── taskStore.ts
│   │   ├── utils/
│   │   │   └── roleUtils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── taskmanagement.db (created automatically)
└── README.md
```

## 🔐 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user (Admin only)
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Users

- `GET /api/v1/users` - Get all users (Admin, Manager)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user (Admin)
- `DELETE /api/v1/users/:id` - Delete user (Admin)

### Tasks

- `GET /api/v1/tasks` - Get all tasks (filtered by role)
- `GET /api/v1/tasks/:id` - Get task by ID
- `GET /api/v1/tasks/:id/history` - Get task history timeline
- `POST /api/v1/tasks` - Create task (Admin, Manager)
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task (Admin, Manager)
- `GET /api/v1/tasks/summary` - Get task summary statistics

## 🎨 Color Scheme

| Element       | Color         | Hex       |
| ------------- | ------------- | --------- |
| Primary       | Deep Navy     | `#002B5B` |
| Accent        | Teal          | `#1A936F` |
| High Priority | Red/Orange    | `#F05454` |
| Success       | Green         | `#3BB273` |
| Background    | Light Grey    | `#F4F4F4` |
| Text          | Dark Charcoal | `#222222` |

## 👥 User Roles & Permissions

### Admin

- ✅ Full access to all features
- ✅ Create, edit, delete users
- ✅ Assign roles
- ✅ View all tasks
- ✅ Create, edit, delete any task

### Manager

- ✅ View all tasks
- ✅ Create and assign tasks
- ✅ Edit tasks assigned to their team
- ✅ View user list
- ❌ Cannot manage users or other managers

### User (Employee)

- ✅ View tasks assigned to them
- ✅ Update status and notes on their tasks
- ❌ Cannot view others' tasks
- ❌ Cannot create or delete tasks

## 📝 Development

### Build for Production

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## 🐛 Troubleshooting

### Database Issues

- Ensure the `database` directory exists and is writable
- If you encounter database errors, try deleting `database/taskmanagement.db` and restarting the server (schema will be recreated automatically)
- Check that the `DB_PATH` environment variable (if set) points to a valid location

### Seeding Issues

- If seed fails, ensure the backend dependencies are installed (`npm install` in the `backend` directory)
- The seed script will skip if users already exist - delete the database file to re-seed
- Verify the database file is not locked by another process

### Frontend Not Connecting to Backend

- Ensure backend is running on port 5000
- Check CORS configuration in `backend/src/server.js`
- Verify proxy settings in `frontend/vite.config.ts`

### Authentication Issues

- Check JWT_SECRET in `.env` file
- Clear browser localStorage and retry login
- Verify token expiration settings

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the project repository.
