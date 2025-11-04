Perfect — here’s the **fully updated master prompt** for an AI agent or developer team to **build a professional Task Management Web Application (Web App)**.
It includes everything from the previous version **plus full role-based user management** (Admin, Manager, Regular User), integrated into both the **backend and frontend** logic.

---

# 🧠 **Prompt: Build a Role-Based Task Management Web Application (Full-Stack Web App)**

## 🎯 **Objective**

Design and develop a **responsive, secure, and professional Task Management Web Application** that supports **role-based user access**, enabling different levels of task visibility, creation, and control.
The app must follow **modern UI/UX standards** and maintain **clarity, responsiveness, and usability**.

---

## ⚙️ **Technical Stack**

| Layer                | Technology                           | Purpose                                      |
| -------------------- | ------------------------------------ | -------------------------------------------- |
| **Frontend**         | **React (TypeScript)**               | Component-based UI                           |
| **State Management** | **Zustand**                          | Lightweight and easy-to-manage global state  |
| **Styling**          | **Tailwind CSS**                     | Consistent, responsive styling               |
| **Backend**          | **Express (Node.js)**                | RESTful API server                           |
| **Database**         | **Microsoft SQL Server**             | Persistent task and user storage             |
| **Authentication**   | **JWT (JSON Web Token)**             | Secure authentication and session management |
| **Authorization**    | **Role-Based Access Control (RBAC)** | Defines user permissions by role             |
| **API Design**       | **RESTful**                          | Clean and consistent route structure         |
| **Testing**          | *Not implemented yet*                | (To be added in future iterations)           |

---

## 🧱 **Core Functional Modules**

### 1. **Authentication & Role-Based User Management**

#### Roles:

* **Admin:**

  * Full control over all users and tasks.
  * Can create, edit, or delete users and assign roles.
  * Can view all tasks across the organization.

* **Manager:**

  * Can create and assign tasks to users within their team.
  * Can view and edit tasks of team members.
  * Cannot delete other managers or admins.

* **User (Employee):**

  * Can view tasks assigned to them.
  * Can update their task status or add notes/comments.
  * Cannot view or edit others’ tasks.

#### Features:

* JWT-based authentication (login, register, logout).
* Role assignment at user creation (Admin assigns roles).
* Protected routes based on role level.
* Frontend conditional rendering based on user role.

---

### 2. **Task Management**

* CRUD operations for tasks (Create, Read, Update, Delete).

* Each task includes:

  * **Title** (required)
  * **Description**
  * **Priority** (High / Medium / Low)
  * **Assigned To** (user or multiple users)
  * **Assignment Date** (default: today)
  * **Due Date**
  * **Status** (Not Started / In Progress / Completed / Blocked)
  * **Tags / Category**
  * **Sub-tasks / Checklist**
  * **Notes / Comments**

* Permission rules:

  * Admins can manage all tasks.
  * Managers can manage tasks assigned to their teams.
  * Users can only edit tasks assigned to themselves.

---

### 3. **Dashboard / List View**

* **Table / Card layout** of all visible tasks (depending on role).
* Sort and filter by:

  * Priority
  * Due Date
  * Status
  * Assigned User
* Highlight overdue tasks with red text or icons.
* Quick actions: Edit, Mark Complete, Delete.

---

### 4. **Task Detail / Edit View**

* Access via modal or dedicated page.
* Editable fields per permissions.
* Inline validation (required fields, date constraints).
* “Save” and “Cancel” actions with confirmation feedback.

---

### 5. **Summary / Reporting Dashboard**

* KPIs:

  * Total tasks
  * Completed
  * Overdue
  * Pending
* Role-based data:

  * Admin: Organization-wide summary
  * Manager: Team summary
  * User: Personal summary
* Visual charts (optional): tasks by status, tasks by assignee.

---

### 6. **Notifications (Optional)**

* Toasts for success/error feedback.
* Optional email or UI reminders for upcoming deadlines.

---

## 🎨 **UI / UX Specifications**

