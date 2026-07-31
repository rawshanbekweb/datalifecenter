import { Locale } from '../../i18n/config';
import { LocalizedString } from '../../types/locale';
import { SectionKey, Sections } from '../../types/siteSettings';

/**
 * Bosh sahifa bo'limlari uchun TAYYOR SHABLONLAR.
 *
 * Maqsad — bo'sh formaga qarab "nima yozsam ekan?" degan holatdan qutulish:
 * admin shablonni qo'llaydi, tayyor tuzilma va matnlar bilan ishlay boshlaydi,
 * keyin o'ziga moslaydi.
 *
 * Shablon nomlari i18n JSON fayllariga chiqarilmagan — ular shu katalogning
 * o'zi bilan birga o'zgaradi, shuning uchun yangi shablon qo'shish uchun 4 ta
 * tarjima faylini tahrirlash shart bo'lmasin deb shu yerda saqlanadi.
 *
 * `data` ATAYIN Partial: kontakt shabloni faqat ish jadvalini beradi va
 * qo'llanganda mavjud telefon/email/manzil ustidan yozib yubormaydi.
 */

// Qisqartma: {uz, ru, en} yozuvini har safar to'liq yozmaslik uchun.
// kaa (qoraqalpoqcha) ataylab bo'sh — saqlashda bo'sh tarjimalar tozalanadi
// va sayt uz'ga qaytadi; admin keyin qo'lda to'ldiradi.
const L = (uz: string, ru: string, en: string): LocalizedString => ({ uz, ru, en });

export interface SectionTemplate<K extends SectionKey = SectionKey> {
  id: string;
  name: LocalizedString;
  desc: LocalizedString;
  data: Partial<Sections[K]>;
}

/** Shablon nomini interfeys tiliga moslab oladi (tarjimasi yo'q bo'lsa — uz). */
export function pickLocale(value: LocalizedString, locale: Locale): string {
  return value[locale]?.trim() || value.uz;
}

/** Shablonni mavjud ma'lumot ustiga qo'llaydi. */
export function applyTemplate<K extends SectionKey>(current: Sections[K], template: SectionTemplate): Sections[K] {
  // Spread ATAYIN: kontakt shabloni faqat `hours` beradi va shu tarzda
  // qo'llanganda haqiqiy telefon/email/manzil joyida qoladi.
  return { ...current, ...(template.data as Partial<Sections[K]>) };
}

// ── Hero ─────────────────────────────────────────────────────────────────────

const HERO_TEMPLATES: SectionTemplate<'hero'>[] = [
  {
    id: 'hero-education',
    name: L("Ta'lim markazi", 'Учебный центр', 'Education center'),
    desc: L(
      "Bitiruvchilar, mentorlar va ishga joylashish ko'rsatkichlari",
      'Выпускники, менторы и показатели трудоустройства',
      'Graduates, mentors and placement rate',
    ),
    data: {
      stats: [
        { value: '2000+', label: L('Bitiruvchilar', 'Выпускники', 'Graduates') },
        { value: '40+', label: L('Mentorlar', 'Менторы', 'Mentors') },
        { value: '25+', label: L('Kurslar', 'Курсы', 'Courses') },
        { value: '95%', label: L('Ishga joylashish', 'Трудоустройство', 'Job placement') },
      ],
    },
  },
  {
    id: 'hero-company',
    name: L('IT kompaniya', 'IT компания', 'IT company'),
    desc: L(
      "Loyihalar, mijozlar va tajriba ko'rsatkichlari",
      'Проекты, клиенты и опыт',
      'Projects, clients and experience',
    ),
    data: {
      stats: [
        { value: '180+', label: L('Yakunlangan loyihalar', 'Завершённых проектов', 'Completed projects') },
        { value: '50+', label: L('Doimiy mijozlar', 'Постоянных клиентов', 'Regular clients') },
        { value: '8', label: L('Yillik tajriba', 'Лет опыта', 'Years of experience') },
        { value: '24/7', label: L("Qo'llab-quvvatlash", 'Поддержка', 'Support') },
      ],
    },
  },
];

// ── About ────────────────────────────────────────────────────────────────────

