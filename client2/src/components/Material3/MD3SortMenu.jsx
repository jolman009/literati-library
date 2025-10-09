// src/components/Material3/MD3SortMenu.jsx
import React from 'react';
import { MD3Select } from './MD3Select';

const MD3SortMenu = ({ value, onChange, options, label = "Sort by", ...props }) => {
  return (
    <MD3Select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      label={label}
      {...props}
    >
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </MD3Select>
  );
};

export default MD3SortMenu;
