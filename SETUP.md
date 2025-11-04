# Quick Setup Guide

## Step-by-Step Installation

### 1. Database Setup (5 minutes)

#### Option A: Using SQL Server Management Studio (SSMS)
1. Open SSMS and connect to your SQL Server instance
2. Open and execute `database/schema.sql`
3. (Optional) Open and execute `database/seed.sql` for sample data

#### Option B: Using Command Line
```bash
# Create database and tables
sqlcmd -S localhost -d master -i database/schema.sql

# Add sample data (optional)
sqlcmd -S localhost -d TaskManagementDB -i database/seed.sql
```

### 2. Backend Setup (3 minutes)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
DB_SERVER=localhost
DB_NAME=TaskManagementDB
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
JWT_SECRET=generate_a_random_secret_key
```

**Generate a secure JWT secret:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Start the backend:
```bash
npm run dev
```

You should see: `✅ Connected to SQL Server` and `🚀 Server running on port 5000`

### 3. Frontend Setup (2 minutes)

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:3000`

### 4. Login (1 minute)

Use these test credentials:
- **Admin:** admin@company.com / password123
- **Manager:** manager1@company.com / password123
- **User:** john@company.com / password123

## Common Issues & Solutions

### Issue: "Cannot connect to SQL Server"
**Solution:** 
- Ensure SQL Server is running
- Enable TCP/IP in SQL Server Configuration Manager
- Restart SQL Server service
- Check firewall allows port 1433

### Issue: "Login failed for user"
**Solution:**
- Verify credentials in `.env` file
- Ensure SQL Server Authentication is enabled
- Check user has access to the database

### Issue: "Port 5000 already in use"
**Solution:**
- Change PORT in backend `.env` file
- Update proxy in frontend `vite.config.ts`

### Issue: Frontend shows CORS error
**Solution:**
- Ensure backend is running on port 5000
- Check CORS configuration in `backend/src/server.js`

## Database Connection Strings

### Windows Authentication
```env
DB_SERVER=localhost
DB_NAME=TaskManagementDB
DB_USER=
DB_PASSWORD=
```

### SQL Server Authentication
```env
DB_SERVER=localhost
DB_NAME=TaskManagementDB
DB_USER=sa
DB_PASSWORD=YourStrongPassword123
```

### Remote Server
```env
DB_SERVER=192.168.1.100,1433
DB_NAME=TaskManagementDB
DB_USER=taskuser
DB_PASSWORD=SecurePassword456
```

## Verification Checklist

After setup, verify:
- [ ] Database tables created (Users, Tasks, Subtasks)
- [ ] Backend server running (port 5000)
- [ ] Frontend dev server running (port 3000)
- [ ] Can login with demo credentials
- [ ] Dashboard shows summary cards
- [ ] Can create a new task (as Admin/Manager)
- [ ] Can filter tasks by priority/status
- [ ] User Management page accessible (as Admin)

## Next Steps

1. **Change default passwords** for all demo users
2. **Create your own admin account**
3. **Customize branding** (logo, colors) in `frontend/src/components/Header.tsx`
4. **Configure production database** credentials
5. **Set up SSL/HTTPS** for production deployment

## Production Deployment

### Backend (Node.js)
- Use `npm start` instead of `npm run dev`
- Set `NODE_ENV=production` in `.env`
- Use a process manager like PM2
- Set up reverse proxy with Nginx

### Frontend
```bash
cd frontend
npm run build
```
- Deploy `dist` folder to your web server
- Update API base URL for production

### Database
- Remove or secure sample data
- Create database backups
- Set up regular maintenance plans
- Configure connection pooling

## Support

If you encounter issues:
1. Check the main README.md for detailed documentation
2. Review error messages in browser console and terminal
3. Verify all prerequisites are installed
4. Ensure database is accessible and tables are created
