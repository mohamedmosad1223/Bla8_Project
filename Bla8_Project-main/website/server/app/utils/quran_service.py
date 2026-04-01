from functools import lru_cache
import requests
import logging

logger = logging.getLogger(__name__)

# Edition map: Arabic always uthmani + ar.muyassar for tafsir
# Other languages: translation edition + tafsir fallback to en.asad
EDITION_MAP = {
    "ar": {
        "text": "quran-uthmani",
        "tafsir": "ar.muyassar"
    },
    "en": {
        "text": "en.asad",
        "tafsir": "en.pickthall"
    },
    "fr": {
        "text": "fr.hamidullah",
        "tafsir": "fr.hamidullah"
    },
    "de": {
        "text": "de.bubenheim",
        "tafsir": "de.aburida"
    },
    "es": {
        "text": "es.cortes",
        "tafsir": "es.bornez"
    },
    "zh": {
        "text": "zh.jian",
        "tafsir": "zh.majian"
    },
    "ru": {
        "text": "ru.kuliev",
        "tafsir": "ru.osmanov"
    },
    "hi": {
        "text": "hi.hindi",
        "tafsir": "hi.farooq"
    },
    "ur": {
        "text": "ur.ahmedali",
        "tafsir": "ur.jalandhry"
    },
}

LANGUAGE_MAP = {
    "english": "en",
    "french": "fr",
    "german": "de",
    "dutch": "de",
    "spanish": "es",
    "mandarin": "zh",
    "chinese": "zh",
    "russian": "ru",
    "hindi": "hi",
    "tagalog": "tl",
    "urdo": "ur",
    "urdu": "ur",
    "arabic": "ar",
}

@lru_cache(maxsize=512)
def get_quran_ayah(surah: int, ayah: int, language: str = "arabic") -> dict:
    """
    Returns ayah text + tafsir/translation for the given language.
    language: full language name (e.g. "english", "arabic")
    """
    lang_code = LANGUAGE_MAP.get(language.lower(), "ar")
    editions = EDITION_MAP.get(lang_code, EDITION_MAP["ar"])

    text_edition = editions["text"]
    tafsir_edition = editions["tafsir"]

    try:
        # If both are same, only 2 editions needed
        if text_edition == tafsir_edition:
            url = f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/editions/quran-uthmani,{text_edition}"
        else:
            url = f"https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/editions/quran-uthmani,{text_edition},{tafsir_edition}"

        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        editions_data = data["data"]

        result = {
            "arabic_text": editions_data[0]["text"],       # quran-uthmani is always first
            "translation": editions_data[1]["text"],
            "tafsir": editions_data[2]["text"] if len(editions_data) > 2 else editions_data[1]["text"],
            "surah_name": editions_data[0]["surah"]["name"],
            "surah_number": surah,
            "ayah_number": ayah,
        }
        return result
    except Exception as e:
        logger.error(f"Failed to fetch Ayah {surah}:{ayah} - {e}")
        return {}
