import './NationalitiesChart.css';
import WorldMap from '../WorldMap/WorldMap';

const DISTRIBUTION_COLORS = [
  '#F59E0B',
  '#EC4899',
  '#10B981',
  '#8B5CF6',
  '#EF4444',
  '#3B82F6',
];

interface ChartItem {
  label: string;
  value: number;
}

interface NationalitiesChartProps {
  data?: ChartItem[];
}

const NationalitiesChart = ({ data }: NationalitiesChartProps) => {
  const distribution = Array.isArray(data) ? data : [];
  const maxValue = Math.max(...distribution.map((item) => item.value), 1);

  return (
    <div className="nationalities-container">
      <div className="awqaf-world-map-wrap">
        <WorldMap data={distribution} colors={DISTRIBUTION_COLORS} />
      </div>
      <div className="awqaf-gov-grid">
        {distribution.map((item, index) => (
          <div key={`${item.label}-${index}`} className="awqaf-gov-item">
            <span className="awqaf-gov-name">{item.label}</span>
            <div className="awqaf-gov-bar-wrap">
              <div
                className="awqaf-gov-bar"
                style={{
                  width: item.value > 0 ? `${(item.value / maxValue) * 100}%` : '0%',
                  background: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
                }}
              />
            </div>
            <span className="awqaf-gov-value">{item.value}</span>
          </div>
        ))}
        {distribution.length === 0 && (
          <div className="awqaf-gov-empty">لا توجد بيانات توزيع متاحة</div>
        )}
      </div>
    </div>
  );
};

export default NationalitiesChart;
