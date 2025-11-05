import { useState, useEffect, useRef } from "react";
import { X, Plus, ChevronDown, Tag as TagIcon } from "lucide-react";
import { Tag, tagService } from "../services/tagService";

interface TagMultiSelectProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  placeholder?: string;
}

const TagMultiSelect = ({
  selectedTags,
  onChange,
  placeholder = "Select or add tags...",
}: TagMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTags = async () => {
    try {
      const tags = await tagService.getAllTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || isCreating) return;

    // Check if tag already exists
    const existingTag = availableTags.find(
      (t) => t.name.toLowerCase() === trimmedQuery.toLowerCase()
    );

    if (existingTag) {
      // Just select it
      if (!selectedTags.some((t) => t.id === existingTag.id)) {
        onChange([...selectedTags, existingTag]);
      }
      setSearchQuery("");
      return;
    }

    setIsCreating(true);
    try {
      const newTag = await tagService.createTag(trimmedQuery);
      setAvailableTags([...availableTags, newTag]);
      onChange([...selectedTags, newTag]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to create tag:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      handleCreateTag();
    }
  };

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  );

  const showCreateOption =
    searchQuery.trim() &&
    !availableTags.some(
      (t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Tags Display */}
      <div
        className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-md bg-white cursor-text flex flex-wrap gap-2 items-center"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-accent bg-opacity-10 text-accent border border-accent border-opacity-30 rounded text-sm"
          >
            <TagIcon className="w-3 h-3" />
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="hover:text-danger transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <div className="flex-1 min-w-[120px] flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ""}
            className="flex-1 outline-none border-0 p-0 text-sm focus:ring-0"
          />
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Create New Tag Option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={isCreating}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-b border-gray-200 text-primary font-medium"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? "Creating..." : `Create "${searchQuery.trim()}"`}
            </button>
          )}

          {/* Available Tags */}
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <div
                  className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                    selectedTags.some((t) => t.id === tag.id)
                      ? "bg-accent border-accent"
                      : "border-gray-300"
                  }`}
                >
                  {selectedTags.some((t) => t.id === tag.id) && (
                    <svg
                      className="w-3 h-3 text-white"
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
                <TagIcon className="w-3 h-3 text-gray-400" />
                {tag.name}
              </button>
            ))
          ) : !showCreateOption ? (
            <div className="px-3 py-4 text-center text-sm text-gray-500">
              {searchQuery
                ? "No tags found"
                : selectedTags.length === availableTags.length
                ? "All tags selected"
                : "No tags available"}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default TagMultiSelect;
