import React, { useState } from 'react';
import { Search, Sliders, FileText, Book, Video, Mic, User } from 'lucide-react';
import './Library.css';

interface LibraryItem {
  id: string;
  type: 'article' | 'book' | 'video' | 'audio';
  title: string;
  category: string;
  author: string;
  imageUrl: string;
  authorImageUrl?: string;
}

const mockData: LibraryItem[] = [
  {
    id: '1',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1563200632-683109fc846a?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '3',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1591154669695-5f2a8d20c089?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '4',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '5',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1584281723171-897db66a988d?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '6',
    type: 'article',
    category: 'فهم وتطبيق أحاديث النبي ﷺ',
    title: 'أهمية العقيدة الصحيحة في حياة المسلم',
    author: 'بقلم: د. خالد العتيبي',
    imageUrl: 'https://images.unsplash.com/photo-1585829365234-781fdec3d443?auto=format&fit=crop&w=800&q=80',
    authorImageUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
  }
];

const Library: React.FC = () => {
  const [activeTab, setActiveTab ] = useState<'article' | 'book' | 'video' | 'audio'>('article');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = mockData.filter(item => 
    item.type === activeTab &&
    (item.title.includes(searchQuery) || item.author.includes(searchQuery))
  );

  return (
    <div className="library-container" dir="rtl">
      {/* Search Header */}
      <div className="library-header">
        <div className="search-bar-wrap">
          <div className="filter-btn">
            <Sliders size={20} />
          </div>
          <div className="search-input-inner">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="ابحث عن مقالة" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="library-tabs">
        <button 
          className={`tab-item ${activeTab === 'article' ? 'active' : ''}`}
          onClick={() => setActiveTab('article')}
        >
          <FileText size={20} />
          <span>المقالات</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          <Book size={20} />
          <span>الكتب</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <Video size={20} />
          <span>الفيديوهات</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          <Mic size={20} />
          <span>الصوتيات</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="library-grid">
        {filteredData.map(item => (
          <div key={item.id} className="library-card">
            <div className="card-image">
              <img src={item.imageUrl} alt={item.title} />
            </div>
            <div className="card-content">
              <span className="card-category">
                <span className="category-icon">🕋</span> {item.category}
              </span>
              <h3 className="card-title">{item.title}</h3>
              <div className="card-footer">
                <span className="card-author">{item.author}</span>
                <div className="author-avatar">
                  {item.authorImageUrl ? (
                    <img src={item.authorImageUrl} alt={item.author} />
                  ) : (
                    <User size={14} />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
