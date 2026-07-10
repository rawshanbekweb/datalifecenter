import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Seed'dan kelgan o'zbekcha kontentga ru/en tarjimalarini to'ldiradi.
// Idempotent va xavfsiz: faqat lug'atda bor uz matnlar tarjimalanadi (admin
// yozgan kontentga tegilmaydi), mavjud ru/en qiymatlar ustidan yozilmaydi,
// uz hech qachon o'zgartirilmaydi. DRY_RUN=true bilan faqat rejani ko'rsatadi.
//
// Ishga tushirish:  npm run translate:content            (lokal baza)
//                   DATABASE_URL=<prod url> npm run translate:content
//                   DRY_RUN=true npm run translate:content

const needsSsl = /\.render\.com/.test(process.env.DATABASE_URL ?? '');
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.env.DRY_RUN === 'true';

type Tr = { ru: string; en: string };

// uz matn -> {ru, en}. Texnik atamalar (Docker, React va h.k.) ataylab yo'q —
// ular tarjimasiz qoladi va pickLocale uz qiymatiga tushadi (bu to'g'ri xatti-harakat).
const DICT: Record<string, Tr> = {
  // ---- Kurslar (subtitle/description) ----
  'Axborot xavfsizligi': { ru: 'Информационная безопасность', en: 'Information Security' },
  "Sun'iy intellekt": { ru: 'Искусственный интеллект', en: 'Artificial Intelligence' },
  'Bulut texnologiyalari': { ru: 'Облачные технологии', en: 'Cloud Technologies' },
  "Zamonaviy veb ilovalar yaratishni o'rganing. React va TypeScript bilan professional developer bo'ling.": {
    ru: 'Научитесь создавать современные веб-приложения. Станьте профессиональным разработчиком с React и TypeScript.',
    en: 'Learn to build modern web applications. Become a professional developer with React and TypeScript.',
  },
  "Server-side dasturlash, ma'lumotlar bazasi va API yaratishni o'rganing.": {
    ru: 'Изучите серверное программирование, базы данных и создание API.',
    en: 'Learn server-side programming, databases and API development.',
  },
  "Kiberxavfsizlik mutaxassisi bo'ling. Etik hacking va zamonaviy himoya texnikalarini o'rganing.": {
    ru: 'Станьте специалистом по кибербезопасности. Изучите этичный хакинг и современные методы защиты.',
    en: 'Become a cybersecurity specialist. Learn ethical hacking and modern defense techniques.',
  },
  "Flutter yordamida iOS va Android ilovalar yaratishni o'rganing.": {
    ru: 'Научитесь создавать iOS и Android приложения с помощью Flutter.',
    en: 'Learn to build iOS and Android apps with Flutter.',
  },
  "Ma'lumotlar tahlili va sun'iy intellekt modellarini yaratishni o'rganing.": {
    ru: 'Научитесь анализировать данные и создавать модели искусственного интеллекта.',
    en: 'Learn data analysis and how to build AI models.',
  },
  "Bulut infratuzilmasini boshqarishni va DevOps amaliyotlarini o'rganing.": {
    ru: 'Научитесь управлять облачной инфраструктурой и применять DevOps-практики.',
    en: 'Learn to manage cloud infrastructure and apply DevOps practices.',
  },

  // ---- Blog maqolalari ----
  "React Hooks: useState va useEffect ni chuqur o'rganing": {
    ru: 'React Hooks: глубокое погружение в useState и useEffect',
    en: 'React Hooks: a deep dive into useState and useEffect',
  },
  "React Hooks — zamonaviy React dasturlashning asosi. Ushbu maqolada real misolar bilan o'rganamiz.": {
    ru: 'React Hooks — основа современной разработки на React. В этой статье разберём их на реальных примерах.',
    en: 'React Hooks are the foundation of modern React development. In this article we explore them with real examples.',
  },
  "React Hooks 16.8 versiyasidan boshlab funksional komponentlarga state va lifecycle imkoniyatlarini olib keldi.\n\nuseState — komponent ichida lokal holatni boshqarish uchun ishlatiladi. useEffect esa side-effect'larni (API so'rovlari, obuna bo'lish, DOM o'zgartirish) boshqarish uchun mo'ljallangan.\n\nUshbu maqolada real loyihalardan misollar bilan har ikkala hook'ning ishlash tamoyillarini, umumiy xatolarni va eng yaxshi amaliyotlarni ko'rib chiqamiz.": {
    ru: 'React Hooks, появившиеся в версии 16.8, принесли state и возможности жизненного цикла в функциональные компоненты.\n\nuseState используется для управления локальным состоянием внутри компонента. useEffect предназначен для управления сайд-эффектами (API-запросы, подписки, изменения DOM).\n\nВ этой статье на примерах из реальных проектов разберём принципы работы обоих хуков, типичные ошибки и лучшие практики.',
    en: 'React Hooks, introduced in version 16.8, brought state and lifecycle capabilities to functional components.\n\nuseState is used to manage local state inside a component. useEffect is designed to handle side effects (API requests, subscriptions, DOM changes).\n\nIn this article we walk through how both hooks work, common mistakes and best practices, using examples from real projects.',
  },
  'Kiberxavfsizlik: SQL Injection dan qanday himoyalanish': {
    ru: 'Кибербезопасность: как защититься от SQL-инъекций',
    en: 'Cybersecurity: how to protect against SQL Injection',
  },
  "SQL Injection — eng keng tarqalgan zaifliklardan biri. Himoya usullari va amaliy misollarni ko'rib chiqamiz.": {
    ru: 'SQL-инъекция — одна из самых распространённых уязвимостей. Разбираем способы защиты и практические примеры.',
    en: 'SQL Injection is one of the most common vulnerabilities. We look at defense techniques and practical examples.',
  },
  "SQL Injection — foydalanuvchi kiritgan ma'lumotlar to'g'ridan-to'g'ri SQL so'roviga qo'shilganda yuzaga keladigan zaiflik turi.\n\nBu maqolada parametrlashtirilgan so'rovlar (prepared statements), ORM'lardan foydalanish va kiritilgan ma'lumotlarni validatsiya qilish orqali himoyalanish usullarini ko'rib chiqamiz.": {
    ru: 'SQL-инъекция — тип уязвимости, возникающий, когда введённые пользователем данные попадают напрямую в SQL-запрос.\n\nВ этой статье разберём способы защиты: параметризованные запросы (prepared statements), использование ORM и валидацию входных данных.',
    en: 'SQL Injection is a type of vulnerability that occurs when user input is inserted directly into an SQL query.\n\nIn this article we cover defenses: parameterized queries (prepared statements), using ORMs and validating input data.',
  },
  "IT Sanoatida Karera: 2025-yilgi To'liq Roadmap": {
    ru: 'Карьера в IT: полный роадмап на 2025 год',
    en: 'A Career in IT: the Complete 2025 Roadmap',
  },
  "Frontend, Backend yoki AI — qaysi yo'nalishni tanlash kerak? 2025-yilgi IT karera yo'l xaritasi.": {
    ru: 'Frontend, Backend или AI — какое направление выбрать? Карьерная карта IT на 2025 год.',
    en: 'Frontend, Backend or AI — which track should you choose? The 2025 IT career roadmap.',
  },
  "IT sohasida karera boshlash uchun to'g'ri yo'nalishni tanlash muhim qadamdir.\n\nBu maqolada Frontend, Backend, Mobile, Data Science va DevOps yo'nalishlarining har biri uchun kerakli ko'nikmalar, o'rganish tartibi va bozordagi talab darajasini tahlil qilamiz.": {
    ru: 'Правильный выбор направления — важный шаг для старта карьеры в IT.\n\nВ этой статье анализируем необходимые навыки, порядок обучения и уровень спроса на рынке для каждого из направлений: Frontend, Backend, Mobile, Data Science и DevOps.',
    en: 'Choosing the right track is a key step when starting a career in IT.\n\nIn this article we analyze the required skills, learning order and market demand for each track: Frontend, Backend, Mobile, Data Science and DevOps.',
  },
  'Node.js va Express bilan REST API qurish': {
    ru: 'Создание REST API на Node.js и Express',
    en: 'Building a REST API with Node.js and Express',
  },
  "Sifatli REST API yaratish sirlarini o'rganing. Authentication, validation va documentation.": {
    ru: 'Изучите секреты создания качественного REST API. Аутентификация, валидация и документация.',
    en: 'Learn the secrets of building a quality REST API. Authentication, validation and documentation.',
  },
  "REST API — zamonaviy veb-ilovalarning asosiy qatlamlaridan biri.\n\nBu maqolada Express.js yordamida resurslarni to'g'ri modellashtirish, autentifikatsiya, kiritilgan ma'lumotlarni validatsiya qilish va xatoliklarni boshqarishning amaliy misollarini ko'rib chiqamiz.": {
    ru: 'REST API — один из основных слоёв современных веб-приложений.\n\nВ этой статье на практических примерах разберём правильное моделирование ресурсов с Express.js, аутентификацию, валидацию входных данных и обработку ошибок.',
    en: 'A REST API is one of the core layers of modern web applications.\n\nIn this article we use practical examples to cover proper resource modeling with Express.js, authentication, input validation and error handling.',
  },
  'Python bilan Machine Learning: Birinchi modelingiz': {
    ru: 'Machine Learning на Python: ваша первая модель',
    en: 'Machine Learning with Python: your first model',
  },
  "Sun'iy intellekt va ML haqida yangi boshlayotganlar uchun amaliy qo'llanma.": {
    ru: 'Практическое руководство по искусственному интеллекту и ML для начинающих.',
    en: 'A hands-on guide to AI and machine learning for beginners.',
  },
  "Machine Learning'ni o'rganishni boshlash uchun Python va uning kutubxonalari (NumPy, Pandas, scikit-learn) bilan tanishish kerak.\n\nBu maqolada oddiy klassifikatsiya modelini boshidan oxirigacha qurish jarayonini bosqichma-bosqich ko'rsatamiz.": {
    ru: 'Чтобы начать изучать Machine Learning, нужно познакомиться с Python и его библиотеками (NumPy, Pandas, scikit-learn).\n\nВ этой статье шаг за шагом показываем процесс построения простой модели классификации от начала до конца.',
    en: 'To start learning Machine Learning, you need to get familiar with Python and its libraries (NumPy, Pandas, scikit-learn).\n\nIn this article we walk step by step through building a simple classification model from start to finish.',
  },
  'Docker va Kubernetes: Container deployment asoslari': {
    ru: 'Docker и Kubernetes: основы контейнерного деплоя',
    en: 'Docker and Kubernetes: container deployment basics',
  },
  "Containerization nima? Docker va Kubernetes yordamida ilovalarni deploy qilishni o'rganing.": {
    ru: 'Что такое контейнеризация? Научитесь деплоить приложения с помощью Docker и Kubernetes.',
    en: 'What is containerization? Learn to deploy applications with Docker and Kubernetes.',
  },
  "Containerization ilovalarni muhitdan mustaqil ravishda ishga tushirish imkonini beradi.\n\nBu maqolada Docker image yaratish, konteynerlarni boshqarish va Kubernetes yordamida ko'p konteynerli tizimlarni orkestratsiya qilish asoslarini o'rganamiz.": {
    ru: 'Контейнеризация позволяет запускать приложения независимо от окружения.\n\nВ этой статье изучим основы: создание Docker-образов, управление контейнерами и оркестрацию многоконтейнерных систем с помощью Kubernetes.',
    en: 'Containerization lets you run applications independently of the environment.\n\nIn this article we cover the basics: building Docker images, managing containers and orchestrating multi-container systems with Kubernetes.',
  },

  // ---- Loyihalar ----
  "Full-stack onlayn ta'lim platformasi. Real-time video darslar va quiz tizimi.": {
    ru: 'Full-stack платформа онлайн-образования. Видеоуроки в реальном времени и система квизов.',
    en: 'A full-stack online education platform. Real-time video lessons and a quiz system.',
  },
  'Zamonaviy banking ilovasi. Naqd pul transferi va investitsiya boshqaruvi.': {
    ru: 'Современное банковское приложение. Денежные переводы и управление инвестициями.',
    en: 'A modern banking app. Money transfers and investment management.',
  },
  'Enterprise darajadagi kiberxavfsizlik monitoring tizimi.': {
    ru: 'Система мониторинга кибербезопасности корпоративного уровня.',
    en: 'An enterprise-grade cybersecurity monitoring system.',
  },
  'GPT asosidagi matn va kod generatsiya qiluvchi SaaS platforma.': {
    ru: 'SaaS-платформа генерации текста и кода на основе GPT.',
    en: 'A GPT-based SaaS platform for text and code generation.',
  },

  // ---- Sharhlar (testimonials) ----
  'Frontend dasturchi, Frontend Dev bitiruvchisi': {
    ru: 'Frontend-разработчик, выпускник курса Frontend Dev',
    en: 'Frontend developer, Frontend Dev graduate',
  },
  'Backend dasturchi, Backend Dev bitiruvchisi': {
    ru: 'Backend-разработчик, выпускник курса Backend Dev',
    en: 'Backend developer, Backend Dev graduate',
  },
  'Cyber Security mutaxassisi': {
    ru: 'Специалист по кибербезопасности',
    en: 'Cyber Security specialist',
  },
  "DATA LIFE'da olgan bilimlarim tufayli 3 oyda ishga joylashdim. Mentorlar juda tajribali va har doim yordam berishga tayyor edi.": {
    ru: 'Благодаря знаниям, полученным в DATA LIFE, я устроился на работу за 3 месяца. Менторы очень опытные и всегда были готовы помочь.',
    en: 'Thanks to what I learned at DATA LIFE, I got a job in 3 months. The mentors are very experienced and were always ready to help.',
  },
  "Real loyihalar ustida ishlash imkoniyati eng katta afzallik bo'ldi. Nazariya emas, amaliyotga asoslangan dastur juda foydali.": {
    ru: 'Возможность работать над реальными проектами стала самым большим преимуществом. Программа, основанная на практике, а не на теории, очень полезна.',
    en: 'The opportunity to work on real projects was the biggest advantage. A practice-based rather than theory-based program is incredibly useful.',
  },
  'Kurs dasturi zamonaviy va sohadagi haqiqiy talablarga mos. Sertifikat ish beruvchilar orasida yaxshi tan olinadi.': {
    ru: 'Программа курса современная и соответствует реальным требованиям отрасли. Сертификат хорошо признаётся работодателями.',
    en: 'The course program is modern and matches real industry requirements. The certificate is well recognized by employers.',
  },

  // ---- SiteSettings: hero/about statlari va ro'yxatlari ----
  Bitiruvchilar: { ru: 'Выпускников', en: 'Graduates' },
  Kurslar: { ru: 'Курсов', en: 'Courses' },
  'Yillik Tajriba': { ru: 'Лет опыта', en: 'Years of Experience' },
  'Ish Vaqti': { ru: 'Часы работы', en: 'Working Hours' },
  Loyihalar: { ru: 'Проектов', en: 'Projects' },
  'Professional sertifikatlar': { ru: 'Профессиональные сертификаты', en: 'Professional certificates' },
  'Real loyihalarda ishlash': { ru: 'Работа над реальными проектами', en: 'Work on real projects' },
  'Tajribali mentorlar': { ru: 'Опытные менторы', en: 'Experienced mentors' },
  "Karera qo'llab-quvvatlash": { ru: 'Карьерная поддержка', en: 'Career support' },
  "Zamonaviy o'quv dasturi": { ru: 'Современная учебная программа', en: 'Modern curriculum' },
  'Kichik guruhlar (max 15)': { ru: 'Небольшие группы (до 15 человек)', en: 'Small groups (max 15)' },

  // ---- SiteSettings: services ----
  'Zamonaviy veb ilovalar. React, Next.js, Node.js bilan enterprise yechimlar.': {
    ru: 'Современные веб-приложения. Enterprise-решения на React, Next.js и Node.js.',
    en: 'Modern web applications. Enterprise solutions with React, Next.js and Node.js.',
  },
  'iOS va Android uchun professional ilovalar. Flutter va React Native bilan.': {
    ru: 'Профессиональные приложения для iOS и Android. На Flutter и React Native.',
    en: 'Professional apps for iOS and Android. Built with Flutter and React Native.',
  },
  'Foydalanuvchilar uchun qulay dizayn. Figma bilan prototipdan mahsulotgacha.': {
    ru: 'Удобный для пользователей дизайн. От прототипа до продукта в Figma.',
    en: 'User-friendly design. From prototype to product with Figma.',
  },
  'Biznesingiz uchun texnologik strategiya. Expert maslahat xizmatlar.': {
    ru: 'Технологическая стратегия для вашего бизнеса. Экспертные консультации.',
    en: 'Technology strategy for your business. Expert consulting services.',
  },
  'Biznes jarayonlarini avtomatlashtirish. ERP, CRM va maxsus yechimlar.': {
    ru: 'Автоматизация бизнес-процессов. ERP, CRM и индивидуальные решения.',
    en: 'Business process automation. ERP, CRM and custom solutions.',
  },
  "Ma'lumotlardan qimmatli bilimlar olish. Dashboard va hisobot tizimlar.": {
    ru: 'Ценные инсайты из данных. Дашборды и системы отчётности.',
    en: 'Valuable insights from data. Dashboards and reporting systems.',
  },
  'SPA & SSR ilovalar': { ru: 'SPA и SSR приложения', en: 'SPA & SSR apps' },
  'API integratsiya': { ru: 'Интеграция API', en: 'API integration' },
  'SEO optimizatsiya': { ru: 'SEO-оптимизация', en: 'SEO optimization' },
  'App Store deploy': { ru: 'Публикация в App Store', en: 'App Store deployment' },

  // ---- SiteSettings: why_us ----
  'Tajribali Mentorlar': { ru: 'Опытные менторы', en: 'Experienced Mentors' },
  "Amaliy Ta'lim": { ru: 'Практическое обучение', en: 'Hands-on Learning' },
  'Real Loyihalar': { ru: 'Реальные проекты', en: 'Real Projects' },
  "Karera Qo'llab-quvvat": { ru: 'Карьерная поддержка', en: 'Career Support' },
  Sertifikatlar: { ru: 'Сертификаты', en: 'Certificates' },
  'Kuchli Hamjamiyat': { ru: 'Сильное сообщество', en: 'Strong Community' },
  "IT sanoatida 5+ yil tajribaga ega mutaxassislar tomonidan o'qiting.": {
    ru: 'Обучение у специалистов с более чем 5-летним опытом в IT-индустрии.',
    en: 'Learn from specialists with 5+ years of experience in the IT industry.',
  },
  "Nazariyadan ko'ra amaliyot ustuvor. Real loyihalar va hackathon-lar.": {
    ru: 'Практика важнее теории. Реальные проекты и хакатоны.',
    en: 'Practice over theory. Real projects and hackathons.',
  },
  "Ta'lim jarayonida haqiqiy mijozlar uchun loyihalarda ishlaysiz.": {
    ru: 'Во время обучения вы работаете над проектами для реальных клиентов.',
    en: 'During your studies you work on projects for real clients.',
  },
  "Resume, intervyu tayyorlash va ish topishda to'liq yordam.": {
    ru: 'Полная помощь с резюме, подготовкой к собеседованиям и поиском работы.',
    en: 'Full support with resumes, interview prep and job placement.',
  },
  'Sanoat tomonidan tan olingan. LinkedIn va xalqaro platformalarda tasdiqlangan.': {
    ru: 'Признаны индустрией. Подтверждаются в LinkedIn и на международных платформах.',
    en: 'Industry-recognized. Verified on LinkedIn and international platforms.',
  },
  "DATA LIFE bitiruvchilari tarmog'i. Networking va karera imkoniyatlari.": {
    ru: 'Сеть выпускников DATA LIFE. Нетворкинг и карьерные возможности.',
    en: 'The DATA LIFE alumni network. Networking and career opportunities.',
  },

  // ---- SiteSettings: contact ----
  "Amir Temur ko'chasi, 108": { ru: 'Улица Амира Темура, 108', en: 'Amir Temur Street, 108' },
  'Dushanba — Juma': { ru: 'Понедельник — Пятница', en: 'Monday — Friday' },
  Shanba: { ru: 'Суббота', en: 'Saturday' },
  Yakshanba: { ru: 'Воскресенье', en: 'Sunday' },
};

