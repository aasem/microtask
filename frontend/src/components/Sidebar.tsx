import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface SidebarProps {
  filters: {
    priority: string[];
    status: string;
    dueDateRange: { start: string; end: string };
  };
  onFilterChange: (filters: any) => void;
}

const Sidebar = ({ filters, onFilterChange }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handlePriorityChange = (priority: string) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    onFilterChange({ ...filters, priority: newPriorities });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    onFilterChange({
      ...filters,
      dueDateRange: { ...filters.dueDateRange, [field]: value }
    });
  };

  const clearFilters = () => {
    onFilterChange({
      priority: [],
      status: '',
      dueDateRange: { start: '', end: '' }
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${isOpen ? 'w-64' : 'w-12'} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6">
          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="space-y-2">
              {['high', 'medium', 'low'].map((priority) => (
                <label key={priority} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(priority)}
                    onChange={() => handlePriorityChange(priority)}
                    className="rounded text-accent focus:ring-accent mr-2"
                  />
                  <span className="text-sm capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="w-full text-sm"
            >
              <option value="">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Due Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.dueDateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={filters.dueDateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full text-sm"
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="w-full btn-secondary text-sm"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