### 1. **Color Palette**

| Element       | Color         | Code      |
| ------------- | ------------- | --------- |
| Primary       | Deep Navy     | `#002B5B` |
| Accent        | Teal          | `#1A936F` |
| High Priority | Red / Orange  | `#F05454` |
| Success       | Green         | `#3BB273` |
| Background    | Light Grey    | `#F4F4F4` |
| Text          | Dark Charcoal | `#222222` |

Maintain WCAG AA+ contrast standards.

---

### 2. **Layout & Typography**

* Font: **Inter** or **Roboto**, 14–16px base, 1.6 line-height.
* Use **8px spacing grid**.
* **Responsive 12-column grid layout** via Tailwind CSS.
* Rounded corners (4px) for cards, modals, buttons.
* Clear visual hierarchy for headings, subheadings, and labels.

---

### 3. **Core Components**

#### **Header / Navbar**

* Left: Logo
* Center: Breadcrumb or Page Title
* Right: User Avatar, Role Indicator, “Add Task” button
* Sticky with shadow for clarity

#### **Sidebar / Filters**

* Filters:

  * Priority (checkboxes)
  * Status (dropdown)
  * Due Date Range (date picker)
  * Assigned To (if user has permissions)
* Collapsible on mobile view.

#### **Task Cards / Table Rows**

* Show key details: Title, Priority badge, Status chip, Assignee avatar, Due date.
* Color-coded priorities (red/orange/yellow/green).
* Hover actions for quick edit/delete.

#### **Task Modal**

* Sections:

  1. **Basic Info:** Title, Description
  2. **Assignment:** Assignee(s), Priority, Tags
  3. **Dates:** Assignment and Due Date
  4. **Advanced:** Subtasks, Notes
* Role-based visibility (only Admin/Manager see “Assign To”).
* “Save” and “Cancel” buttons fixed at bottom.

#### **Dashboard KPIs**

* 4 summary cards (Total, In Progress, Completed, Overdue).
* Bar/Donut chart for visual clarity (optional).

---

## 🧭 **UX Principles**

* **Simplicity:** Focus on clarity and ease of task creation.
* **Consistency:** Uniform component styling and layout.
* **Accessibility:** Keyboard navigation, ARIA labels, and color contrast.
* **Responsiveness:** Mobile-first adaptive design.
* **Feedback:** Toasts for actions, inline error validation.
* **Progressive Disclosure:** Advanced fields hidden under “More Options.”
* **Security:** Users only see data allowed by their role.

---

## 🧩 **API Design (RESTful)**

**Base URL:** `/api/v1`

| Method     | Endpoint         | Description                                    | Access                                     |
| ---------- | ---------------- | ---------------------------------------------- | ------------------------------------------ |
| **POST**   | `/auth/register` | Register new user (Admin only can assign role) | Admin                                      |
| **POST**   | `/auth/login`    | User login                                     | Public                                     |
| **GET**    | `/users`         | Get list of users                              | Admin, Manager                             |
| **PUT**    | `/users/:id`     | Update user info or role                       | Admin                                      |
| **DELETE** | `/users/:id`     | Delete user                                    | Admin                                      |
| **GET**    | `/tasks`         | Fetch tasks (filter by role)                   | All                                        |
| **GET**    | `/tasks/:id`     | Fetch specific task                            | All (per permission)                       |
| **POST**   | `/tasks`         | Create new task                                | Admin, Manager                             |
| **PUT**    | `/tasks/:id`     | Edit existing task                             | Admin, Manager, Assigned User              |
| **DELETE** | `/tasks/:id`     | Delete task                                    | Admin, Manager (if assigned to their team) |
| **GET**    | `/tasks/summary` | Fetch summary data                             | All (per role)                             |

**JWT Middleware:**

* Validates tokens on protected routes.
* Extracts role and enforces access control logic in middleware.

---

## 🗄️ **Database Schema (Microsoft SQL Server)**

**Users Table**

