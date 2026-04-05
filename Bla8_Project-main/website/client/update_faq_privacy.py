import json
import os

base_path = '/home/mohamed/Bla8_Project/Bla8_Project-main/website/client/src/i18n/translations'

en_faq = {
  "q1": "What is the 'Balagh' platform?", "a1": "A platform aiming to introduce Islam and connect preachers with interested individuals via smart tools.",
  "q2": "Where does the religious information come from?", "a2": "We rely on a comprehensive religious library containing authentic Islamic books, the Holy Quran, and Prophetic Hadiths.",
  "q3": "Can I access preaching resources?", "a3": "Yes, the platform provides a dedicated resources section with books and articles in multiple languages.",
  "q4": "Is communication with interested individuals secure?", "a4": "Yes, the platform guarantees the privacy of your data and provides secure communication channels.",
  "q5": "What should I do if I face a technical issue?", "a5": "You can contact technical support by clicking on 'Customer Service' and messaging us directly."
}

ar_faq = {
  "q1": 'ما هي منصة "بلاغ"؟', "a1": 'منصة تهدف لتسهيل عملية التعريف بالإسلام وربط الدعاة بالمهتمين عبر أدوات ذكية ومتابعة احترافية.',
  "q2": 'من أين تأتي المعلومات الدينية في المنصة؟', "a2": 'نعتمد على مكتبة دينية شاملة تضم أمهات الكتب الإسلامية، ونسخاً كاملة من الأحاديث النبوية والقراّن الكريم لضمان دقة المعلومة المقدمة.',
  "q3": 'هل يمكنني الوصول للمصادر الدعوية؟', "a3": 'نعم، توفر المنصة قسماً خاصاً للمصادر يضم كتباً ومقالات بالعديد من اللغات العالمية لتسهيل عملية التعلم والتعليم.',
  "q4": 'هل التواصل مع المهتمين آمن؟', "a4": 'نعم، المنصة تضمن خصوصية بياناتك وتوفر قنوات تواصل مهيئة للعمل الدعوى بشكل منظم.',
  "q5": 'ماذا أفعل إذا واجهت مشكلة تقنية؟', "a5": 'يمكنك التواصل مع الدعم الفني عبر الضغط على "خدمة العملاء" ومراسلتنا مباشرة.'
}

en_privacy = {
  "t1": "Personal Data Collection", "b1": "We collect necessary data to connect preachers with interested people, such as name, email, phone, and languages.",
  "t2": "Information Usage", "b2": "Your data is only used to coordinate invite requests, improve service quality, and communicate with you.",
  "t3": "Data Protection", "b3": "We do not share or sell your data to any third party. Data is only accessible to authorized parties.",
  "t4": "Information Security", "b4": "We use advanced encryption and strict security protocols to protect your information.",
  "t5": "User Rights", "b5": "You can modify your data or delete your account at any time safely."
}

ar_privacy = {
  "t1": 'جمع البيانات الشخصية', "b1": 'نقوم بجمع البيانات الضرورية لربط الدعاة بالمهتمين، مثل الاسم، البريد الإلكتروني، ورقم الهاتف، واللغات، لضمان تقديم أفضل تجربة دعوية.',
  "t2": 'استخدام المعلومات', "b2": 'تُستخدم بياناتك فقط لتنسيق طلبات الدعوة، وتحسين جودة الخدمة، والتواصل معك بشأن تحديثات النظام أو الطلبات المسندة إليك.',
  "t3": 'حماية البيانات وخصوصيتها', "b3": 'لا نقوم بمشاركة أو بيع بياناتك لأي جهة خارجية. البيانات متاحة فقط للأطراف المعنية داخل المنصة (الداعية، الجمعية المشرفة، والمسؤولين).',
  "t4": 'أمن المعلومات', "b4": 'نستخدم تقنيات تشفير متقدمة وبروتوكولات أمنية صارمة لحماية معلوماتك من الوصول غير المصرح به أو التلاعب.',
  "t5": 'حقوق المستخدم وصلاحيات الحذف', "b5": 'يمكنك تعديل بياناتك أو حذف حسابك بشكل كامل في أي وقت. عند حذف الحساب، يتم إزالة كافة بياناتك الشخصية من قواعد بياناتنا النشطة.'
}

import glob
for filepath in glob.glob(os.path.join(base_path, '*.json')):
    filename = os.path.basename(filepath)
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    is_ar = (filename == 'ar.json')
    faq = ar_faq if is_ar else en_faq
    priv = ar_privacy if is_ar else en_privacy
    
    if 'faq' not in data: data['faq'] = {}
    if 'privacy' not in data: data['privacy'] = {}
    
    for k,v in faq.items(): data['faq'][k] = v
    for k,v in priv.items(): data['privacy'][k] = v
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated FAQ and Privacy in translations")
