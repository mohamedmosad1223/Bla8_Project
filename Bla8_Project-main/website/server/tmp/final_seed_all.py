import sys
import os

# Ensure we can find the 'app' module
sys.path.append(os.path.abspath("."))

try:
    from app.database import engine
    from sqlalchemy import text
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def seed_all():
    try:
        with engine.connect() as conn:
            print("🚀 Smart Standardizing Reference Data (No Deletion)...")
            
            # 1. تغيير الأكواد القديمة مؤقتاً لفك التعارض (Unique Constraint)
            conn.execute(text("UPDATE languages SET language_code = language_code || '_old' WHERE language_code NOT LIKE '%_old';"))
            conn.execute(text("UPDATE countries SET country_code = country_code || '_old' WHERE country_code NOT LIKE '%_old';"))
            
            # 2. إدخال/تحديث اللغات (ID 1-6)
            languages = [
                (1, 'العربية', 'ar'),
                (2, 'الإنجليزية', 'en'),
                (3, 'التاغالوغية', 'tl'),
                (4, 'الهندية', 'hi'),
                (5, 'الفرنسية', 'fr'),
                (6, 'الإسبانية', 'es'),
            ]
            for lid, name, code in languages:
                conn.execute(
                    text("INSERT INTO languages (language_id, language_name, language_code) VALUES (:lid, :name, :code) ON CONFLICT (language_id) DO UPDATE SET language_name = EXCLUDED.language_name, language_code = EXCLUDED.language_code;"),
                    {"lid": lid, "name": name, "code": code}
                )

            # 3. إدخال/تحديث البلاد (ID 1-9)
            countries = [
                (1, 'الكويت', 'KW', '+965'),
                (2, 'مصر', 'EG', '+20'),
                (3, 'السعودية', 'SA', '+966'),
                (4, 'الفلبين', 'PH', '+63'),
                (5, 'الهند', 'IN', '+91'),
                (6, 'سريلانكا', 'LK', '+94'),
                (7, 'نيبال', 'NP', '+977'),
                (8, 'أمريكا', 'US', '+1'),
                (9, 'بريطانيا', 'GB', '+44'),
            ]
            for cid, name, code, pcode in countries:
                conn.execute(
                    text("INSERT INTO countries (country_id, country_name, country_code, phone_code) VALUES (:cid, :name, :code, :pcode) ON CONFLICT (country_id) DO UPDATE SET country_name = EXCLUDED.country_name, country_code = EXCLUDED.country_code, phone_code = EXCLUDED.phone_code;"),
                    {"cid": cid, "name": name, "code": code, "pcode": pcode}
                )

            # 4. إدخال/تحديث الأديان (ID 1-6)
            religions = [
                (1, "الإسلام"),
                (2, "المسيحية"),
                (3, "الهندوسية"),
                (4, "البوذية"),
                (5, "لاديني"),
                (6, "أخرى")
            ]
            for rid, name in religions:
                conn.execute(
                    text("INSERT INTO religions (religion_id, religion_name) VALUES (:rid, :name) ON CONFLICT (religion_id) DO UPDATE SET religion_name = EXCLUDED.religion_name;"),
                    {"rid": rid, "name": name}
                )

            # 5. تنظيف أي داتا قديمة (الأكواد اللى لسه فيها _old) لو مش مربوطة بحاجة
            # ملحوظة: لو مربوطة بحاجة هنسيبها عشان ميتأثرش السيستم
            conn.execute(text("DELETE FROM languages WHERE language_code LIKE '%\_old' AND language_id NOT IN (SELECT language_id FROM preacher_languages);"))
            
            conn.commit()
            print("✅ All Reference Data Standardized and Synced with Frontend (Safely)!")
            
    except Exception as e:
        print(f"Failed during smart seeding: {e}")

if __name__ == "__main__":
    seed_all()