| Field         | Type                             | Notes             |
| ------------- | -------------------------------- | ----------------- |
| id            | INT (PK, auto)                   | Unique identifier |
| name          | VARCHAR(100)                     |                   |
| email         | VARCHAR(255)                     | Unique            |
| password_hash | VARCHAR(255)                     | Hashed            |
| role          | ENUM('admin', 'manager', 'user') | Default: user     |
| created_at    | DATETIME                         |                   |

**Tasks Table**

| Field           | Type                                                    | Notes           |
| --------------- | ------------------------------------------------------- | --------------- |
| id              | INT (PK)                                                |                 |
| title           | VARCHAR(255)                                            |                 |
| description     | TEXT                                                    |                 |
| priority        | ENUM('high','medium','low')                             |                 |
| assigned_to     | INT (FK: Users.id)                                      |                 |
| created_by      | INT (FK: Users.id)                                      |                 |
| assignment_date | DATE                                                    | Default: now()  |
| due_date        | DATE                                                    |                 |
| status          | ENUM('not_started','in_progress','completed','blocked') |                 |
| tags            | VARCHAR(255)                                            | Comma-separated |
| notes           | TEXT                                                    |                 |

**Subtasks Table**

| Field   | Type                            | Notes |
| ------- | ------------------------------- | ----- |
| id      | INT (PK)                        |       |
| task_id | INT (FK: Tasks.id)              |       |
| title   | VARCHAR(255)                    |       |
| status  | ENUM('not_started','completed') |       |

---

## 💻 **Frontend File Structure (Recommended)**

```
src/
 ├─ components/
 │   ├─ Header.tsx
 │   ├─ Sidebar.tsx
 │   ├─ TaskCard.tsx
 │   ├─ TaskModal.tsx
 │   ├─ DashboardCards.tsx
 │   └─ Toast.tsx
 ├─ pages/
 │   ├─ Dashboard.tsx
 │   ├─ Login.tsx
 │   ├─ Register.tsx
 │   ├─ UserManagement.tsx
 ├─ store/
 │   ├─ authStore.ts
 │   └─ taskStore.ts
 ├─ services/
 │   ├─ api.ts (Axios instance)
 │   └─ taskService.ts
 ├─ utils/
 │   └─ roleUtils.ts
 ├─ App.tsx
 ├─ main.tsx
 └─ index.css
```

---

## 🧩 **Wireframe Layouts**

### **Dashboard (Desktop)**

```
+--------------------------------------------------------------+
| Header: [Logo]        Dashboard              [User][Logout]  |
+--------------------------------------------------------------+
| Sidebar (Filters) |        Task List / Cards Area            |
|-------------------|------------------------------------------|
| Priority Filter   | [TaskCard: Title, Assignee, Due, Status] |
| Status Filter     | [TaskCard: Title, Priority, Due Date]    |
| Date Range        | ...                                      |
+--------------------------------------------------------------+
| Footer                                                ©2025  |
+--------------------------------------------------------------+
```

### **User Management (Admin Only)**

```
+--------------------------------------------------------------+
| [Add User] [Search]                                          |
+--------------------------------------------------------------+
| Name   | Email          | Role     | Actions (Edit/Delete)   |
|--------|----------------|----------|--------------------------|
| John D | john@corp.com  | Manager  | [Edit] [Delete]          |
| Anna S | anna@corp.com  | User     | [Edit] [Delete]          |
+--------------------------------------------------------------+
```

---

## ✅ **Acceptance Criteria**

* Users can log in, and JWT is verified on each API call.
* Role-based permissions enforced in both backend routes and frontend UI.
* CRUD operations on tasks and users function as specified.
* UI is responsive, professional, and accessible.
* Zustand stores maintain session and state.
* No testing functionality included yet.
* Tailwind CSS follows specified color scheme and spacing rules.

---

Would you like me to now generate **React + Tailwind component blueprints (JSX + UI structure)** for the **Dashboard**, **Task Modal**, and **User Management** screens so the agent can begin building directly?