// Naqshli tarjimalar — lug'atga sig'maydigan generativ matnlar uchun
function patternTranslate(uz: string): Tr | null {
  // Seed darslari: "<modul> — Kirish"
  const lesson = uz.match(/^(.+) — Kirish$/);
  if (lesson) {
    return { ru: `${lesson[1]} — Введение`, en: `${lesson[1]} — Introduction` };
  }
  // Seed mentor tarjimai holi: "<ism> — DATA LIFE'da <soha> bo'yicha mentor."
  const bio = uz.match(/^(.+) — DATA LIFE'da (.+) bo'yicha mentor\.$/);
  if (bio) {
    return { ru: `${bio[1]} — ментор по ${bio[2]} в DATA LIFE.`, en: `${bio[1]} — mentor in ${bio[2]} at DATA LIFE.` };
  }
  return null;
}

function lookup(uz: string): Tr | null {
  return DICT[uz] ?? patternTranslate(uz);
}

interface LocalizedNode {
  uz: string;
  ru?: string;
  kaa?: string;
  en?: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && v.constructor === Object;
}

function isLocalizedNode(v: unknown): v is LocalizedNode {
  return isPlainObject(v) && typeof v.uz === 'string';
}

let filledCount = 0;
let wrappedCount = 0;

// Eski formatdagi oddiy stringni {uz: ...} tugunga o'raydi (SiteSetting'ning
// Stage 0 migratsiyasidan o'tmagan erkin JSON'i uchun). Admin paneli
// LocalizedString kutadi — string qolsa forma bo'sh ko'rinadi.
function wrapString(value: unknown): unknown {
  if (typeof value === 'string') {
    wrappedCount += 1;
    return { uz: value };
  }
  return value;
}

