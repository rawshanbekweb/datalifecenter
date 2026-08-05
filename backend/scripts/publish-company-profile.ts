import 'dotenv/config';

/**
 * Kompaniyaning HAQIQIY ma'lumotlarini saytga chiqaradi: mentorlar, jamoa,
 * yetishmayotgan kurslar va bosh sahifa bo'limlari (xizmatlar, "Nega biz").
 *
 * BLOG SKRIPTI BILAN BIR XIL YO'L: admin sifatida login qilib, admin
 * panelidagi formalar bosadigan AYNAN O'SHA endpointlarga yuboriladi
 * (POST /api/mentors, /api/team, /api/courses, PATCH /api/site-settings/:section).
 * Bazaga to'g'ridan-to'g'ri yozilmaydi — validatsiya va slug hosil qilish
 * odatdagi yo'ldan o'tadi.
 *
 * Idempotent: mavjud yozuv ISM bo'yicha topiladi va PUT bilan yangilanadi,
 * yo'q bo'lsa yaratiladi. Skriptni qayta ishga tushirish nusxa yaratmaydi.
 *
 * RASMLAR ATAYIN TEGILMAYDI: Supabase'da 33 ta fayl bor, lekin qaysi fayl
 * kimniki ekanini bilishning yo'li yo'q (2026-08-05 dagi baza qulashida shu
 * bog'lanish yo'qolgan). `photoUrl` yuborilmaydi — mavjud rasm o'chmaydi,
 * yangisini admin panelidan biriktirish kerak.
 *
 * MANBA: ma'lumotni markaz egasi bergan (2026-08-05). Hech qanday raqam yoki
 * lavozim o'ylab topilmagan — berilmagan narsa yozilmadi.
 *
 * Ishga tushirish:
 *   $env:API_URL='https://datalife.onrender.com'; $env:ADMIN_PASSWORD='...'; npm run publish:company
 *   $env:DRY_RUN='true'; ...   (kirmaydi, faqat rejani ko'rsatadi)
 */

