import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  AlertCircle,
  Tag,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Tag as TagType } from "../services/tagService";

interface SidebarProps {
  filters: {
    priority: string[];
    status: string;
    dueDateRange: { start: string; end: string };
    tags: TagType[];
  };
  onFilterChange: (filters: any) => void;
  availableTags: TagType[];
}

const Sidebar = ({ filters, onFilterChange, availableTags }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasActiveFilters =
    filters.priority.length > 0 ||
    filters.status !== "" ||
    filters.dueDateRange.start ||
    filters.dueDateRange.end ||
    filters.tags.length > 0;

  const handlePriorityChange = (priority: string) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];
    onFilterChange({ ...filters, priority: newPriorities });
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({
      ...filters,
      status: filters.status === status ? "" : status,
    });
  };

  const handleDateChange = (field: "start" | "end", value: string) => {
    onFilterChange({
      ...filters,
      dueDateRange: { ...filters.dueDateRange, [field]: value },
    });
  };

  const handleTagChange = (tag: TagType) => {
    const isSelected = filters.tags.some((t) => t.id === tag.id);
    const newTags = isSelected
      ? filters.tags.filter((t) => t.id !== tag.id)
      : [...filters.tags, tag];
    onFilterChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFilterChange({
      priority: [],
      status: "",
      dueDateRange: { start: "", end: "" },
      tags: [],
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 border-red-200 bg-red-50";
      case "medium":
        return "text-yellow-600 border-yellow-200 bg-yellow-50";
      case "low":
        return "text-green-600 border-green-200 bg-green-50";
      default:
        return "text-gray-600 border-gray-200 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case "blocked":
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <div
      className={`bg-[#fbf7f2] rounded-lg border border-gray-100 shadow-sm transition-all duration-300 overflow-hidden ${
        isOpen ? "w-72" : "w-14"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary bg-opacity-10 rounded-full">
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                {(filters.priority.length > 0 ? 1 : 0) +
                  (filters.status ? 1 : 0) +
                  (filters.dueDateRange.start || filters.dueDateRange.end
                    ? 1
                    : 0) +
                  (filters.tags.length > 0 ? 1 : 0)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <div className="p-1.5 bg-primary bg-opacity-10 rounded-full">
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={isOpen ? "Collapse filters" : "Expand filters"}
        >
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Priority Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Tag className="w-3.5 h-3.5 text-accent" />
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {["high", "medium", "low"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                    filters.priority.includes(priority)
                      ? getPriorityColor(priority)
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      priority === "high"
                        ? "bg-red-500"
                        : priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  ></span>
                  <span className="capitalize">{priority}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Clock className="w-3.5 h-3.5 text-accent" />
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["not_started", "in_progress", "completed", "blocked"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-2 py-1.5 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      filters.status === status
                        ? "bg-primary bg-opacity-5 border-primary text-primary"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {getStatusIcon(status)}
                    <span>
                      {status === "not_started"
                        ? "Not Started"
                        : status === "in_progress"
                        ? "In Progress"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Due Date Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Due Date
            </label>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1.5">From</p>
                <input
                  type="date"
                  value={filters.dueDateRange.start}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">To</p>
                <input
                  type="date"
                  value={filters.dueDateRange.end}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Tag className="w-3.5 h-3.5 text-accent" />
                Tags
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagChange(tag)}
                    className={`w-full px-3 py-2 rounded border text-xs font-medium flex items-center gap-2 transition-colors ${
                      filters.tags.some((t) => t.id === tag.id)
                        ? "bg-accent bg-opacity-10 border-accent text-accent"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 border-2 rounded flex items-center justify-center ${
                        filters.tags.some((t) => t.id === tag.id)
                          ? "bg-accent border-accent"
                          : "border-gray-300"
                      }`}
                    >
                      {filters.tags.some((t) => t.id === tag.id) && (
                        <svg
                          className="w-2 h-2 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{tag.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2 mt-4"
              aria-label="Clear all filters"
            >
              <span className="w-3 h-3 relative">
                <span className="absolute inset-0 border-2 border-gray-400 rounded-full"></span>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-400 text-[10px]">
                  ×
                </span>
              </span>
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Mini Indicators when collapsed */}
      {!isOpen && hasActiveFilters && (
        <div className="p-2">
          {filters.priority.length > 0 && (
            <div className="h-2 w-2 bg-accent rounded-full mx-auto mb-2"></div>
          )}
          {filters.status && (
            <div className="h-2 w-2 bg-primary rounded-full mx-auto mb-2"></div>
          )}
          {(filters.dueDateRange.start || filters.dueDateRange.end) && (
            <div className="h-2 w-2 bg-yellow-500 rounded-full mx-auto mb-2"></div>
          )}
          {filters.tags.length > 0 && (
            <div className="h-2 w-2 bg-blue-500 rounded-full mx-auto"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
