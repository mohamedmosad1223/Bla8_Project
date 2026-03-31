import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import './RequestsChart.css';

interface ChartDataItem {
  label: string;
  value: number;
}

interface RequestsChartProps {
  data?: ChartDataItem[];
}

// Map Arabic status labels to Arabic display names + colors
const STATUS_CONFIG: Record<string, { name: string; color: string }> = {
  converted:         { name: 'أسلم',         color: '#10B981' },
  rejected:          { name: 'رفض',          color: '#EF4444' },
  under_persuasion:  { name: 'قيد الإقناع',  color: '#2563EB' }, // Blue
  in_progress:       { name: 'قيد الإقناع',  color: '#2563EB' }, // Merged into Blue
  pending:           { name: 'قيد الإقناع',  color: '#2563EB' }, // Merged into Blue
  cancelled:         { name: 'تم الإلغاء',   color: '#9CA3AF' },
};

const FALLBACK_DATA = [
  { name: 'أسلم',         value: 0, color: '#10B981' },
  { name: 'قيد الإقناع',  value: 0, color: '#2563EB' },
  { name: 'رفض',          value: 0, color: '#EF4444' },
];

const RequestsChart = ({ data }: RequestsChartProps) => {
  const chartData = data && data.length > 0
    ? (() => {
        const mapped = data.map(item => {
          const cfg = STATUS_CONFIG[item.label] ?? { name: item.label, color: '#6B7280' };
          return { name: cfg.name, value: item.value, color: cfg.color };
        });

        // Aggregate statuses that map to the same Arabic label (e.g. pending + under_persuasion -> "قيد التنفيذ")
        const grouped = mapped.reduce<Record<string, { name: string; value: number; color: string }>>(
          (acc, curr) => {
            if (!acc[curr.name]) {
              acc[curr.name] = { ...curr };
            } else {
              acc[curr.name].value += curr.value;
            }
            return acc;
          },
          {}
        );

        return Object.values(grouped);
      })()
    : FALLBACK_DATA;

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (totalValue === 0) {
    return (
      <div className="requests-chart-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#9CA3AF', textAlign: 'center' }}>لا يوجد بيانات حالياً</p>
      </div>
    );
  }

  return (
    <div className="requests-chart-container">
      <div className="doughnut-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              cornerRadius={8}
            >
              {chartData.map((entry, index) => (
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
        {chartData.map((item, index) => (
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
