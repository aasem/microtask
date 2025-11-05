import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Task } from '../services/taskService';
import { getPriorityColor, getStatusColor } from '../utils/roleUtils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const TaskCard = ({ task, onEdit, onDelete, canEdit, canDelete }: TaskCardProps) => {
  const navigate = useNavigate();
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div 
      className={`card hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? 'border-l-4 border-danger' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
            {isOverdue && (
              <span title="Overdue">
                <AlertCircle className="w-5 h-5 text-danger" />
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex space-x-2 ml-4">
          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-accent hover:bg-accent hover:bg-opacity-10 rounded"
              title="Edit task"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-danger hover:bg-danger hover:bg-opacity-10 rounded"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`badge ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <span className={`badge ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        {task.tags && task.tags.split(',').map((tag, index) => (
          <span key={index} className="badge bg-gray-200 text-gray-700">
            {tag.trim()}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          {task.assigned_to_name && (
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{task.assigned_to_name}</span>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span className={isOverdue ? 'text-danger font-semibold' : ''}>
                {format(new Date(task.due_date), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
