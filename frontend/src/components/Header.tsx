import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LogOut, User, CheckSquare } from "lucide-react";
import { getRoleBadgeColor } from "../utils/roleUtils";

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="flex items-center group"
              aria-label="Go to dashboard"
            >
              <div className="bg-primary text-white p-2 rounded-lg shadow-sm group-hover:shadow group-hover:bg-opacity-90 transition-all duration-200">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-lg font-bold text-primary group-hover:text-accent transition-colors duration-200">
                  Task Management
                </span>
                <span className="text-xs text-gray-500 -mt-1">
                  A minimalistic task management application
                </span>
              </div>
            </Link>
          </div>

          {/* Right - User Info */}
          <div className="flex items-center gap-2">
            {/* Notification Bell - Visual Enhancement */}
            {/* <div className="relative">
              <button
                onClick={toggleNotifications}
                className="p-2 rounded-full text-gray-500 hover:text-accent hover:bg-gray-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-medium text-sm text-gray-700">
                      Notifications
                    </h3>
                  </div>
                  <div className="p-4 text-center text-sm text-gray-500">
                    <p>No new notifications</p>
                  </div>
                </div>
              )}
            </div> */}

            {user?.role === "admin" && (
              <Link
                to="/users"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                aria-label="Manage users"
              >
                <User  className="w-4 h-4" />
                <span className="hidden sm:inline">User Management</span>
              </Link>
            )}

            <div className="flex items-center pl-2">
              <div className="group relative">
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-full p-1.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden sm:block pr-1">
                    <p className="text-sm font-medium text-gray-700 text-left">
                      {user?.name}
                    </p>
                    <p
                      className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor(
                        user?.role || ""
                      )}`}
                    >
                      {user?.role}
                    </p>
                  </div>
                </button>

                {/* User dropdown - could expand in the future */}
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-800">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-danger flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="sm:hidden p-2 rounded-full text-gray-500 hover:text-danger hover:bg-gray-100 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active section indicator - adds a subtle visual cue */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-30"></div>
    </header>
  );
};

export default Header;