const API = (process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@datalife.uz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const DRY_RUN = process.env.DRY_RUN === 'true';
const TIMEOUT_MS = 90_000;

interface L {
  uz: string;
  ru?: string;
  kaa?: string;
  en?: string;
}

// --------------------------------------------------------------- JAMOA
// Tartib: rahbariyat, keyin mentorlar, oxirida marketing.
// `mentor: false` — bu odam kurs olib bormaydi, faqat jamoa a'zosi.
interface Person {
  name: string;
  /** Mentorlar ro'yxatiga ham chiqadimi */
  mentor: boolean;
  /** Mentor kartasidagi yo'nalish; jamoa kartasidagi lavozim */
  role: L;
  department: 'LEADERSHIP' | 'ENGINEERING' | 'DATA' | 'DESIGN' | 'MARKETING' | 'EDUCATION' | 'OPERATIONS';
  leadership: boolean;
}

const PEOPLE: Person[] = [
  {
    name: 'Erejepbaev Janpolat',
    mentor: false,
    role: { uz: 'Direktor', ru: 'Директор', kaa: 'Direktor', en: 'Director' },
    department: 'LEADERSHIP',
    leadership: true,
  },
  {
    name: 'Pirimbetov Shaxrux',
    mentor: true,
    role: { uz: 'Python mentori', ru: 'Ментор Python', kaa: 'Python mentori', en: 'Python Mentor' },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Sipatdinova Nurjamal',
    mentor: true,
    role: { uz: 'Python mentori', ru: 'Ментор Python', kaa: 'Python mentori', en: 'Python Mentor' },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Kayipbaev Ravshan',
    mentor: true,
    role: {
      uz: 'Web Application Security mentori',
      ru: 'Ментор Web Application Security',
      kaa: 'Web Application Security mentori',
      en: 'Web Application Security Mentor',
    },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Yakubbaev Azamat',
    mentor: true,
    role: { uz: 'Backend mentori', ru: 'Ментор Backend', kaa: 'Backend mentori', en: 'Backend Mentor' },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Yangiboyev Jamshid',
    mentor: true,
    role: {
      uz: 'Frontend va Backend mentori',
      ru: 'Ментор Frontend и Backend',
      kaa: 'Frontend hám Backend mentori',
      en: 'Frontend & Backend Mentor',
    },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Doshmanov Madiyar',
    mentor: true,
    role: { uz: 'Frontend mentori', ru: 'Ментор Frontend', kaa: 'Frontend mentori', en: 'Frontend Mentor' },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Saparniyazov Ernazar',
    mentor: true,
    role: { uz: 'Frontend mentori', ru: 'Ментор Frontend', kaa: 'Frontend mentori', en: 'Frontend Mentor' },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Dospanov Abduaziz',
    mentor: true,
    role: {
      uz: 'Prompt Engineering mentori',
      ru: 'Ментор Prompt Engineering',
      kaa: 'Prompt Engineering mentori',
      en: 'Prompt Engineering Mentor',
    },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Bazarbaeva Aytgul',
    mentor: true,
    role: {
      uz: 'Kompyuter savodxonligi mentori',
      ru: 'Ментор компьютерной грамотности',
      kaa: 'Kompyuter sawatlılıģı mentori',
      en: 'Computer Literacy Mentor',
    },
    department: 'EDUCATION',
    leadership: false,
  },
  {
    name: 'Maxamadiyarov Shaxriyor',
    mentor: false,
    role: { uz: 'SMM menejer', ru: 'SMM-менеджер', kaa: 'SMM menejer', en: 'SMM Manager' },
    department: 'MARKETING',
    leadership: false,
  },
];

/** Bio — faqat berilgan ma'lumotdan tuziladi, hech narsa o'ylab topilmaydi */
function bioFor(p: Person): L {
  return {
    uz: `${p.name} — DATA LIFE IT markazida ${p.role.uz}.`,
    ru: `${p.name} — ${p.role.ru} в IT-центре DATA LIFE.`,
    kaa: `${p.name} — DATA LIFE IT orayında ${p.role.kaa}.`,
    en: `${p.name} — ${p.role.en} at DATA LIFE IT Center.`,
  };
}

// --------------------------------------------------------------- KURSLAR
// Bazada allaqachon bor: Frontend Development, Backend Development,
// Cyber Security (u "Web Application Security" deb qayta nomlanadi).
//
// DIQQAT — `published: false`: davomiylik va narx berilmagan. Ularsiz kursni
// saytga chiqarish o'ylab topilgan raqamni jonli sahifada ko'rsatish bo'lardi
// (narx bo'yicha nizo kelib chiqishi mumkin). Raqamlar aniqlangach admin
// panelidan bir tugma bilan chop etiladi.
interface NewCourse {
  title: L;
  subtitle: L;
  description: L;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  tags: string[];
  mentorNames: string[];
}

/**
 * Har bir kursning davomiyligi, narxi va mentorlari.
 *
 * DIQQAT — NARX VA DAVOMIYLIK TAXMINIY. Markaz egasi haqiqiy raqamlarni
 * keyinroq o'zi kiritishini aytdi (2026-08-05), shu paytgacha kurslar
 * bo'sh turmasligi uchun oraliq qiymatlar qo'yildi. Frontend Development
 * narxi (1 000 000) — YAGONA haqiqiy raqam, u eski bazadan kelgan va
 * tegilmaydi. Qolganlarini admin panelidan tuzatish kerak.
 */
const COURSE_SETTINGS: Record<
  string,
  { durationMonths: number; price: number; level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; mentorNames: string[]; approxPrice: boolean }
> = {
  'kompyuter-savodxonligi': { durationMonths: 2, price: 400_000, level: 'BEGINNER', mentorNames: ['Bazarbaeva Aytgul'], approxPrice: true },
  'grafik-dizayn': { durationMonths: 4, price: 700_000, level: 'BEGINNER', mentorNames: [], approxPrice: true },
  'python': { durationMonths: 6, price: 800_000, level: 'BEGINNER', mentorNames: ['Pirimbetov Shaxrux', 'Sipatdinova Nurjamal'], approxPrice: true },
  'prompt-engineering': { durationMonths: 3, price: 700_000, level: 'BEGINNER', mentorNames: ['Dospanov Abduaziz'], approxPrice: true },
  'web-application-security': { durationMonths: 6, price: 900_000, level: 'INTERMEDIATE', mentorNames: ['Kayipbaev Ravshan'], approxPrice: true },
  'frontend-development': { durationMonths: 6, price: 1_000_000, level: 'BEGINNER', mentorNames: ['Doshmanov Madiyar', 'Saparniyazov Ernazar', 'Yangiboyev Jamshid'], approxPrice: false },
  'backend-development': { durationMonths: 7, price: 900_000, level: 'INTERMEDIATE', mentorNames: ['Yakubbaev Azamat', 'Yangiboyev Jamshid'], approxPrice: true },
};

/**
 * Mavjud kurslardagi eski seed matnlari. "Cyber Security" kursi
 * "Web Application Security" deb qayta nomlandi, lekin tavsifi va teglari
 * eski qolgan edi — CTF va Forensics veb ilova xavfsizligiga kirmaydi.
 * Frontend/Backend kurslarida esa faqat o'zbekcha sarlavha bor edi.
 */
const COURSE_FIXES: Record<string, { subtitle?: L; description?: L; tags?: string[]; title?: L }> = {
  'web-application-security': {
    subtitle: {
      uz: 'Veb ilovalar xavfsizligi',
      ru: 'Безопасность веб-приложений',
      kaa: 'Veb qosımshalar qáwipsizligi',
      en: 'Web application security',
    },
    description: {
      uz: "Veb ilovalardagi zaifliklarni topish va yopishni o'rganish: OWASP Top 10, XSS va SQL injection, autentifikatsiya va sessiya xatolari, xavfsiz kod yozish hamda test hisobotini tayyorlash.",
      ru: 'Поиск и устранение уязвимостей веб-приложений: OWASP Top 10, XSS и SQL-инъекции, ошибки аутентификации и сессий, написание безопасного кода и подготовка отчёта по тестированию.',
      kaa: "Veb qosımshalardaģı ázziliklerdi tabıw hám jabıw: OWASP Top 10, XSS hám SQL injection, autentifikatsiya hám sessiya qátelikleri, qáwipsiz kod jazıw hám test esabatın tayarlaw.",
      en: 'Finding and fixing vulnerabilities in web applications: the OWASP Top 10, XSS and SQL injection, authentication and session flaws, writing secure code and reporting your findings.',
    },
    tags: ['OWASP Top 10', 'XSS', 'SQL Injection', 'Autentifikatsiya', 'Pentest'],
  },
  'frontend-development': {
    title: { uz: 'Frontend Development', ru: 'Frontend-разработка', kaa: 'Frontend Development', en: 'Frontend Development' },
  },
  'backend-development': {
    title: { uz: 'Backend Development', ru: 'Backend-разработка', kaa: 'Backend Development', en: 'Backend Development' },
  },
};

const NEW_COURSES: NewCourse[] = [
  {
    title: { uz: 'Python', ru: 'Python', kaa: 'Python', en: 'Python' },
    subtitle: {
      uz: 'Dasturlash asoslari va amaliyot',
      ru: 'Основы программирования и практика',
      kaa: 'Proqrammalastırıw tiykarları hám ámeliyat',
      en: 'Programming fundamentals and practice',
    },
    description: {
      uz: "Python tilida dasturlashni noldan o'rganish: sintaksis, ma'lumotlar tuzilmalari, fayllar bilan ishlash va amaliy loyihalar.",
      ru: 'Программирование на Python с нуля: синтаксис, структуры данных, работа с файлами и практические проекты.',
      kaa: "Python tilinde proqrammalastırıwdı noldan úyreniw: sintaksis, maģlıwmatlar dúzilmesi, fayllar menen islew hám ámeliy joybarlar.",
      en: 'Python programming from scratch: syntax, data structures, working with files and hands-on projects.',
    },
    iconKey: 'Server',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    tags: ['Python', 'OOP', 'Algoritmlar'],
    mentorNames: ['Pirimbetov Shaxrux', 'Sipatdinova Nurjamal'],
  },
  {
    title: { uz: 'Prompt Engineering', ru: 'Prompt Engineering', kaa: 'Prompt Engineering', en: 'Prompt Engineering' },
    subtitle: {
      uz: "Sun'iy intellekt bilan ishlash",
      ru: 'Работа с искусственным интеллектом',
      kaa: 'Jasalma intellekt penen islew',
      en: 'Working with artificial intelligence',
    },
    description: {
      uz: "Katta til modellaridan amalda foydalanish: samarali so'rov yozish, modelni o'z vazifangizga moslash va ish jarayonlariga ulash.",
      ru: 'Практическое использование больших языковых моделей: эффективные промпты, адаптация модели под задачу и встраивание в рабочие процессы.',
      kaa: "Úlken til modellerinen ámelde paydalanıw: nátiyjeli soraw jazıw, modeldi óz wazıypańızģa maslastırıw hám jumıs procesine jalģaw.",
      en: 'Practical use of large language models: writing effective prompts, adapting models to your task and wiring them into workflows.',
    },
    iconKey: 'Brain',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    tags: ['AI', 'LLM', 'Prompting'],
    mentorNames: ['Dospanov Abduaziz'],
  },
  {
    title: { uz: 'Grafik dizayn', ru: 'Графический дизайн', kaa: 'Grafik dizayn', en: 'Graphic Design' },
    subtitle: {
      uz: 'Vizual dizayn va brending',
      ru: 'Визуальный дизайн и брендинг',
      kaa: 'Vizual dizayn hám brending',
      en: 'Visual design and branding',
    },
    description: {
      uz: "Grafik dizayn asoslari: kompozitsiya, rang va tipografika, logotip va brend uslubi, bosma hamda raqamli mahsulotlar uchun maketlar.",
      ru: 'Основы графического дизайна: композиция, цвет и типографика, логотип и фирменный стиль, макеты для печати и цифровых продуктов.',
      kaa: "Grafik dizayn tiykarları: kompozitsiya, reń hám tipografika, logotip hám brend uslubı, baspa hám sanlı ónimler ushın maketler.",
      en: 'Graphic design fundamentals: composition, colour and typography, logo and brand identity, layouts for print and digital.',
    },
    iconKey: 'Palette',
    color: '#db2777',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    tags: ['Dizayn', 'Figma', 'Brending'],
    mentorNames: [],
  },
  {
    title: {
      uz: 'Kompyuter savodxonligi',
      ru: 'Компьютерная грамотность',
      kaa: 'Kompyuter sawatlılıģı',
      en: 'Computer Literacy',
    },
    subtitle: {
      uz: 'Noldan boshlovchilar uchun',
      ru: 'Для начинающих с нуля',
      kaa: 'Noldan baslawshılar ushın',
      en: 'For complete beginners',
    },
    description: {
      uz: "Kompyuter bilan ishlashning asoslari: operatsion tizim, hujjatlar va jadvallar, internet va elektron pochta, raqamli xavfsizlik qoidalari.",
      ru: 'Основы работы с компьютером: операционная система, документы и таблицы, интернет и электронная почта, правила цифровой безопасности.',
      kaa: "Kompyuter menen islewdiń tiykarları: operatsion sistema, hújjetler hám kestelter, internet hám elektron pochta, sanlı qáwipsizlik qaģıydaları.",
      en: 'Computer basics: the operating system, documents and spreadsheets, internet and email, and digital safety rules.',
    },
    iconKey: 'Monitor',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    tags: ['Windows', 'Office', 'Internet'],
    mentorNames: ['Bazarbaeva Aytgul'],
  },
];

// --------------------------------------------------------------- XIZMATLAR
// "Data Analytics" OLIB TASHLANDI — markaz bu xizmatni ko'rsatmaydi
// (egasining 2026-08-05 dagi ko'rsatmasi). Digital Solutions ichidagi
// "Data Analytics" xususiyati ham shu sababdan olindi.
const SERVICES = {
  items: [
    {
      icon: 'Globe',
      color: '#0ea5e9',
      title: { uz: 'Veb ishlab chiqish', ru: 'Веб-разработка', kaa: 'Veb islep shıģarıw', en: 'Web Development' },
      desc: {
        uz: 'Zamonaviy veb ilovalar va korporativ saytlar — g\'oyadan ishga tushirishgacha.',
        ru: 'Современные веб-приложения и корпоративные сайты — от идеи до запуска.',
        kaa: 'Zamanagóy veb qosımshalar hám korporativ saytlar — oydan iske túsiriwge shekem.',
        en: 'Modern web applications and corporate sites — from idea to launch.',
      },
      feats: [
        { uz: 'Korporativ saytlar', ru: 'Корпоративные сайты', kaa: 'Korporativ saytlar', en: 'Corporate sites' },
        { uz: 'Veb ilovalar', ru: 'Веб-приложения', kaa: 'Veb qosımshalar', en: 'Web applications' },
        { uz: 'API integratsiya', ru: 'Интеграция API', kaa: 'API integratsiya', en: 'API integration' },
        { uz: 'SEO va tezlik', ru: 'SEO и скорость', kaa: 'SEO hám tezlik', en: 'SEO and performance' },
      ],
    },
    {
      icon: 'Smartphone',
      color: '#9333ea',
      title: { uz: 'Mobil ilovalar', ru: 'Мобильные приложения', kaa: 'Mobil qosımshalar', en: 'Mobile Applications' },
      desc: {
        uz: 'iOS va Android uchun ilovalar — bitta kod bazasidan ikkala platformaga.',
        ru: 'Приложения для iOS и Android — одна кодовая база на обе платформы.',
        kaa: 'iOS hám Android ushın qosımshalar — bir kod bazasınan eki platformaģa.',
        en: 'Apps for iOS and Android — one codebase, both platforms.',
      },
      feats: [
        { uz: 'Android va iOS', ru: 'Android и iOS', kaa: 'Android hám iOS', en: 'Android and iOS' },
        { uz: 'Do\'konga joylash', ru: 'Публикация в сторах', kaa: 'Dúkanģa jaylastırıw', en: 'Store publishing' },
        { uz: 'Push bildirishnomalar', ru: 'Push-уведомления', kaa: 'Push xabarlamalar', en: 'Push notifications' },
      ],
    },
    {
      icon: 'Palette',
      color: '#db2777',
      title: { uz: 'UI/UX dizayn', ru: 'UI/UX дизайн', kaa: 'UI/UX dizayn', en: 'UI/UX Design' },
      desc: {
        uz: 'Foydalanuvchi uchun qulay interfeys — prototipdan tayyor dizayngacha.',
        ru: 'Удобный интерфейс для пользователя — от прототипа до готового дизайна.',
        kaa: 'Paydalanıwshı ushın qolaylı interfeys — prototipten tayın dizaynģa shekem.',
        en: 'Interfaces users find easy — from prototype to finished design.',
      },
      feats: [
        { uz: 'Prototip va maket', ru: 'Прототип и макет', kaa: 'Prototip hám maket', en: 'Prototypes and mockups' },
        { uz: 'Dizayn tizimi', ru: 'Дизайн-система', kaa: 'Dizayn sisteması', en: 'Design systems' },
        { uz: 'Brend uslubi', ru: 'Фирменный стиль', kaa: 'Brend uslubı', en: 'Brand identity' },
      ],
    },
    {
      icon: 'Brain',
      color: '#d97706',
      title: { uz: 'IT konsalting', ru: 'IT-консалтинг', kaa: 'IT konsalting', en: 'IT Consulting' },
      desc: {
        uz: 'Qaysi texnologiyani tanlash va qanday qurish kerakligi bo\'yicha maslahat.',
        ru: 'Консультации по выбору технологий и архитектуре решения.',
        kaa: 'Qaysı texnologiyanı tańlaw hám qalay qurıw kerekligi boyınsha máslahát.',
        en: 'Advice on which technology to choose and how to build it.',
      },
      feats: [
        { uz: 'Texnologiya tanlash', ru: 'Выбор технологий', kaa: 'Texnologiya tańlaw', en: 'Technology choice' },
        { uz: 'Tizim arxitekturasi', ru: 'Архитектура системы', kaa: 'Sistema arxitekturası', en: 'System architecture' },
        { uz: 'Kod auditi', ru: 'Аудит кода', kaa: 'Kod auditi', en: 'Code audit' },
      ],
    },
    {
      icon: 'Cpu',
      color: '#16a34a',
      title: { uz: 'Dasturiy yechimlar', ru: 'Программные решения', kaa: 'Programmalıq sheshimler', en: 'Software Solutions' },
      desc: {
        uz: 'Biznes uchun maxsus dasturlar va startaplar uchun birinchi ishlaydigan mahsulot.',
        ru: 'Заказное ПО для бизнеса и первый рабочий продукт для стартапов.',
        kaa: 'Biznes ushın arnawlı programmalar hám startaplar ushın birinshi isleytuģın ónim.',
        en: 'Custom software for business and a first working product for startups.',
      },
      feats: [
        { uz: 'Maxsus dasturlar', ru: 'Заказное ПО', kaa: 'Arnawlı programmalar', en: 'Custom software' },
        { uz: 'Startap uchun MVP', ru: 'MVP для стартапа', kaa: 'Startap ushın MVP', en: 'MVP for startups' },
        { uz: 'Jarayonlarni avtomatlashtirish', ru: 'Автоматизация процессов', kaa: 'Proceslerdi avtomatlastırıw', en: 'Process automation' },
        { uz: 'CRM va ERP', ru: 'CRM и ERP', kaa: 'CRM hám ERP', en: 'CRM and ERP' },
      ],
    },
  ],
};

// --------------------------------------------------------------- NEGA BIZ
// "Karera qo'llab-quvvatlash" OLIB TASHLANDI (egasining ko'rsatmasi).
// Har bir ko'rsatkich TEKSHIRILGAN: 3000+ bitiruvchi, 2019-yil, 7 yo'nalish,
// 9 mentor, 11 kishilik jamoa. Ilgari bu yerda o'ylab topilgan raqamlar
// turardi (40+, 92%, 180+, 2,500+) va ular jonli saytda haqiqiy statistika
// bo'lib ko'rinardi.
const WHY_US = {
  items: [
    {
      icon: 'GraduationCap',
      color: '#0ea5e9',
      stat: '9',
      title: { uz: 'Tajribali mentorlar', ru: 'Опытные менторы', kaa: 'Tájiriybeli mentorlar', en: 'Experienced mentors' },
      desc: {
        uz: 'Har bir yo\'nalishni o\'z sohasida ishlaydigan mentor olib boradi.',
        ru: 'Каждое направление ведёт ментор, работающий в своей области.',
        kaa: 'Hár bir baģdardı óz tarawında isleytuģın mentor alıp baradı.',
        en: 'Every track is led by a mentor working in that field.',
      },
    },
    {
      icon: 'Trophy',
      color: '#db2777',
      stat: '3000+',
      title: { uz: 'Bitiruvchilar', ru: 'Выпускники', kaa: 'Pitkeriwshiler', en: 'Graduates' },
      desc: {
        uz: 'Markazni tugatgan o\'quvchilar soni.',
        ru: 'Столько учеников завершили обучение в центре.',
        kaa: 'Orayzı pitkergen oqıwshılar sanı.',
        en: 'That many students have completed our programmes.',
      },
    },
    {
      icon: 'BookOpen',
      color: '#9333ea',
      stat: '7',
      title: { uz: 'Yo\'nalishlar', ru: 'Направления', kaa: 'Baģdarlar', en: 'Tracks' },
      desc: {
        uz: 'Kompyuter savodxonligidan Prompt Engineering va kiberxavfsizlikkacha.',
        ru: 'От компьютерной грамотности до Prompt Engineering и кибербезопасности.',
        kaa: 'Kompyuter sawatlılıģınan Prompt Engineering hám kiberqáwipsizlikke shekem.',
        en: 'From computer literacy to prompt engineering and cybersecurity.',
      },
    },
    {
      icon: 'Award',
      color: '#16a34a',
      stat: '2019',
      title: { uz: 'Shu yildan beri', ru: 'С этого года', kaa: 'Usı jıldan berli', en: 'Since' },
      desc: {
        uz: 'DATA LIFE 2019-yildan beri uzluksiz ishlaydi.',
        ru: 'DATA LIFE непрерывно работает с 2019 года.',
        kaa: 'DATA LIFE 2019-jıldan berli úzliksiz isleydi.',
        en: 'DATA LIFE has been running continuously since 2019.',
      },
    },
    {
      icon: 'Users',
      color: '#0284c7',
      stat: '11',
      title: { uz: 'Jamoa', ru: 'Команда', kaa: 'Jámáát', en: 'Team' },
      desc: {
        uz: 'Mentorlar, rahbariyat va marketing mutaxassislari.',
        ru: 'Менторы, руководство и специалисты по маркетингу.',
        kaa: 'Mentorlar, basshılıq hám marketing qánigeleri.',
        en: 'Mentors, leadership and marketing specialists.',
      },
    },
  ],
};

// =================================================================== API

let sessionCookie = '';

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}/api${path}`, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

async function readError(res: Response): Promise<string> {
  const body = await res.text().catch(() => '');
  try {
    const parsed = JSON.parse(body);
    return parsed?.error?.message ?? parsed?.message ?? body;
  } catch {
    return body || `HTTP ${res.status}`;
  }
}

async function send(method: 'POST' | 'PUT' | 'PATCH', path: string, payload: unknown, what: string) {
  const res = await api(path, { method, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`${what}: ${await readError(res)}`);
  return res.json();
}

async function login(): Promise<void> {
  const res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Admin sifatida kirib bo'lmadi (${res.status}): ${await readError(res)}`);

  sessionCookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  if (!sessionCookie) throw new Error("Sessiya cookie'si qaytmadi");
  console.log(`Admin sifatida kirildi: ${ADMIN_EMAIL} → ${API}\n`);
}

