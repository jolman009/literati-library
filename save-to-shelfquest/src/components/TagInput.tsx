import React, { useState, useRef, useEffect } from 'react';
import type { ShelfQuestTag } from '@/lib/types';

// ============================================
// Tag Input with Autocomplete
// ============================================

interface TagInputProps {
  availableTags: ShelfQuestTag[];
  selectedTags: ShelfQuestTag[];
  onChange: (tags: ShelfQuestTag[]) => void;
}

export function TagInput({ availableTags, selectedTags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available tags (exclude already selected)
  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTags.some((t) => t.id === tag.id) &&
      tag.name.toLowerCase().includes(input.toLowerCase())
  );

  const handleAddTag = (tag: ShelfQuestTag) => {
    onChange([...selectedTags, tag]);
    setInput('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && input === '' && selectedTags.length > 0) {
      // Remove last tag on backspace when input is empty
      handleRemoveTag(selectedTags[selectedTags.length - 1].id);
    } else if (e.key === 'Enter' && filteredTags.length > 0) {
      e.preventDefault();
      handleAddTag(filteredTags[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input with tag chips */}
      <div
        className="input-field flex flex-wrap gap-1.5 min-h-[42px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected tags */}
        {selectedTags.map((tag) => (
          <span key={tag.id} className="tag-chip">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tag.color || '#f59e0b' }}
            />
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="ml-0.5"
            >
              ×
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[80px] bg-transparent outline-none text-white placeholder-white/50"
          placeholder={selectedTags.length === 0 ? 'Add tags...' : ''}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && (input || filteredTags.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-indigo-900 border border-white/20 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-36 overflow-y-auto">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                  onClick={() => handleAddTag(tag)}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color || '#f59e0b' }}
                  />
                  <span>{tag.name}</span>
                </button>
              ))
            ) : input ? (
              <div className="px-3 py-3 text-center text-sm text-white/50">
                No matching tags
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
