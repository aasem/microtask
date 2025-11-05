import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Edit, Trash2, AlertCircle, Clock } from 'lucide-react';
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

  // Status dot color
  const getStatusDotClass = (status: string) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'blocked': return 'status-blocked';
      default: return 'status-not-started';
    }
  };

  return (
    <div 
      className={`card shadow-card hover:border-gray-300 cursor-pointer ${isOverdue ? 'border-l-4 border-l-danger pl-4' : 'pl-5'}`}
      onClick={handleCardClick}
    >
      {/* Card Header - Title and Actions */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`status-dot ${getStatusDotClass(task.status)}`} />
            <h3 className="text-xl font-semibold text-gray-900 leading-tight">{task.title}</h3>
            {isOverdue && (
              <span title="Overdue" className="text-danger">
                <AlertCircle className="w-5 h-5" />
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              className="icon-wrapper icon-accent rounded-md"
              title="Edit task"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="icon-wrapper icon-danger rounded-md"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mt-1.5 mb-3 line-clamp-2">{task.description}</p>
      )}
      
      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
        {/* Assignment */}
        {task.assigned_to_name && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="truncate">{task.assigned_to_name}</span>
          </div>
        )}
        
        {/* Due Date */}
        {task.due_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className={isOverdue ? 'text-danger font-medium' : ''}>
              {format(new Date(task.due_date), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
        
        {/* Created By - if available */}
        {task.created_by_name && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="truncate">By {task.created_by_name}</span>
          </div>
        )}
      </div>

      {/* Tags and Priority */}
      <div className="flex flex-wrap gap-1.5 mt-3 items-center">
        <span className={`badge ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <span className={`badge ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        {task.tags && task.tags.map((tag) => (
          <span key={tag.id} className="badge bg-gray-100 text-gray-700 border border-gray-200">
            {tag.name}
          </span>
        ))}
      </div>
      
      {/* Subtasks Summary if any */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <span className="font-medium">{task.subtasks.filter(s => s.status === 'completed').length}/{task.subtasks.length}</span> subtasks completed
        </div>
      )}
    </div>
  );
};

export default TaskCard;
