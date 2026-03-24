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

const data = [
  { name: 'يوليو', value1: 58, value2: 32 },
  { name: 'يونيو', value1: 66, value2: 41 },
  { name: 'مايو', value1: 61, value2: 36 },
  { name: 'ابريل', value1: 70, value2: 45 },
  { name: 'مارس', value1: 79, value2: 54 },
  { name: 'فبراير', value1: 74, value2: 49 },
  { name: 'يناير', value1: 83, value2: 58 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value red-text">{`القيمة 1: ${payload[0].value}%`}</p>
        <p className="tooltip-value blue-text">{`القيمة 2: ${payload[1].value}%`}</p>
      </div>
    );
  }
  return null;
};

const AcceptanceRateChart = () => {
  return (
    <div className="acceptance-rate-chart-container" style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
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
          <Line 
            type="linear" 
            dataKey="value2" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AcceptanceRateChart;
