import './NationalitiesChart.css';

const NationalitiesChart = () => {
  return (
    <div className="nationalities-container">
      <div className="awqaf-kuwait-map-wrap">
        <img src="/image 1.png" alt="خريطة الكويت" className="awqaf-kuwait-map-img" />
      </div>
      <div className="awqaf-gov-grid">
        {[
          { name: 'محافظة العاصمة',    value: 72, color: '#F59E0B' },
          { name: 'محافظة الأحمدي',   value: 60, color: '#EC4899' },
          { name: 'محافظة الفروانية', value: 50, color: '#10B981' },
          { name: 'محافظة حولي',       value: 40, color: '#8B5CF6' },
          { name: 'محافظة الجهراء',   value: 30, color: '#EF4444' },
          { name: 'محافظة مبارك الكبير', value: 20, color: '#3B82F6' },
        ].map(gov => (
          <div key={gov.name} className="awqaf-gov-item">
            <span className="awqaf-gov-name">{gov.name}</span>
            <div className="awqaf-gov-bar-wrap">
              <div
                className="awqaf-gov-bar"
                style={{ width: `${(gov.value / 72) * 100}%`, background: gov.color }}
              />
            </div>
            <span className="awqaf-gov-value">{gov.value} ألف شخص</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NationalitiesChart;
