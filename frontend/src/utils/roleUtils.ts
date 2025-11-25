export const canCreateTask = (role: string): boolean => {
  return role === 'admin' || role === 'manager';
};

export const canDeleteTask = (role: string): boolean => {
  return role === 'admin' || role === 'manager';
};

export const canAssignTasks = (role: string): boolean => {
  return role === 'admin' || role === 'manager';
};

export const canManageUsers = (role: string): boolean => {
  return role === 'admin';
};

export const canEditTask = (role: string, taskAssignedTo: number, userId: number): boolean => {
  if (role === 'admin' || role === 'manager') {
    return true;
  }
  return taskAssignedTo === userId;
};

export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'user':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-success text-white';
    case 'in_progress':
      return 'bg-blue-500 text-white';
    case 'suspended':
      return 'bg-danger text-white';
    case 'not_started':
      return 'bg-gray-400 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};