const ABOUT_TEMPLATES: SectionTemplate<'about'>[] = [
  {
    id: 'about-education',
    name: L("Ta'lim markazi", 'Учебный центр', 'Education center'),
    desc: L(
      "To'liq to'plam: kartochkalar, afzalliklar, yo'nalishlar va mamnuniyat",
      'Полный набор: карточки, преимущества, направления и удовлетворённость',
      'Full set: cards, features, tracks and satisfaction',
    ),
    data: {
      stats: [
        { icon: 'Users', value: '2000+', label: L('Bitiruvchilar', 'Выпускники', 'Graduates'), color: '#0ea5e9' },
        { icon: 'GraduationCap', value: '40+', label: L('Mentorlar', 'Менторы', 'Mentors'), color: '#6366f1' },
        { icon: 'BookOpen', value: '25+', label: L('Kurslar', 'Курсы', 'Courses'), color: '#8b5cf6' },
        { icon: 'Award', value: '95%', label: L('Ishga joylashish', 'Трудоустройство', 'Job placement'), color: '#10b981' },
      ],
      features: [
        L('Amaliyotga asoslangan zamonaviy dastur', 'Современная программа на основе практики', 'Modern practice-based curriculum'),
        L("Har bir talabaga shaxsiy mentor biriktiriladi", 'За каждым студентом закреплён личный ментор', 'A personal mentor for every student'),
        L("Real mijoz loyihalarida ishlash imkoniyati", 'Работа над реальными клиентскими проектами', 'Work on real client projects'),
        L("Kurs yakunida xalqaro tan olingan sertifikat", 'Международно признанный сертификат по окончании', 'Internationally recognised certificate'),
        L("Bitiruvchilarga ish topishda ko'maklashamiz", 'Помогаем выпускникам с трудоустройством', 'We help graduates find jobs'),
      ],
      skills: [
        { label: L('Frontend development', 'Frontend разработка', 'Frontend development'), pct: 92 },
        { label: L('Backend development', 'Backend разработка', 'Backend development'), pct: 88 },
        { label: L('Mobil ilovalar', 'Мобильные приложения', 'Mobile applications'), pct: 80 },
        { label: L('Data Science', 'Data Science', 'Data Science'), pct: 75 },
      ],
      satisfaction: [
        { value: '4.9', label: L("O'rtacha baho", 'Средняя оценка', 'Average rating') },
        { value: '98%', label: L('Tavsiya qilishadi', 'Рекомендуют нас', 'Would recommend') },
      ],
    },
  },
  {
    id: 'about-company',
    name: L('IT kompaniya', 'IT компания', 'IT company'),
    desc: L(
      'Xizmat sifati va texnologik kompetensiyalarga urg‘u',
      'Акцент на качестве услуг и технологических компетенциях',
      'Focused on service quality and technical competence',
    ),
    data: {
      stats: [
        { icon: 'Briefcase', value: '180+', label: L('Loyihalar', 'Проекты', 'Projects'), color: '#0ea5e9' },
        { icon: 'Users', value: '50+', label: L('Mijozlar', 'Клиенты', 'Clients'), color: '#6366f1' },
        { icon: 'Trophy', value: '8', label: L('Yillik tajriba', 'Лет опыта', 'Years of experience'), color: '#f59e0b' },
        { icon: 'HeartHandshake', value: '99%', label: L('Mijoz mamnuniyati', 'Довольных клиентов', 'Client satisfaction'), color: '#10b981' },
      ],
      features: [
        L('Har bir loyihaga alohida jamoa ajratiladi', 'Для каждого проекта выделяется отдельная команда', 'A dedicated team for every project'),
        L('Shaffof narx va aniq muddatlar', 'Прозрачные цены и чёткие сроки', 'Transparent pricing and clear deadlines'),
        L('Topshirilgandan keyin ham texnik yordam', 'Техподдержка и после сдачи проекта', 'Technical support after delivery'),
        L('Kod sifati va xavfsizlik auditi', 'Аудит качества кода и безопасности', 'Code quality and security audits'),
      ],
      skills: [
        { label: L('Veb ilovalar', 'Веб-приложения', 'Web applications'), pct: 95 },
        { label: L('Mobil ishlanmalar', 'Мобильная разработка', 'Mobile development'), pct: 85 },
        { label: L('Bulut infratuzilmasi', 'Облачная инфраструктура', 'Cloud infrastructure'), pct: 78 },
        { label: L('Ma’lumotlar tahlili', 'Аналитика данных', 'Data analytics'), pct: 82 },
      ],
      satisfaction: [
        { value: '4.8', label: L("O'rtacha baho", 'Средняя оценка', 'Average rating') },
        { value: '92%', label: L('Qayta murojaat', 'Повторные обращения', 'Repeat clients') },
      ],
    },
  },
];

