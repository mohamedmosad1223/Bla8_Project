import React from 'react';
import './Submenu.css';

interface SubmenuItem {
  id: string | number;
  label: string;
}

interface SubmenuProps {
  title?: string;
  items: SubmenuItem[];
  onSelect: (item: SubmenuItem) => void;
  selectedId?: string | number;
}

const Submenu: React.FC<SubmenuProps> = ({ 
  title, 
  items, 
  onSelect, 
  selectedId 
}) => {
  return (
    <div className="submenu-container" dir="rtl">
      {title && <div className="submenu-header">{title} - submenu</div>}
      <div className="submenu-list-card">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`submenu-list-item ${selectedId === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item)}
          >
            {item.label}
          </div>
        ))}
        {/* Placeholder for empty space as seen in screenshot */}
        <div className="submenu-spacer"></div>
      </div>
    </div>
  );
};

export default Submenu;
