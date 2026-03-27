import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import worldGeography from 'world-atlas/countries-110m.json';

interface WorldMapProps {
  data: Array<{ label: string; value: number }>;
  colors: string[];
}

const countryAliases: Record<string, string> = {
  'مصر': 'Egypt',
  'السعودية': 'Saudi Arabia',
  'المملكة العربية السعودية': 'Saudi Arabia',
  'الإمارات': 'United Arab Emirates',
  'الامارات': 'United Arab Emirates',
  'الإمارات العربية المتحدة': 'United Arab Emirates',
  'الكويت': 'Kuwait',
  'قطر': 'Qatar',
  'البحرين': 'Bahrain',
  'عمان': 'Oman',
  'الأردن': 'Jordan',
  'الاردن': 'Jordan',
  'العراق': 'Iraq',
  'سوريا': 'Syria',
  'لبنان': 'Lebanon',
  'فلسطين': 'Palestine',
  'الولايات المتحدة': 'United States of America',
  'امريكا': 'United States of America',
  'أمريكا': 'United States of America',
  'بريطانيا': 'United Kingdom',
  'المملكة المتحدة': 'United Kingdom',
  'فرنسا': 'France',
  'ألمانيا': 'Germany',
  'المانيا': 'Germany',
  'روسيا': 'Russia',
  'الصين': 'China',
  'إندونيسيا': 'Indonesia',
  'اندونيسيا': 'Indonesia',
  'البرازيل': 'Brazil',
  'كندا': 'Canada',
  'أستراليا': 'Australia',
  'استراليا': 'Australia',
};

const normalize = (value: string): string => value.trim().toLowerCase();

const WorldMap: React.FC<WorldMapProps> = ({ data, colors }) => {
  const countryStats = data.reduce<Record<string, { value: number; color: string }>>((acc, item, idx) => {
    const normalizedLabel = normalize(item.label);
    const countryName = countryAliases[normalizedLabel] || item.label.trim();
    const key = normalize(countryName);
    const barColor = colors[idx % colors.length] || '#FF4D4F';

    if (!acc[key]) {
      acc[key] = { value: item.value, color: barColor };
    } else {
      acc[key].value += item.value;
    }

    return acc;
  }, {} as Record<string, { value: number; color: string }>);

  const getCountryFill = (countryName: string): string => {
    const stats = countryStats[normalize(countryName)];
    if (!stats || stats.value <= 0) {
      return '#E2E8F0';
    }
    return stats.color;
  };

  return (
    <div className="wm-container">
      <ComposableMap
        projectionConfig={{ scale: 130 }}
        className="wm-svg"
      >
        <Geographies geography={worldGeography}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const countryName = (geo.properties.name as string) || '';
              const value = countryStats[normalize(countryName)]?.value || 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  className="wm-geography"
                  style={{
                    default: {
                      fill: getCountryFill(countryName),
                      stroke: '#FFFFFF',
                      strokeWidth: 0.4,
                      outline: 'none',
                    },
                    hover: {
                      fill: getCountryFill(countryName),
                      stroke: '#FFFFFF',
                      strokeWidth: 0.6,
                      outline: 'none',
                      opacity: 0.9,
                    },
                    pressed: {
                      fill: getCountryFill(countryName),
                      stroke: '#FFFFFF',
                      strokeWidth: 0.6,
                      outline: 'none',
                    },
                  }}
                >
                  <title>
                    {value > 0
                      ? `${countryName}: ${value} شخص`
                      : countryName}
                  </title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};

export default WorldMap;
