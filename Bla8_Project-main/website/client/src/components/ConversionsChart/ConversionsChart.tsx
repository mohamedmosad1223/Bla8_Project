import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface TrendItem {
  label: string;
  value: number;
}

interface ConversionsChartProps {
  data?: TrendItem[];
}

// Parse backend data: "Jan 2025 - Converts" and "Jan 2025 - Rejects" into grouped chart data
function parseConversionTrends(rawData: TrendItem[]) {
  const monthMap: Record<string, { name: string; conversions: number; refusals: number }> = {};

  rawData.forEach(item => {
    const isConverts = item.label.includes('Converts');
    const isRejects  = item.label.includes('Rejects');
    const monthPart  = item.label.replace(' - Converts', '').replace(' - Rejects', '');

    if (!monthMap[monthPart]) {
      monthMap[monthPart] = { name: monthPart, conversions: 0, refusals: 0 };
    }
    if (isConverts) monthMap[monthPart].conversions = item.value;
    if (isRejects)  monthMap[monthPart].refusals    = item.value;
  });

  return Object.values(monthMap);
}

const FALLBACK_DATA = [
  { name: 'يناير',  conversions: 0, refusals: 0 },
  { name: 'فبراير', conversions: 0, refusals: 0 },
  { name: 'مارس',   conversions: 0, refusals: 0 },
];

const ConversionsChart = ({ data }: ConversionsChartProps) => {
  const chartData = data && data.length > 0
    ? parseConversionTrends(data)
    : FALLBACK_DATA;

  const hasData = chartData.some(d => d.conversions > 0 || d.refusals > 0);

  if (!hasData) {
    return (
      <div style={{ width: '100%', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9CA3AF', textAlign: 'center' }}>لا يوجد بيانات حالياً</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '300px', direction: 'ltr' }}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
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
          <Bar dataKey="conversions" fill="#166088" radius={[4, 4, 0, 0]} />
          <Bar dataKey="refusals"    fill="#DBA841" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversionsChart;
