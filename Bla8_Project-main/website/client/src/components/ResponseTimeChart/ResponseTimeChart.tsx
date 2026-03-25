import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import './ResponseTimeChart.css';

interface ResponseTimeData {
  name: string;
  time: number;
}

interface ResponseTimeChartProps {
  data?: ResponseTimeData[];
}

// بيانات افتراضية في حالة عدم وجود داتا
const defaultData = [
  { name: 'يناير', time: 0 },
  { name: 'فبراير', time: 0 },
  { name: 'مارس', time: 0 },
];

const ResponseTimeChart = ({ data }: ResponseTimeChartProps) => {
  const chartData = data && data.length > 0 ? data : defaultData;

  return (
    <div className="response-time-chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DBA841" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#DBA841" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 11 }}
            dy={10}
            reversed
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(v) => `${v} دقيقة`}
            orientation="right"
            width={70}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Cairo' }}
            formatter={(value) => [`${value} دقيقة`, 'وقت الاستجابة']}
          />
          <Area
            type="monotone"
            dataKey="time"
            stroke="#DBA841"
            strokeWidth={2.5}
            fill="url(#colorTime)"
            dot={false}
            activeDot={{ r: 6, fill: '#DBA841', stroke: 'white', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseTimeChart;
