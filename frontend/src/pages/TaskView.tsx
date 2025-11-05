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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Back Button and Quick Actions */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-primary hover:text-accent transition-colors gap-2 py-2 px-4 rounded-lg bg-white shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center gap-2">
          {/* Could add action buttons here like edit, share, etc */}
        </div>
      </div>

      {/* Task Header with Status Banner */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className={`h-2 ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
        
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Title and status indicator */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`status-dot ${task.status === 'completed' ? 'status-completed' : task.status === 'in_progress' ? 'status-in-progress' : task.status === 'blocked' ? 'status-blocked' : 'status-not-started'}`}></span>
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              </div>
              
              {/* Badges for priority and status */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`badge ${getPriorityColor(task.priority)}`}>
                  {task.priority.toUpperCase()}
                </span>
                <span className={`badge ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                
                {task.tags && task.tags.map((tag) => (
                  <span key={tag.id} className="badge bg-gray-100 text-gray-700 border border-gray-200">
                    {tag.name}
                  </span>
                ))}
              </div>
              
              {/* Quick info */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                {task.assigned_to_name && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-accent" />
                    <span>Assigned to {task.assigned_to_name}</span>
                  </div>
                )}
                
                {task.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>Due {format(new Date(task.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-4 font-medium text-sm transition-colors relative ${activeTab === 'details' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Task Details
              {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 font-medium text-sm transition-colors relative flex items-center gap-1.5 ${activeTab === 'history' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <HistoryIcon className="w-4 h-4" />
              History
              {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
              <span className="ml-1.5 bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">{history.length}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="space-y-8">
              {/* Description Panel */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  Description
                </h3>
                {task.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided</p>
                )}
              </div>

              {/* Two column layout for task details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Task Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Task Details Card */}
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Task Information</h3>
                    </div>
                    <div className="p-4">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Assigned To */}
                        <div className="flex flex-col">
                          <dt className="text-xs font-medium text-gray-500 mb-1">Assigned To</dt>
                          <dd className="text-sm text-gray-700 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-accent" />
                            {task.assigned_to_name || 'Unassigned'}
                          </dd>
                        </div>

                        {/* Created By */}
                        <div className="flex flex-col">
                          <dt className="text-xs font-medium text-gray-500 mb-1">Created By</dt>
                          <dd className="text-sm text-gray-700 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-accent" />
                            {task.created_by_name || 'Unknown'}
                          </dd>
                        </div>

                        {/* Assignment Date */}
                        <div className="flex flex-col">
                          <dt className="text-xs font-medium text-gray-500 mb-1">Assignment Date</dt>
                          <dd className="text-sm text-gray-700 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-accent" />
                            {format(new Date(task.assignment_date), 'MMM dd, yyyy')}
                          </dd>
                        </div>

                        {/* Due Date */}
                        {task.due_date && (
                          <div className="flex flex-col">
                            <dt className="text-xs font-medium text-gray-500 mb-1">Due Date</dt>
                            <dd className="text-sm text-gray-700 flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-accent" />
                              {format(new Date(task.due_date), 'MMM dd, yyyy')}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                  
                  {/* Notes Section */}
                  {task.notes && (
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accent" />
                          Notes
                        </h3>
                      </div>
                      <div className="p-4 bg-gray-50">
                        <p className="text-gray-700 whitespace-pre-wrap">{task.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column - Subtasks */}
                <div className="space-y-6">
                  {/* Subtasks Card */}
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        Subtasks
                      </h3>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded-full">
                          {task.subtasks.filter(s => s.status === 'completed').length}/{task.subtasks.length} completed
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <ul className="space-y-2">
                          {task.subtasks.map((subtask, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              <div className={`p-0.5 rounded-full ${subtask.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}>
                                <CheckCircle2
                                  className={`w-4 h-4 ${subtask.status === 'completed' ? 'text-white' : 'text-gray-400'}`}
                                />
                              </div>
                              <span
                                className={
                                  subtask.status === 'completed'
                                    ? 'line-through text-gray-500'
                                    : 'text-gray-700'
                                }
                              >
                                {subtask.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-center italic py-2">No subtasks</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Tags Card */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-accent" />
                          Tags
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {task.tags.map((tag) => (
                            <span key={tag.id} className="badge bg-gray-100 text-gray-700 border border-gray-200">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // History Timeline
            <div>
              {history.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <HistoryIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No history available for this task</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {history.map((item) => (
                      <div key={item.id} className="relative flex gap-4">
                        {/* Timeline Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-md">
                          {getChangeTypeIcon(item.change_type)}
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1 bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-primary">
                              {formatChangeType(item.change_type)}
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>

                          <p className="text-gray-700 mb-2">{item.change_description}</p>

                          {item.changed_by_name && (
                            <p className="text-xs text-gray-500 flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span className="font-medium">{item.changed_by_name}</span>
                            </p>
                          )}

                          {/* Show old/new values if available */}
                          {item.old_value && item.new_value && (
                            <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                    Previous
                                  </p>
                                  <p className="text-gray-700 font-mono text-xs bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                                    {item.old_value}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                    Updated
                                  </p>
                                  <p className="text-gray-700 font-mono text-xs bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
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