// ── Services ─────────────────────────────────────────────────────────────────

const SERVICES_TEMPLATES: SectionTemplate<'services'>[] = [
  {
    id: 'services-it',
    name: L('IT xizmatlari', 'IT услуги', 'IT services'),
    desc: L('6 ta xizmat: veb, mobil, dizayn, konsalting, avtomatlashtirish, tahlil',
      '6 услуг: веб, мобайл, дизайн, консалтинг, автоматизация, аналитика',
      '6 services: web, mobile, design, consulting, automation, analytics'),
    data: {
      items: [
        {
          icon: 'Globe', color: '#0ea5e9',
          title: L('Veb ishlanma', 'Веб-разработка', 'Web development'),
          desc: L('Zamonaviy veb ilovalar. React, Next.js va Node.js bilan korporativ yechimlar.',
            'Современные веб-приложения. Корпоративные решения на React, Next.js и Node.js.',
            'Modern web applications. Enterprise solutions with React, Next.js and Node.js.'),
          feats: [
            L('SPA va SSR ilovalar', 'SPA и SSR приложения', 'SPA and SSR applications'),
            L('API integratsiyasi', 'Интеграция API', 'API integration'),
            L('SEO optimizatsiya', 'SEO оптимизация', 'SEO optimisation'),
          ],
        },
        {
          icon: 'Smartphone', color: '#8b5cf6',
          title: L('Mobil ilovalar', 'Мобильные приложения', 'Mobile applications'),
          desc: L('iOS va Android uchun professional ilovalar. Flutter va React Native.',
            'Профессиональные приложения для iOS и Android на Flutter и React Native.',
            'Professional iOS and Android apps with Flutter and React Native.'),
          feats: [
            L('Flutter va React Native', 'Flutter и React Native', 'Flutter and React Native'),
            L('App Store va Play Market', 'App Store и Play Market', 'App Store and Play Market'),
            L('Push bildirishnomalar', 'Push-уведомления', 'Push notifications'),
          ],
        },
        {
          icon: 'Palette', color: '#ec4899',
          title: L('UI/UX dizayn', 'UI/UX дизайн', 'UI/UX design'),
          desc: L('Foydalanuvchi uchun qulay dizayn. Figma bilan prototipdan mahsulotgacha.',
            'Удобный дизайн для пользователя. От прототипа до продукта в Figma.',
            'User-friendly design. From prototype to product in Figma.'),
          feats: [
            L('Foydalanuvchi tadqiqoti', 'Исследование пользователей', 'User research'),
            L('Dizayn tizimi', 'Дизайн-система', 'Design system'),
            L('Prototip va test', 'Прототип и тестирование', 'Prototyping and testing'),
          ],
        },
        {
          icon: 'Brain', color: '#f59e0b',
          title: L('IT konsalting', 'IT консалтинг', 'IT consulting'),
          desc: L('Biznesingiz uchun texnologik strategiya va ekspert maslahati.',
            'Технологическая стратегия и экспертные консультации для вашего бизнеса.',
            'Technology strategy and expert advice for your business.'),
          feats: [
            L('Texnologik strategiya', 'Технологическая стратегия', 'Technology strategy'),
            L('Tizim arxitekturasi', 'Архитектура системы', 'System architecture'),
            L('Kod auditi', 'Аудит кода', 'Code audit'),
          ],
        },
        {
          icon: 'Cpu', color: '#10b981',
          title: L('Avtomatlashtirish', 'Автоматизация', 'Automation'),
          desc: L('Biznes jarayonlarini avtomatlashtirish: CRM, ERP va maxsus yechimlar.',
            'Автоматизация бизнес-процессов: CRM, ERP и индивидуальные решения.',
            'Business process automation: CRM, ERP and custom solutions.'),
          feats: [
            L('CRM va ERP tizimlari', 'CRM и ERP системы', 'CRM and ERP systems'),
            L('Maxsus dasturiy ta’minot', 'Индивидуальное ПО', 'Custom software'),
            L('Jarayonlarni integratsiya qilish', 'Интеграция процессов', 'Process integration'),
          ],
        },
        {
          icon: 'BarChart3', color: '#6366f1',
          title: L('Ma’lumotlar tahlili', 'Аналитика данных', 'Data analytics'),
          desc: L('Ma’lumotlardan qimmatli xulosalar. Dashboard va hisobot tizimlari.',
            'Ценные выводы из данных. Дашборды и системы отчётности.',
            'Valuable insight from data. Dashboards and reporting systems.'),
          feats: [
            L('BI dashboardlar', 'BI дашборды', 'BI dashboards'),
            L('Real vaqt tahlili', 'Аналитика в реальном времени', 'Real-time analytics'),
            L('Bashoratli modellar', 'Предиктивные модели', 'Predictive models'),
          ],
        },
      ],
    },
  },
  {
    id: 'services-courses',
    name: L("Ta'lim yo'nalishlari", 'Направления обучения', 'Learning tracks'),
    desc: L("Xizmatlar o'rniga o'quv yo'nalishlarini ko'rsatish uchun",
      'Чтобы показать направления обучения вместо услуг',
      'To show learning tracks instead of services'),
    data: {
      items: [
        {
          icon: 'Monitor', color: '#0ea5e9',
          title: L('Frontend dasturlash', 'Frontend разработка', 'Frontend development'),
          desc: L('HTML, CSS, JavaScript va React asosida zamonaviy interfeyslar yaratish.',
            'Создание современных интерфейсов на HTML, CSS, JavaScript и React.',
            'Building modern interfaces with HTML, CSS, JavaScript and React.'),
          feats: [
            L('6 oylik amaliy dastur', '6-месячная практическая программа', '6-month practical programme'),
            L('10+ real loyiha', '10+ реальных проектов', '10+ real projects'),
            L('Portfolio bilan bitirish', 'Выпуск с портфолио', 'Graduate with a portfolio'),
          ],
        },
        {
          icon: 'Server', color: '#8b5cf6',
          title: L('Backend dasturlash', 'Backend разработка', 'Backend development'),
          desc: L('Node.js, ma’lumotlar bazasi va API arxitekturasi bo‘yicha chuqur tayyorgarlik.',
            'Углублённая подготовка по Node.js, базам данных и архитектуре API.',
            'In-depth training in Node.js, databases and API architecture.'),
          feats: [
            L('SQL va NoSQL bazalar', 'SQL и NoSQL базы', 'SQL and NoSQL databases'),
            L('REST va autentifikatsiya', 'REST и аутентификация', 'REST and authentication'),
            L('Deploy va monitoring', 'Деплой и мониторинг', 'Deployment and monitoring'),
          ],
        },
        {
          icon: 'Smartphone', color: '#ec4899',
          title: L('Mobil dasturlash', 'Мобильная разработка', 'Mobile development'),
          desc: L('Flutter yordamida iOS va Android uchun bitta koddan ilova yaratish.',
            'Создание приложений для iOS и Android из одного кода на Flutter.',
            'Building iOS and Android apps from a single Flutter codebase.'),
          feats: [
            L('Dart va Flutter', 'Dart и Flutter', 'Dart and Flutter'),
            L('Do‘konga joylashtirish', 'Публикация в сторах', 'Publishing to stores'),
            L('Amaliy loyihalar', 'Практические проекты', 'Hands-on projects'),
          ],
        },
        {
          icon: 'Database', color: '#10b981',
          title: L('Data Science', 'Data Science', 'Data Science'),
          desc: L('Python, statistika va mashinaviy o‘qitish asoslari bilan ma’lumot tahlili.',
            'Анализ данных на основе Python, статистики и машинного обучения.',
            'Data analysis with Python, statistics and machine learning fundamentals.'),
          feats: [
            L('Python va Pandas', 'Python и Pandas', 'Python and Pandas'),
            L('Vizualizatsiya', 'Визуализация', 'Visualisation'),
            L('Mashinaviy o‘qitish', 'Машинное обучение', 'Machine learning'),
          ],
        },
      ],
    },
  },
];

