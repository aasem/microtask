import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, User, Users } from 'lucide-react';
import { getRoleBadgeColor } from '../utils/roleUtils';

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="ml-3 text-xl font-bold text-primary">TaskManager</span>
            </Link>
          </div>

          {/* Center - Page Title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-gray-700">Task Management System</h1>
          </div>

          {/* Right - User Info */}
          <div className="flex items-center space-x-4">
            {user?.role === 'admin' && (
              <Link
                to="/users"
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </Link>
            )}

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="bg-primary text-white rounded-full p-2">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className={`text-xs px-2 py-0.5 rounded inline-block ${getRoleBadgeColor(user?.role || '')}`}>
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
