import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './AcceptanceRateChart.css';

interface AcceptanceRatePoint {
  name: string;
  value1: number;
}

interface AcceptanceRateChartProps {
  data?: AcceptanceRatePoint[];
}

const fallbackData = [
  { name: 'يناير', value1: 0 },
  { name: 'فبراير', value1: 0 },
  { name: 'مارس', value1: 0 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value red-text">{`نسبة القبول: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

const AcceptanceRateChart = ({ data }: AcceptanceRateChartProps) => {
  const chartData = data && data.length > 0 ? data : fallbackData;
  const hasData = chartData.some((d) => d.value1 > 0);

  if (!hasData) {
    return (
      <div className="acceptance-rate-chart-container" style={{ width: '100%', height: '100%', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9CA3AF', textAlign: 'center' }}>لا يوجد بيانات حالياً</p>
      </div>
    );
  }

  return (
    <div className="acceptance-rate-chart-container" style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 0,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'Cairo' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#4B5563', fontSize: 12, fontFamily: 'Cairo' }}
            domain={[40, 100]}
            ticks={[40, 60, 80, 100]}
            dx={-10}
            orientation="left"
            label={{ value: 'نسبة القبول (%)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12, fontFamily: 'Cairo', dx: -5 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Line
            type="linear" 
            dataKey="value1" 
            stroke="#9f1239" 
            strokeWidth={2}
            dot={{ r: 4, fill: '#9f1239', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#9f1239', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AcceptanceRateChart;