// SiteSetting bo'limlarida qaysi maydonlar tarjimaviy ekani aniq belgilangan —
// icon/color/value kabi texnik stringlar aslo o'ralmaydi.
function wrapSiteSetting(section: string, data: unknown): unknown {
  if (!isPlainObject(data)) return data;
  const d = { ...data } as Record<string, unknown>;
  const wrapArrayField = (items: unknown, keys: string[]): unknown => {
    if (!Array.isArray(items)) return items;
    return items.map((item) => {
      if (!isPlainObject(item)) return item;
      const next = { ...item } as Record<string, unknown>;
      for (const k of keys) {
        if (k in next) next[k] = wrapString(next[k]);
        if (k === 'feats' && Array.isArray(next.feats)) next.feats = next.feats.map(wrapString);
      }
      return next;
    });
  };
  if (section === 'hero') d.stats = wrapArrayField(d.stats, ['label']);
  if (section === 'about') {
    d.stats = wrapArrayField(d.stats, ['label']);
    if (Array.isArray(d.features)) d.features = d.features.map(wrapString);
    d.skills = wrapArrayField(d.skills, ['label']);
    d.satisfaction = wrapArrayField(d.satisfaction, ['label']);
  }
  if (section === 'services') d.items = wrapArrayField(d.items, ['title', 'desc', 'feats']);
  if (section === 'why_us') d.items = wrapArrayField(d.items, ['title', 'desc']);
  if (section === 'contact') {
    d.addressSub = wrapString(d.addressSub);
    d.hours = wrapArrayField(d.hours, ['day']);
  }
  return d;
}

