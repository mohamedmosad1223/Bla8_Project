import json
import os

langs = {
    'ar.json': 'المقالات',
    'en.json': 'Articles',
    'de.json': 'Artikel',
    'fr.json': 'Articles',
    'es.json': 'Artículos',
    'ur.json': 'مضامین'
}

base_path = '/home/mohamed/Bla8_Project/Bla8_Project-main/website/client/src/i18n/translations'

for filename, article_text in langs.items():
    filepath = os.path.join(base_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'library' in data:
        data['library']['articles'] = article_text
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated JSON files")
