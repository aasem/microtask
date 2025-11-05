import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle2, 
  Clock, 
  FileText,
  History as HistoryIcon
} from 'lucide-react';
import { taskService, Task, TaskHistory } from '../services/taskService';
import { format } from 'date-fns';

const TaskView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    if (id) {
      fetchTaskData();
    }
  }, [id]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      const [taskData, historyData] = await Promise.all([
        taskService.getTaskById(Number(id)),
        taskService.getTaskHistory(Number(id))
      ]);
      setTask(taskData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch task data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'status_change':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'assignment_change':
        return <User className="w-4 h-4" />;
      case 'tags_change':
        return <Tag className="w-4 h-4" />;
      case 'due_date_change':
        return <Calendar className="w-4 h-4" />;
      case 'subtask_added':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'notes_updated':
        return <FileText className="w-4 h-4" />;
      case 'task_created':
        return <Clock className="w-4 h-4" />;
      default:
        return <HistoryIcon className="w-4 h-4" />;
    }
  };

  const formatChangeType = (changeType: string) => {
    return changeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002B5B]"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Task not found'}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-[#002B5B] hover:text-[#1A936F] transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Task Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#222222] mb-2">{task.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                {task.priority.toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'details'
                  ? 'border-[#002B5B] text-[#002B5B]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Task Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition ${
                activeTab === 'history'
                  ? 'border-[#002B5B] text-[#002B5B]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              History Timeline
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{task.description}</p>
                </div>
              )}

              {/* Task Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assigned To */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[#1A936F] mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Assigned To</p>
                    <p className="text-gray-600">{task.assigned_to_name || 'Unassigned'}</p>
                  </div>
                </div>

                {/* Created By */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[#1A936F] mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Created By</p>
                    <p className="text-gray-600">{task.created_by_name || 'Unknown'}</p>
                  </div>
                </div>

                {/* Assignment Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#1A936F] mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Assignment Date</p>
                    <p className="text-gray-600">
                      {format(new Date(task.assignment_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Due Date */}
                {task.due_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#1A936F] mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Due Date</p>
                      <p className="text-gray-600">
                        {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {task.tags && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-[#1A936F] mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Tags</p>
                      <p className="text-gray-600">{task.tags}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {task.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#1A936F]" />
                    Notes
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{task.notes}</p>
                </div>
              )}

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1A936F]" />
                    Subtasks
                  </h3>
                  <div className="space-y-2">
                    {task.subtasks.map((subtask, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${
                            subtask.status === 'completed'
                              ? 'text-green-500'
                              : 'text-gray-300'
                          }`}
                        />
                        <span
                          className={
                            subtask.status === 'completed'
                              ? 'line-through text-gray-500'
                              : 'text-gray-700'
                          }
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // History Timeline
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No history available</p>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {history.map((item) => (
                      <div key={item.id} className="relative flex gap-4">
                        {/* Timeline Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#002B5B] flex items-center justify-center text-white z-10">
                          {getChangeTypeIcon(item.change_type)}
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-[#002B5B]">
                              {formatChangeType(item.change_type)}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>

                          <p className="text-gray-700 mb-2">{item.change_description}</p>

                          {item.changed_by_name && (
                            <p className="text-sm text-gray-600">
                              by <span className="font-medium">{item.changed_by_name}</span>
                            </p>
                          )}

                          {/* Show old/new values if available */}
                          {item.old_value && item.new_value && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <p className="text-gray-500 text-xs mb-1">Previous</p>
                                  <p className="text-gray-700 font-mono bg-white px-2 py-1 rounded">
                                    {item.old_value}
                                  </p>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-500 text-xs mb-1">Updated</p>
                                  <p className="text-gray-700 font-mono bg-white px-2 py-1 rounded">
                                    {item.new_value}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskView;
