import './NationalitiesChart.css';

const nationalities = [
  { name: 'الولايات المتحدة الأمريكية',  count: '72 الف شخص', percentage: 72,  color: '#E11D48' },
  { name: 'المملكة المتحدة', count: '50 الف شخص', percentage: 50,  color: '#3B82F6' },
  { name: 'استراليا', count: '40 الف شخص', percentage: 40,  color: '#F59E0B' },
  { name: 'امريكا الجنوبية', count: '30 الف شخص', percentage: 30,  color: '#8B5CF6' },
  { name: 'الاكوادور', count: '20 الف شخص', percentage: 20,  color: '#10B981' },
];

const NationalitiesChart = () => {
  return (
    <div className="nationalities-container">
      {/* Map Image */}
      <div className="map-wrapper">
        <img
          src="/world 1.png"
          alt="خريطة الجنسيات"
          className="map-image"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* Nationalities list */}
      <div className="gov-list">
        {nationalities.map((item, index) => (
          <div key={index} className="nationality-row">
            <div className="nat-header">
              <span className="nat-name">{item.name}</span>
              <span className="nat-count">{item.count}</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NationalitiesChart;
