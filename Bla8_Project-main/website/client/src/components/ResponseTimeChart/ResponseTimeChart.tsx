import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import './ResponseTimeChart.css';

interface ResponseTimeData {
  name: string;
  time: number;
}

interface ResponseTimeChartProps {
  data?: ResponseTimeData[];
}

const ResponseTimeChart = ({ data }: ResponseTimeChartProps) => {
  const chartData = data && data.length > 0 ? data : [];

  return (
    <div className="response-time-chart-wrapper" style={{ direction: 'ltr', flex: 1, display: 'flex', width: '100%', minHeight: '250px' }}>
      <ResponsiveContainer width="99%" height={250} minWidth={1}>
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorTimeDetail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DBA841" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#DBA841" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(v) => `${v} د`}
            orientation="right"
            width={50}
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Cairo' }}
            formatter={(value) => [`${value} دقيقة`, 'وقت الاستجابة']}
            labelStyle={{ fontFamily: 'Cairo', textAlign: 'right' }}
          />
          <Area
            type="monotone"
            dataKey="time"
            stroke="#DBA841"
            strokeWidth={3}
            fill="url(#colorTimeDetail)"
            dot={false}
            activeDot={{ r: 6, fill: '#DBA841', stroke: 'white', strokeWidth: 2 }}
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseTimeChart;