// ── Why us ───────────────────────────────────────────────────────────────────

const WHY_US_TEMPLATES: SectionTemplate<'why_us'>[] = [
  {
    id: 'why-education',
    name: L("Ta'lim afzalliklari", 'Преимущества обучения', 'Learning advantages'),
    desc: L('Mentorlar, amaliyot, sertifikat va karera yordami',
      'Менторы, практика, сертификат и помощь в карьере',
      'Mentors, practice, certificates and career support'),
    data: {
      items: [
        {
          icon: 'GraduationCap', color: '#0ea5e9', stat: '40+',
          title: L('Tajribali mentorlar', 'Опытные менторы', 'Experienced mentors'),
          desc: L('IT sohasida 5 yildan ortiq tajribaga ega amaliyotchi mutaxassislar.',
            'Практикующие специалисты с опытом более 5 лет в IT.',
            'Practising specialists with 5+ years of industry experience.'),
        },
        {
          icon: 'Zap', color: '#8b5cf6', stat: '70%',
          title: L("Amaliy ta'lim", 'Практическое обучение', 'Practical learning'),
          desc: L('Nazariyadan ko‘ra amaliyot ustuvor: real vazifalar va hakatonlar.',
            'Практика важнее теории: реальные задачи и хакатоны.',
            'Practice over theory: real tasks and hackathons.'),
        },
        {
          icon: 'Briefcase', color: '#10b981', stat: '180+',
          title: L('Real loyihalar', 'Реальные проекты', 'Real projects'),
          desc: L("O'qish davomida haqiqiy mijozlar uchun loyihalarda qatnashasiz.",
            'Во время обучения вы участвуете в проектах для реальных клиентов.',
            'During the course you work on projects for real clients.'),
        },
        {
          icon: 'HeartHandshake', color: '#f59e0b', stat: '92%',
          title: L("Karera qo'llab-quvvatlash", 'Карьерная поддержка', 'Career support'),
          desc: L('Rezyume tayyorlash, intervyuga tayyorgarlik va ish topishda yordam.',
            'Составление резюме, подготовка к интервью и помощь с трудоустройством.',
            'Resume writing, interview preparation and job placement help.'),
        },
        {
          icon: 'Trophy', color: '#ec4899', stat: '3000+',
          title: L('Sertifikatlar', 'Сертификаты', 'Certificates'),
          desc: L('Soha tomonidan tan olingan, onlayn tekshirib bo‘ladigan sertifikatlar.',
            'Признанные отраслью сертификаты с онлайн-проверкой.',
            'Industry-recognised certificates with online verification.'),
        },
        {
          icon: 'Users', color: '#6366f1', stat: '2500+',
          title: L('Kuchli hamjamiyat', 'Сильное сообщество', 'Strong community'),
          desc: L('Bitiruvchilar tarmog‘i: tanishuv, tajriba almashish va yangi imkoniyatlar.',
            'Сеть выпускников: знакомства, обмен опытом и новые возможности.',
            'An alumni network for connections, shared experience and opportunities.'),
        },
      ],
    },
  },
  {
    id: 'why-partnership',
    name: L('Hamkorlik afzalliklari', 'Преимущества сотрудничества', 'Partnership advantages'),
    desc: L('Mijozlarga qaratilgan qisqa variant (4 ta kartochka)',
      'Краткий вариант для клиентов (4 карточки)',
      'Short client-facing variant (4 cards)'),
    data: {
      items: [
        {
          icon: 'Zap', color: '#0ea5e9', stat: '2x',
          title: L('Tez natija', 'Быстрый результат', 'Fast delivery'),
          desc: L('Ishni bosqichlarga bo‘lamiz — birinchi natijani 2 hafta ichida ko‘rasiz.',
            'Делим работу на этапы — первый результат вы увидите за 2 недели.',
            'We work in stages — you see the first result within 2 weeks.'),
        },
        {
          icon: 'Shield', color: '#10b981', stat: '100%',
          title: L('Shaffof shartnoma', 'Прозрачный договор', 'Transparent contract'),
          desc: L('Aniq narx, aniq muddat va yashirin to‘lovlarsiz shartlar.',
            'Чёткая цена, чёткие сроки и никаких скрытых платежей.',
            'Clear pricing, clear deadlines and no hidden fees.'),
        },
        {
          icon: 'HeartHandshake', color: '#f59e0b', stat: '24/7',
          title: L("Doimiy qo'llab-quvvatlash", 'Постоянная поддержка', 'Ongoing support'),
          desc: L('Loyiha topshirilgandan keyin ham texnik yordam davom etadi.',
            'Техническая поддержка продолжается и после сдачи проекта.',
            'Technical support continues after the project is delivered.'),
        },
        {
          icon: 'Award', color: '#8b5cf6', stat: '8',
          title: L('Yillik tajriba', 'Лет опыта', 'Years of experience'),
          desc: L('Turli sohalarda yakunlangan yuzlab loyiha tajribasi.',
            'Опыт сотен завершённых проектов в разных отраслях.',
            'Hundreds of completed projects across different industries.'),
        },
      ],
    },
  },
];

