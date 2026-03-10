import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend: 'up' | 'down';
  trendValue: string;
}

const StatCard = ({ title, value, icon, iconBgColor, iconColor, trend, trendValue }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div 
          className="stat-icon-wrapper" 
          style={{ backgroundColor: iconBgColor, color: iconColor }}
        >
          {icon}
        </div>
        <div className="stat-info">
          <h3 className="stat-title">{title}</h3>
          <p className="stat-value">{value}</p>
        </div>
      </div>
      
      <div className="stat-footer">
        <span className="stat-period">الشهر الماضي</span>
        <div className={`stat-trend ${trend}`}>
          <span>{trendValue}</span>
          {trend === 'up' ? (
            <TrendingUp size={14} />
          ) : (
            <TrendingDown size={14} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