// Bitta {uz,...} tugunga tarjima qo'shadi; o'zgargan bo'lsa yangi obyekt qaytaradi
function fillNode(node: LocalizedNode): LocalizedNode {
  const tr = lookup(node.uz);
  if (!tr) return node;
  const next = { ...node };
  let changed = false;
  if (!next.ru || next.ru.trim() === '') { next.ru = tr.ru; changed = true; }
  if (!next.en || next.en.trim() === '') { next.en = tr.en; changed = true; }
  if (changed) filledCount += 1;
  return changed ? next : node;
}

// JSON daraxtini rekursiv aylanadi (SiteSetting.data kabi ichma-ich tuzilmalar uchun)
function deepFill<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepFill(item)) as unknown as T;
  }
  if (isLocalizedNode(value)) {
    return fillNode(value) as unknown as T;
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) result[k] = deepFill(v);
    return result as T;
  }
  return value;
}

// Bitta jadval qatorining ko'rsatilgan json maydonlarini tarjima bilan boyitadi
async function processTable(
  name: string,
  rows: Array<Record<string, unknown> & { id: string | number }>,
  fields: string[],
  update: (id: string | number, data: Record<string, unknown>) => Promise<unknown>
): Promise<void> {
  let updated = 0;
  for (const row of rows) {
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      const before = row[f];
      if (before === null || before === undefined) continue;
      const after = deepFill(before);
      if (JSON.stringify(after) !== JSON.stringify(before)) data[f] = after;
    }
    if (Object.keys(data).length > 0) {
      updated += 1;
      if (!DRY_RUN) await update(row.id, data);
    }
  }
  console.log(`${name}: ${rows.length} qator ko'rildi, ${updated} tasi ${DRY_RUN ? 'yangilanadi (dry-run)' : 'yangilandi'}`);
}

