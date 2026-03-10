import './NationalitiesChart.css';

const data = [
  { name: 'الهند', count: '72 الف شخص', percentage: 90, color: '#F97316', flag: 'in' },
  { name: 'بنغلاديش', count: '72 الف شخص', percentage: 70, color: '#10B981', flag: 'bd' },
  { name: 'باكستان', count: '72 الف شخص', percentage: 50, color: '#22C55E', flag: 'pk' },
  { name: 'الفلبين', count: '72 الف شخص', percentage: 40, color: '#3B82F6', flag: 'ph' },
  { name: 'إندونيسيا', count: '72 الف شخص', percentage: 30, color: '#EF4444', flag: 'id' },
  { name: 'سريلانكا', count: '72 الف شخص', percentage: 20, color: '#EAB308', flag: 'lk' },
  { name: 'نيبال', count: '72 الف شخص', percentage: 10, color: '#8B5CF6', flag: 'np' },
];

const NationalitiesChart = () => {
  return (
    <div className="nationalities-container">
      {data.map((item, index) => (
        <div key={index} className="nationality-row">
          <div className="nat-header">
            <div className="nat-name-flag">
              <span className="nat-name">{item.name}</span>
              {/* Using a simple emoji or placeholder for flags for now */}
              <img 
                src={`https://flagcdn.com/24x18/${item.flag}.png`} 
                alt={item.name} 
                className="nat-flag" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <span className="nat-count">{item.count}</span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${item.percentage}%`, 
                backgroundColor: item.color 
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NationalitiesChart;