// ── Contact ──────────────────────────────────────────────────────────────────

// DIQQAT: bu shablonlar faqat ish jadvalini beradi. Telefon/email/manzil
// ataylab tegilmaydi — ular haqiqiy ma'lumot va shablon ularni yo'q qilmasligi kerak.
const CONTACT_TEMPLATES: SectionTemplate<'contact'>[] = [
  {
    id: 'contact-standard',
    name: L('Standart ish jadvali', 'Стандартный график', 'Standard schedule'),
    desc: L("Du–Ju 09:00–18:00, Sha qisqa kun, Yak dam olish. Telefon va manzilga tegilmaydi.",
      'Пн–Пт 09:00–18:00, Сб короткий день, Вс выходной. Телефон и адрес не меняются.',
      'Mon–Fri 09:00–18:00, short Saturday, closed Sunday. Phone and address untouched.'),
    data: {
      hours: [
        { day: L('Dushanba – Juma', 'Понедельник – Пятница', 'Monday – Friday'), time: '09:00 — 18:00', closed: false },
        { day: L('Shanba', 'Суббота', 'Saturday'), time: '10:00 — 15:00', closed: false },
        { day: L('Yakshanba', 'Воскресенье', 'Sunday'), time: 'Dam olish kuni', closed: true },
      ],
    },
  },
  {
    id: 'contact-extended',
    name: L('Kengaytirilgan jadval', 'Расширенный график', 'Extended schedule'),
    desc: L("Har kuni ochiq, kechki mashg'ulotlar bilan. Telefon va manzilga tegilmaydi.",
      'Открыто каждый день, включая вечерние занятия. Телефон и адрес не меняются.',
      'Open every day, including evening classes. Phone and address untouched.'),
    data: {
      hours: [
        { day: L('Dushanba – Juma', 'Понедельник – Пятница', 'Monday – Friday'), time: '08:00 — 21:00', closed: false },
        { day: L('Shanba', 'Суббота', 'Saturday'), time: '09:00 — 18:00', closed: false },
        { day: L('Yakshanba', 'Воскресенье', 'Sunday'), time: '10:00 — 16:00', closed: false },
      ],
    },
  },
];

export const SECTION_TEMPLATES: { [K in SectionKey]: SectionTemplate<K>[] } = {
  hero: HERO_TEMPLATES,
  about: ABOUT_TEMPLATES,
  services: SERVICES_TEMPLATES,
  why_us: WHY_US_TEMPLATES,
  contact: CONTACT_TEMPLATES,
};
