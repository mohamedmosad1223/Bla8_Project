import { ReactNode } from 'react';
import './StatCard.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const StatCard = ({ title, value, icon, iconBgColor, iconColor }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div 
        className="stat-icon-wrapper" 
        style={{ backgroundColor: iconBgColor, color: iconColor }}
      >
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