async function main(): Promise<void> {
  console.log(DRY_RUN ? '== DRY RUN — bazaga yozilmaydi ==' : '== Tarjimalar yozilmoqda ==');

  await processTable('Course', await prisma.course.findMany(), ['title', 'subtitle', 'description'],
    (id, data) => prisma.course.update({ where: { id: String(id) }, data }));

  await processTable('Module', await prisma.module.findMany(), ['title'],
    (id, data) => prisma.module.update({ where: { id: String(id) }, data }));

  await processTable('Lesson', await prisma.lesson.findMany(), ['title'],
    (id, data) => prisma.lesson.update({ where: { id: String(id) }, data }));

  await processTable('BlogPost', await prisma.blogPost.findMany(), ['title', 'excerpt', 'content'],
    (id, data) => prisma.blogPost.update({ where: { id: String(id) }, data }));

  await processTable('Mentor', await prisma.mentor.findMany(), ['bio', 'specialty'],
    (id, data) => prisma.mentor.update({ where: { id: String(id) }, data }));

  await processTable('Testimonial', await prisma.testimonial.findMany(), ['role', 'text'],
    (id, data) => prisma.testimonial.update({ where: { id: String(id) }, data }));

  await processTable('Project', await prisma.project.findMany(), ['title', 'description'],
    (id, data) => prisma.project.update({ where: { id: String(id) }, data }));

  // SiteSetting: avval eski string maydonlar {uz}ga o'raladi, keyin tarjima to'ldiriladi.
  // Solishtirish bazadagi ASL qiymatga nisbatan — faqat o'rash o'zgartirgan bo'lsa ham yoziladi.
  const settings = await prisma.siteSetting.findMany();
  let settingsUpdated = 0;
  for (const s of settings) {
    const next = deepFill(wrapSiteSetting(s.section, s.data));
    if (JSON.stringify(next) !== JSON.stringify(s.data)) {
      settingsUpdated += 1;
      if (!DRY_RUN) {
        await prisma.siteSetting.update({ where: { section: s.section }, data: { data: next as object } });
      }
    }
  }
  console.log(`SiteSetting: ${settings.length} qator ko'rildi, ${settingsUpdated} tasi ${DRY_RUN ? 'yangilanadi (dry-run)' : 'yangilandi'}`);

  console.log(`Jami: ${wrappedCount} ta eski string {uz}ga o'raldi, ${filledCount} ta tugunga ru/en qo'shildi${DRY_RUN ? ' (dry-run hisobi)' : ''}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