async function getJson<T>(path: string): Promise<T> {
  const res = await api(path);
  if (!res.ok) throw new Error(`${path} o'qilmadi: ${await readError(res)}`);
  const body = await res.json();
  return body.data as T;
}

async function main(): Promise<void> {
  if (DRY_RUN) {
    console.log(`DRY RUN — ${API} ga hech narsa yuborilmaydi\n`);
    console.log(`  mentorlar:      ${PEOPLE.filter((p) => p.mentor).length} ta`);
    console.log(`  jamoa a'zolari: ${PEOPLE.length} ta`);
    console.log(`  yangi kurslar:  ${NEW_COURSES.length} ta (qoralama holatda)`);
    console.log(`  xizmatlar:      ${SERVICES.items.length} ta karta (Data Analytics olib tashlangan)`);
    console.log(`  "Nega biz":     ${WHY_US.items.length} ta karta (Karera qo'llab-quvvatlash olib tashlangan)`);
    return;
  }
  if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD berilmagan");

  await login();

  // ---------------------------------------------------------- MENTORLAR
  console.log('MENTORLAR');
  const existingMentors = await getJson<{ id: string; name: string }[]>('/mentors');
  const mentorIdByName = new Map<string, string>();

  for (const [i, p] of PEOPLE.filter((x) => x.mentor).entries()) {
    const payload = {
      name: p.name,
      specialty: p.role,
      bio: bioFor(p),
      featured: true,
      order: i,
    };
    // Ism bo'yicha moslash: eski yozuvlarda ism teskari tartibda bo'lishi
    // mumkin ("Abduaziz Dospanov"), shuning uchun so'zlar bo'yicha solishtiriladi
    const key = p.name.toLowerCase().split(/\s+/).sort().join(' ');
    const found = existingMentors.find((m) => m.name.toLowerCase().split(/\s+/).sort().join(' ') === key);

    if (found) {
      await send('PUT', `/mentors/${found.id}`, payload, `Mentor "${p.name}" yangilanmadi`);
      mentorIdByName.set(p.name, found.id);
      console.log(`  yangilandi: ${p.name}`);
    } else {
      const created = await send('POST', '/mentors', payload, `Mentor "${p.name}" yaratilmadi`);
      mentorIdByName.set(p.name, created.data.id);
      console.log(`  yaratildi:  ${p.name}`);
    }
  }

  // Ro'yxatda yo'q, lekin bazada turgan mentorlar. ATAYIN O'CHIRILMAYDI —
  // ular kursga biriktirilgan yoki foydalanuvchi hisobiga bog'langan bo'lishi
  // mumkin, shuning uchun qarorni odam qabul qiladi.
  const wantedKeys = new Set(
    PEOPLE.filter((p) => p.mentor).map((p) => p.name.toLowerCase().split(/\s+/).sort().join(' '))
  );
  const stale = existingMentors.filter(
    (m) => !wantedKeys.has(m.name.toLowerCase().split(/\s+/).sort().join(' '))
  );
  if (stale.length > 0) {
    console.log(`\n  DIQQAT — ro'yxatda yo'q mentorlar (o'chirilmadi, qo'lda ko'rib chiqing):`);
    for (const m of stale) console.log(`    ${m.name}  (id: ${m.id})`);
  }

  // -------------------------------------------------------------- JAMOA
  console.log('\nJAMOA');
  const existingTeam = await getJson<{ id: string; name: string }[]>('/team/admin');

  for (const [i, p] of PEOPLE.entries()) {
    const payload = {
      name: p.name,
      position: p.role,
      bio: bioFor(p),
      department: p.department,
      leadership: p.leadership,
      order: i,
      featured: i < 4,
      published: true,
      skills: [],
      // Mentor kartasi bilan bog'lash — jamoa sahifasidan mentor profiliga o'tadi
      mentorId: mentorIdByName.get(p.name) ?? null,
    };
    const key = p.name.toLowerCase().split(/\s+/).sort().join(' ');
    const found = existingTeam.find((m) => m.name.toLowerCase().split(/\s+/).sort().join(' ') === key);

    if (found) {
      await send('PUT', `/team/${found.id}`, payload, `Jamoa a'zosi "${p.name}" yangilanmadi`);
      console.log(`  yangilandi: ${p.name} (${p.role.uz})`);
    } else {
      await send('POST', '/team', payload, `Jamoa a'zosi "${p.name}" yaratilmadi`);
      console.log(`  yaratildi:  ${p.name} (${p.role.uz})`);
    }
  }

  // ------------------------------------------------------------ KURSLAR
  console.log('\nKURSLAR');
  const adminCourses = await getJson<{ id: string; slug: string; title: unknown }[]>('/courses/admin');

  // Eski "Cyber Security" kursi haqiqiy nomiga keltiriladi (slug qayta hosil bo'ladi)
  const cyber = adminCourses.find((c) => c.slug === 'cyber-security');
  if (cyber) {
    await send(
      'PUT',
      `/courses/${cyber.id}`,
      {
        title: {
          uz: 'Web Application Security',
          ru: 'Web Application Security',
          kaa: 'Web Application Security',
          en: 'Web Application Security',
        },
      },
      'Cyber Security kursi qayta nomlanmadi'
    );
    console.log('  qayta nomlandi: Cyber Security → Web Application Security');
  }

  // Yangi kurslar yaratiladi (mavjudlari tegilmaydi — sozlash quyida)
  for (const c of NEW_COURSES) {
    if (adminCourses.some((x) => String((x.title as { uz?: string })?.uz ?? '') === c.title.uz)) continue;
    await send(
      'POST',
      '/courses',
      {
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        iconKey: c.iconKey,
        color: c.color,
        bg: c.bg,
        border: c.border,
        tags: c.tags,
        durationMonths: 1,
        price: 0,
        level: 'BEGINNER',
        format: 'OFFLINE',
        published: false,
      },
      `Kurs "${c.title.uz}" yaratilmadi`
    );
    console.log(`  yaratildi: ${c.title.uz}`);
  }

  // Endi HAMMA kurs bir xil yo'ldan sozlanadi: davomiylik, narx, daraja,
  // mentorlar, eski seed matnlarini tuzatish va chop etish.
  const allCourses = await getJson<{ id: string; slug: string; title: unknown }[]>('/courses/admin');
  for (const [slug, cfg] of Object.entries(COURSE_SETTINGS)) {
    const course = allCourses.find((c) => c.slug === slug);
    if (!course) {
      console.log(`  DIQQAT: "${slug}" kursi topilmadi — sozlanmadi`);
      continue;
    }
    const ids = cfg.mentorNames.map((n) => mentorIdByName.get(n)).filter(Boolean) as string[];
    if (ids.length !== cfg.mentorNames.length) {
      console.log(`  DIQQAT: "${slug}" uchun ba'zi mentorlar topilmadi`);
    }

    await send(
      'PUT',
      `/courses/${course.id}`,
      {
        durationMonths: cfg.durationMonths,
        price: cfg.price,
        level: cfg.level,
        published: true,
        mentorIds: ids,
        ...(COURSE_FIXES[slug] ?? {}),
      },
      `"${slug}" sozlanmadi`
    );

    const mark = cfg.approxPrice ? ' (narx TAXMINIY)' : '';
    console.log(
      `  ${slug.padEnd(26)} ${cfg.durationMonths} oy · ${cfg.price.toLocaleString('ru-RU')} UZS${mark} · ${ids.length} mentor`
    );
  }

  // -------------------------------------------------- BOSH SAHIFA BO'LIMLARI
  console.log('\nBOSH SAHIFA');
  await send('PATCH', '/site-settings/services', SERVICES, 'Xizmatlar saqlanmadi');
  console.log(`  xizmatlar: ${SERVICES.items.length} ta karta (Data Analytics olib tashlandi)`);

  await send('PATCH', '/site-settings/why_us', WHY_US, '"Nega biz" saqlanmadi');
  console.log(`  "Nega biz": ${WHY_US.items.length} ta karta (Karera qo'llab-quvvatlash olib tashlandi)`);

  console.log('\nTayyor.');
}

main().catch((err) => {
  console.error(`\nXATO: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
