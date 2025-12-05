import React, { useState, useRef, useEffect } from 'react';
import type { ShelfQuestFolder } from '@/lib/types';

// ============================================
// Folder Selection Dropdown
// ============================================

interface FolderSelectProps {
  folders: ShelfQuestFolder[];
  selected: ShelfQuestFolder | null;
  onChange: (folder: ShelfQuestFolder | null) => void;
}

export function FolderSelect({ folders, selected, onChange }: FolderSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Filter folders by search
  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Build folder hierarchy for display
  const getFolderPath = (folder: ShelfQuestFolder): string => {
    if (!folder.parentId) return folder.name;
    const parent = folders.find(f => f.id === folder.parentId);
    return parent ? `${getFolderPath(parent)} / ${folder.name}` : folder.name;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        className="input-field text-left flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selected ? 'text-white' : 'text-white/50'}>
          {selected ? getFolderPath(selected) : 'No folder (root)'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-indigo-900 border border-white/20 rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              className="input-field text-sm py-1.5"
              placeholder="Search folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {/* Root option */}
            <button
              type="button"
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors
                ${!selected ? 'bg-white/5 text-indigo-300' : 'text-white/80'}`}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
                setSearch('');
              }}
            >
              📁 No folder (root)
            </button>

            {/* Folder list */}
            {filteredFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2
                  ${selected?.id === folder.id ? 'bg-white/5 text-indigo-300' : 'text-white/80'}`}
                onClick={() => {
                  onChange(folder);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: folder.color || '#6366f1' }}
                />
                <span className="truncate">{getFolderPath(folder)}</span>
              </button>
            ))}

            {filteredFolders.length === 0 && search && (
              <div className="px-3 py-4 text-center text-sm text-white/50">
                No folders found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
