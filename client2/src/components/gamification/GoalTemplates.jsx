// src/components/gamification/GoalTemplates.jsx
import React, { useState } from 'react';
import { MD3Card } from '../Material3';
import {
  GOAL_TEMPLATES,
  GOAL_CATEGORIES,
  getPopularTemplates,
  getTemplatesByCategory,
  getDifficultyColor,
  getCategoryIcon
} from '../../data/goalTemplates';
import './GoalTemplates.css';

/**
 * GoalTemplates Component
 * Displays goal template library with filtering and selection
 */
const GoalTemplates = ({ onSelectTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopular, setShowPopular] = useState(true);

  // Filter templates
  const getFilteredTemplates = () => {
    let templates = showPopular ? getPopularTemplates() : GOAL_TEMPLATES;

    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      templates = templates.filter(t => t.difficulty === selectedDifficulty);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    return templates;
  };

  const filteredTemplates = getFilteredTemplates();

  const categories = [
    { id: 'all', label: 'All', icon: 'grid_view' },
    { id: GOAL_CATEGORIES.READING_TIME, label: 'Time', icon: 'schedule' },
    { id: GOAL_CATEGORIES.PAGES, label: 'Pages', icon: 'menu_book' },
    { id: GOAL_CATEGORIES.BOOKS, label: 'Books', icon: 'library_books' },
    { id: GOAL_CATEGORIES.STREAK, label: 'Streaks', icon: 'local_fire_department' },
    { id: GOAL_CATEGORIES.NOTES, label: 'Notes', icon: 'edit_note' },
    { id: GOAL_CATEGORIES.CHALLENGE, label: 'Challenges', icon: 'emoji_events' }
  ];

  const difficulties = [
    { id: 'all', label: 'All Levels' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
    { id: 'expert', label: 'Expert' }
  ];

  const handleSelectTemplate = (template) => {
    // Convert template to goal format
    const goal = {
      id: `goal_${template.id}_${Date.now()}`,
      title: template.name,
      description: template.description,
      type: template.type,
      targetValue: template.targetValue,
      currentValue: 0,
      progress: 0,
      reward: template.reward,
      period: template.period,
      icon: template.icon,
      tips: template.tips,
      isFromTemplate: true,
      templateId: template.id
    };

    onSelectTemplate?.(goal);
  };

  return (
    <div className="goal-templates">
      {/* Header */}
      <div className="templates-header">
        <div className="header-title">
          <span className="material-symbols-outlined">library_add</span>
          <h2>Goal Templates</h2>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="templates-search">
        <span className="material-symbols-outlined">search</span>
        <input
          type="text"
          placeholder="Search goals..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value) setShowPopular(false);
          }}
        />
      </div>

      {/* Popular Toggle */}
      <div className="popular-toggle">
        <button
          className={`toggle-btn ${showPopular ? 'active' : ''}`}
          onClick={() => setShowPopular(true)}
        >
          <span className="material-symbols-outlined">star</span>
          Popular
        </button>
        <button
          className={`toggle-btn ${!showPopular ? 'active' : ''}`}
          onClick={() => setShowPopular(false)}
        >
          <span className="material-symbols-outlined">grid_view</span>
          All Templates
        </button>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="material-symbols-outlined">{cat.icon}</span>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Difficulty Filter */}
      <div className="difficulty-filter">
        <span className="filter-label">Difficulty:</span>
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
        >
          {difficulties.map((diff) => (
            <option key={diff.id} value={diff.id}>{diff.label}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="templates-grid">
        {filteredTemplates.length === 0 ? (
          <div className="no-templates">
            <span className="material-symbols-outlined">search_off</span>
            <p>No templates found</p>
            <button onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
              setShowPopular(false);
            }}>
              Clear filters
            </button>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <MD3Card
              key={template.id}
              variant="outlined"
              className="template-card"
              onClick={() => handleSelectTemplate(template)}
            >
              {/* Template Header */}
              <div className="template-header">
                <div className="template-icon-wrapper">
                  <span className="material-symbols-outlined">{template.icon}</span>
                </div>
                <div className="template-badges">
                  {template.popular && (
                    <span className="popular-badge">
                      <span className="material-symbols-outlined">star</span>
                      Popular
                    </span>
                  )}
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(template.difficulty) }}
                  >
                    {template.difficulty}
                  </span>
                </div>
              </div>

              {/* Template Content */}
              <div className="template-content">
                <h3 className="template-name">{template.name}</h3>
                <p className="template-description">{template.description}</p>
              </div>

              {/* Template Footer */}
              <div className="template-footer">
                <div className="template-reward">
                  <span className="material-symbols-outlined">stars</span>
                  <span>{template.reward} pts</span>
                </div>
                <div className="template-period">
                  <span className="material-symbols-outlined">schedule</span>
                  <span>{template.period}</span>
                </div>
              </div>

              {/* Tips Preview */}
              {template.tips && (
                <div className="template-tips">
                  <span className="material-symbols-outlined">lightbulb</span>
                  <span>{template.tips}</span>
                </div>
              )}

              {/* Add Button */}
              <button className="add-template-btn">
                <span className="material-symbols-outlined">add</span>
                Use This Goal
              </button>
            </MD3Card>
          ))
        )}
      </div>

      {/* Quick Stats */}
      <div className="templates-stats">
        <span>{filteredTemplates.length} templates available</span>
        {!showPopular && (
          <span> • {getPopularTemplates().length} popular</span>
        )}
      </div>
    </div>
  );
};

export default GoalTemplates;
