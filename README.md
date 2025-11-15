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

1. **Install all dependencies** (root, backend, and frontend):

   ```bash
   npm run install:all
   ```

   Or install them separately:
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
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

4. **Start both frontend and backend** with a single command:

   ```bash
   npm run dev
   ```

   This will run both the backend server (on `http://localhost:5000`) and frontend dev server (on `http://localhost:3000`) simultaneously.

5. **Open your browser** and navigate to `http://localhost:3000`

**Login credentials:**

- Admin: `admin` / `password123`
- Manager: `manager` / `password123`
- User: `user` / `password123`

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

- Admin: `admin` / `password123`
- Manager: `manager` / `password123`
- User: `user` / `password123`

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

You can either start both servers together (recommended):

```bash
# From the root directory
npm run dev
```

Or start them separately:

```bash
# From frontend directory
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

### Development Mode

Start both frontend and backend in development mode:

```bash
# From root directory
npm run dev
```

### Build for Production

#### Backend

```bash
# From root directory
npm run start:backend
# Or from backend directory
cd backend && npm start
```

#### Frontend

```bash
# From root directory
npm run build
npm run start:frontend
# Or from frontend directory
cd frontend && npm run build && npm run preview
```

## 🚀 Deployment

### Frontend Configuration for Deployment

The frontend uses environment variables to configure the API base URL. This is essential when deploying to a different environment (like GCP).

#### For Local Development
When running locally with `npm run dev`, the frontend uses a relative path `/api/v1` which is proxied by Vite to `http://localhost:5000`.

#### For Deployment (GCP, Production, etc.)

1. **Create a `.env` file** in the `frontend` directory:

   ```env
   # For local backend at port 5000
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   
   # Or for a deployed backend (e.g., GCP Cloud Run)
   # VITE_API_BASE_URL=https://your-backend-service.run.app/api/v1
   ```

2. **Build the frontend** with the environment variable:

   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy the built files** from `frontend/dist/` to your hosting service (GCP, Vercel, etc.)

**Important Notes:**
- Environment variables must be prefixed with `VITE_` to be exposed to the client
- The `.env` file must be created **before** building the frontend
- Once built, the environment variables are embedded in the JavaScript bundle
- For CORS to work, ensure your backend allows requests from your frontend's origin

#### Example: Deploying to GCP with Backend on Public IP:3002

If your frontend will be served on GCP at port 3001 and your backend runs on GCP at a public IP on port 3002:

1. **Backend configuration** (`backend/.env`):
   ```env
   PORT=3002
   JWT_SECRET=your_secure_random_secret_key_here
   JWT_EXPIRES_IN=24h
   ```

2. **Frontend configuration** (`frontend/.env`):
   ```env
   # Replace YOUR_PUBLIC_IP with your actual GCP instance's public IP
   VITE_API_BASE_URL=http://YOUR_PUBLIC_IP:3002/api/v1
   
   # Example:
   # VITE_API_BASE_URL=http://34.123.45.67:3002/api/v1
   ```

3. **Build and deploy:**
   ```bash
   # Build frontend with the correct API URL
   cd frontend
   npm run build
   
   # Deploy the built files from frontend/dist/ to your hosting service
   ```

**Important for GCP Deployment:**
- Ensure your GCP firewall rules allow inbound traffic on ports 3001 (frontend) and 3002 (backend)
- The backend server listens on all interfaces (0.0.0.0), so it will accept connections from the public IP
- For HTTPS, you'll want to configure a reverse proxy (like nginx) or use a load balancer

#### Quick GCP Deployment Checklist

1. ✅ **Backend Setup:**
   - Set `PORT=3002` in `backend/.env`
   - Ensure database is accessible on the GCP instance
   - Run backend: `cd backend && npm start` or `npm run dev`
   - Backend will be accessible at `http://YOUR_PUBLIC_IP:3002`

2. ✅ **Frontend Setup:**
   - Create `frontend/.env` with: `VITE_API_BASE_URL=http://YOUR_PUBLIC_IP:3002/api/v1`
   - Build frontend: `cd frontend && npm run build`
   - Deploy `frontend/dist/` to your hosting service (e.g., serve on port 3001)

3. ✅ **GCP Firewall:**
   - Allow inbound TCP traffic on port 3001 (frontend)
   - Allow inbound TCP traffic on port 3002 (backend)

4. ✅ **Test:**
   - Access frontend: `http://YOUR_PUBLIC_IP:3001`
   - Frontend should connect to backend at `http://YOUR_PUBLIC_IP:3002/api/v1`

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
