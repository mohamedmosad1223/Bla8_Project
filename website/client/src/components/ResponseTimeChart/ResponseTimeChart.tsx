import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceDot } from 'recharts';
import './ResponseTimeChart.css';

const data = [
  { name: 'يناير', time: 5 },
  { name: 'فبراير', time: 7 },
  { name: 'مارس', time: 4 },
  { name: 'ابريل', time: 6 },
  { name: 'مايو', time: 8 },
  { name: 'يونيو', time: 5 },
  { name: 'يوليو', time: 12 },
  { name: 'اغسطس', time: 10 },
  { name: 'سبتمبر', time: 7 },
  { name: 'اكتوبر', time: 18 },
  { name: 'نوفمبر', time: 9 },
  { name: 'ديسمبر', time: 14 },
];

const ResponseTimeChart = () => {
  return (
    <div className="response-time-chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
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
          <ReferenceDot
            x="اكتوبر"
            y={18}
            r={6}
            fill="#DBA841"
            stroke="white"
            strokeWidth={2}
            label={{ value: '18 دقيقة', position: 'top', fill: 'white', fontSize: 12, fontWeight: 700, offset: 8 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseTimeChart;
