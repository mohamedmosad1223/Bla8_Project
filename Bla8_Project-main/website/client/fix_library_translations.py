import json
import os

translations = {
    'en.json': {
        'books': 'Books', 'videos': 'Videos', 'audios': 'Audio', 'searchBook': 'Search for a book', 'searchVideo': 'Search for a video', 'searchAudio': 'Search for audio', 'searchArticle': 'Search for an article', 'pagesCount': 'Pages:', 'duration': 'Duration:', 'contentNotAvailable': 'This content is not available'
    },
    'de.json': {
        'books': 'Bücher', 'videos': 'Videos', 'audios': 'Audios', 'searchBook': 'Buch suchen', 'searchVideo': 'Video suchen', 'searchAudio': 'Audio suchen', 'searchArticle': 'Artikel suchen', 'pagesCount': 'Seitenzahl:', 'duration': 'Dauer:', 'contentNotAvailable': 'Dieser Inhalt ist nicht verfügbar'
    },
    'fr.json': {
        'books': 'Livres', 'videos': 'Vidéos', 'audios': 'Audios', 'searchBook': 'Chercher un livre', 'searchVideo': 'Chercher une vidéo', 'searchAudio': 'Chercher un audio', 'searchArticle': 'Chercher un article', 'pagesCount': 'Pages :', 'duration': 'Durée :', 'contentNotAvailable': 'Ce contenu n\'est pas disponible'
    },
    'es.json': {
        'books': 'Libros', 'videos': 'Videos', 'audios': 'Audios', 'searchBook': 'Buscar un libro', 'searchVideo': 'Buscar un video', 'searchAudio': 'Buscar un audio', 'searchArticle': 'Buscar un artículo', 'pagesCount': 'Páginas:', 'duration': 'Duración:', 'contentNotAvailable': 'Este contenido no está disponible'
    },
    'ur.json': {
        'books': 'کتابیں', 'videos': 'ویڈیوز', 'audios': 'آڈیوز', 'searchBook': 'کتاب تلاش کریں', 'searchVideo': 'ویڈیو تلاش کریں', 'searchAudio': 'آڈیو تلاش کریں', 'searchArticle': 'مضمون تلاش کریں', 'pagesCount': 'صفحات کی تعداد:', 'duration': 'دورانیہ:', 'contentNotAvailable': 'یہ مواد دستیاب نہیں ہے'
    }
}

base_path = '/home/mohamed/Bla8_Project/Bla8_Project-main/website/client/src/i18n/translations'

for filename, trans in translations.items():
    filepath = os.path.join(base_path, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'library' in data:
        for k, v in trans.items():
            data['library'][k] = v
            
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Translations fixed!")
