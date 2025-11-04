# Task Management System

A comprehensive, role-based task management web application built with React, Express, and Microsoft SQL Server.

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
- **Microsoft SQL Server** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Microsoft SQL Server** (2016 or higher)
- **SQL Server Management Studio** (optional, for database management)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
cd TaskTodoApp
```

### 2. Database Setup

#### Create Database

1. Open SQL Server Management Studio or use sqlcmd
2. Run the schema creation script:

```bash
sqlcmd -S localhost -d master -i database/schema.sql
```

#### Seed Sample Data (Optional)

```bash
sqlcmd -S localhost -d TaskManagementDB -i database/seed.sql
```

**Default Users:**
- Admin: `admin@company.com` / `password123`
- Manager: `manager1@company.com` / `password123`
- User: `john@company.com` / `password123`

### 3. Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
PORT=5000
NODE_ENV=development

DB_SERVER=localhost
DB_NAME=TaskManagementDB
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=your_secure_random_secret_key_here
JWT_EXPIRES_IN=24h
```

#### Start Backend Server

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 4. Frontend Setup

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
│   └── seed.sql
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
- `POST /api/v1/tasks` - Create task (Admin, Manager)
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task (Admin, Manager)
- `GET /api/v1/tasks/summary` - Get task summary statistics

## 🎨 Color Scheme

| Element       | Color       | Hex       |
| ------------- | ----------- | --------- |
| Primary       | Deep Navy   | `#002B5B` |
| Accent        | Teal        | `#1A936F` |
| High Priority | Red/Orange  | `#F05454` |
| Success       | Green       | `#3BB273` |
| Background    | Light Grey  | `#F4F4F4` |
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

### Database Connection Issues
- Verify SQL Server is running
- Check credentials in `.env` file
- Ensure SQL Server is configured to allow TCP/IP connections
- Check firewall settings

### Frontend Not Connecting to Backend
- Ensure backend is running on port 5000
- Check CORS configuration in `backend/src/server.js`
- Verify proxy settings in `frontend/vite.config.ts`

### Authentication Issues
- Check JWT_SECRET in `.env`
- Clear browser localStorage and retry login
- Verify token expiration settings

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the project repository.
