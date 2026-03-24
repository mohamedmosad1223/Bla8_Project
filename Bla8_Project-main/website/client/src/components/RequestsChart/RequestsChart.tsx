import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import './RequestsChart.css';

// Mock data, summing up to 4000
const data = [
  { name: 'من أسلم', value: 2000, color: '#10B981' }, // green
  { name: 'قيد التنفيذ', value: 1000, color: '#EAB308' }, // yellow
  { name: 'تم الإلغاء', value: 1000, color: '#EF4444' }, // red
];

const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

const RequestsChart = () => {
  return (
    <div className="requests-chart-container">
      <div className="doughnut-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={8}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="doughnut-center-text">
          <span className="total-number">{totalValue}</span>
          <span className="total-label">طلب</span>
        </div>
      </div>
      
      <div className="chart-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: item.color }}></div>
            <div className="legend-info">
              <span className="legend-name">{item.name}</span>
              <span className="legend-value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestsChart;
