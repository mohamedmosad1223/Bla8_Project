import './NationalitiesChart.css';

// المحافظات الست ثابتة دائماً - القيم تيجي من الـ API لو فيه بيانات، وإلا صفر
const KUWAIT_GOVERNORATES = [
  { name: 'محافظة العاصمة',      color: '#F59E0B' },
  { name: 'محافظة الأحمدي',      color: '#EC4899' },
  { name: 'محافظة الفروانية',    color: '#10B981' },
  { name: 'محافظة حولي',         color: '#8B5CF6' },
  { name: 'محافظة الجهراء',      color: '#EF4444' },
  { name: 'محافظة مبارك الكبير', color: '#3B82F6' },
];

interface ChartItem {
  label: string;
  value: number;
}

interface NationalitiesChartProps {
  data?: ChartItem[]; // بيانات حقيقية من الـ API لو فيه
}

const NationalitiesChart = ({ data }: NationalitiesChartProps) => {
  const hasProvidedData = Array.isArray(data) && data.length > 0;
  if (hasProvidedData) {
    const maxValue = Math.max(...data.map((item) => item.value), 1);
    const dynamicRows = data.map((item, index) => ({
      name: item.label,
      value: item.value,
      color: KUWAIT_GOVERNORATES[index % KUWAIT_GOVERNORATES.length].color
    }));

    return (
      <div className="nationalities-container">
        <div className="awqaf-gov-grid">
          {dynamicRows.map((row) => (
            <div key={row.name} className="awqaf-gov-item">
              <span className="awqaf-gov-name">{row.name}</span>
              <div className="awqaf-gov-bar-wrap">
                <div
                  className="awqaf-gov-bar"
                  style={{
                    width: row.value > 0 ? `${(row.value / maxValue) * 100}%` : '0%',
                    background: row.color
                  }}
                />
              </div>
              <span className="awqaf-gov-value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // نبني map من اسم المحافظة → القيمة الحقيقية (لو جات من الـ API)
  const dataMap: Record<string, number> = {};
  if (data) {
    data.forEach(item => { dataMap[item.label] = item.value; });
  }

  // نحسب أعلى قيمة عشان نحسب نسبة الـ progress bar (لو كلها صفر نسيبها صفر)
  const govList = KUWAIT_GOVERNORATES.map(gov => ({
    ...gov,
    value: dataMap[gov.name] ?? 0,
  }));
  const maxValue = Math.max(...govList.map(g => g.value), 1); // الـ 1 عشان منقسمش على صفر

  return (
    <div className="nationalities-container">
      <div className="awqaf-kuwait-map-wrap">
        <img src="/image 1.png" alt="خريطة الكويت" className="awqaf-kuwait-map-img" />
      </div>
      <div className="awqaf-gov-grid">
        {govList.map(gov => (
          <div key={gov.name} className="awqaf-gov-item">
            <span className="awqaf-gov-name">{gov.name}</span>
            <div className="awqaf-gov-bar-wrap">
              <div
                className="awqaf-gov-bar"
                style={{
                  width: gov.value > 0 ? `${(gov.value / maxValue) * 100}%` : '0%',
                  background: gov.color,
                }}
              />
            </div>
            <span className="awqaf-gov-value">{gov.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NationalitiesChart;
