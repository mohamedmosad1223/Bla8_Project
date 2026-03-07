import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'يناير', conversions: 4000, refusals: 2400 },
  { name: 'فبراير', conversions: 3000, refusals: 1398 },
  { name: 'مارس', conversions: 2000, refusals: 9800 },
  { name: 'ابريل', conversions: 2780, refusals: 3908 },
  { name: 'مايو', conversions: 1890, refusals: 4800 },
  { name: 'يونيو', conversions: 2390, refusals: 3800 },
  { name: 'يوليو', conversions: 3490, refusals: 4300 },
];

const ConversionsChart = () => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 0,
            left: 0,
            bottom: 5,
          }}
          barSize={12}
        >
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend 
             align="left"
             verticalAlign="bottom"
             iconType="circle"
             wrapperStyle={{ paddingBottom: '10px' }}
             formatter={(value) => (
                <span style={{ color: '#1D2327', fontWeight: 600, fontSize: '0.9rem', marginRight: '8px' }}>
                  {value === 'conversions' ? 'تم الاسلام' : 'رفضوا'}
                </span>
             )}
          />
          {/* Blue bars for conversions, Yellow for refusals based on image */}
          {/* Wait, design image shows one bar per month in either blue or yellow? No, it's a grouped bar chart with two bars?
              Wait, the image shows "من اسلموا / رفضوا"
              It looks like single bars per month, some are yellow, some are blue. Or perhaps they are two series.
              Let me check the image again: 
              In the "من اسلموا / رفضوا" chart, there are pairs of bars, or alternating bars. 
              Actually it's single bars? "يناير, فبراير, مارس, ابريل..."
              Ah! It's pairs of bars. One is blue (for example, conversions), one is yellow (refusals), but sometimes only one is visible or they are side by side.
              Let's make them side by side. 
              Blue: #166088 or similar dark blue. Yellow: #DBA841 */}
          <Bar dataKey="conversions" fill="#166088" radius={[4, 4, 0, 0]} />
          <Bar dataKey="refusals" fill="#DBA841" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversionsChart;
