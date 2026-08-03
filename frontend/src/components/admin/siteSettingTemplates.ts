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
    id: 'hero-datalife',
    name: L('DATA LIFE IT Center', 'DATA LIFE IT Center', 'DATA LIFE IT Center'),
    desc: L(
      "Kompaniyaning tekshirilgan ko'rsatkichlari",
      'Проверенные показатели компании',
      "The company's verified figures",
    ),
    data: {
      stats: [
        { value: '3000+', label: L('Bitiruvchilar', 'Выпускники', 'Graduates') },
        { value: '7', label: L("Yo'nalishlar", 'Направления', 'Tracks') },
        { value: '11', label: L('Mutaxassislar', 'Специалисты', 'Specialists') },
        { value: '2019', label: L('Tashkil etilgan', 'Основан', 'Founded') },
      ],
    },
  },
];

// ── About ────────────────────────────────────────────────────────────────────

const ABOUT_TEMPLATES: SectionTemplate<'about'>[] = [
  {
    id: 'about-datalife',
    name: L('DATA LIFE IT Center', 'DATA LIFE IT Center', 'DATA LIFE IT Center'),
    desc: L(
      "Tekshirilgan ko'rsatkichlar va afzalliklar",
      'Проверенные показатели и преимущества',
      'Verified figures and advantages',
    ),
    data: {
      stats: [
        { icon: 'Users', value: '3000+', label: L('Bitiruvchilar', 'Выпускники', 'Graduates'), color: '#0ea5e9' },
        { icon: 'BookOpen', value: '7', label: L("Yo'nalishlar", 'Направления', 'Tracks'), color: '#8b5cf6' },
        { icon: 'GraduationCap', value: '11', label: L('Mutaxassislar', 'Специалисты', 'Specialists'), color: '#6366f1' },
        { icon: 'Award', value: '2019', label: L('Tashkil etilgan', 'Основан', 'Founded'), color: '#f59e0b' },
      ],
      features: [
        L('Amaliyotchi mentorlar', 'Практикующие менторы', 'Practising mentors'),
        L('Real loyihalarda ishlash', 'Работа над реальными проектами', 'Work on real projects'),
        L('Kurs yakunida sertifikat', 'Сертификат по окончании курса', 'Certificate on completion'),
        L("Dasturiy ta'minot ishlab chiqish", 'Разработка программного обеспечения', 'Software development'),
      ],
      // skills / satisfaction ATAYIN bo'sh: o'lchanmagan foiz kiritilsa u
      // saytda haqiqiy ko'rsatkich bo'lib ko'rinardi. Bo'sh bo'lsa bosh
      // sahifadagi o'ng ustun kartasi umuman chiqmaydi.
      skills: [],
      satisfaction: [],
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

// DIQQAT: har bir kartaning `stat` maydoni sxema bo'yicha MAJBURIY va u
// saytda yirik raqam bo'lib chiqadi. Shu sabab bu yerda faqat kompaniya
// tasdiqlagan qiymatlar ishlatiladi (2019, 3000+, 11, 7). "92% ishga
// joylashish", "180+ loyiha", "24/7" kabi o'lchanmagan da'volar OLIB
// TASHLANDI — ular shablon bosilishi bilan haqiqiy statistika bo'lib
// ko'rinardi.
const WHY_US_TEMPLATES: SectionTemplate<'why_us'>[] = [
  {
    id: 'why-datalife',
    name: L('DATA LIFE IT Center', 'DATA LIFE IT Center', 'DATA LIFE IT Center'),
    desc: L('Tekshirilgan ko\'rsatkichlarga asoslangan 4 ta karta',
      'Четыре карточки на основе проверенных показателей',
      'Four cards based on verified figures'),
    data: {
      items: [
        {
          icon: 'Trophy', color: '#f59e0b', stat: '2019',
          title: L('Tajriba', 'Опыт', 'Experience'),
          desc: L('2019-yildan beri dasturiy ta\'minot ishlab chiqamiz va o\'qitamiz.',
            'С 2019 года разрабатываем программное обеспечение и обучаем.',
            'Building software and teaching since 2019.'),
        },
        {
          icon: 'GraduationCap', color: '#10b981', stat: '3000+',
          title: L('Bitiruvchilar', 'Выпускники', 'Graduates'),
          desc: L('3000 dan ortiq bitiruvchi markazimizda kasb egallagan.',
            'Более 3000 выпускников получили профессию в нашем центре.',
            'More than 3000 graduates have gained a profession here.'),
        },
        {
          icon: 'Users', color: '#0ea5e9', stat: '11',
          title: L('Jamoa', 'Команда', 'Team'),
          desc: L('Amaliyotchi mentorlar va mutaxassislardan iborat jamoa.',
            'Команда практикующих менторов и специалистов.',
            'A team of practising mentors and specialists.'),
        },
        {
          icon: 'BookOpen', color: '#8b5cf6', stat: '7',
          title: L("Yo'nalishlar", 'Направления', 'Tracks'),
          desc: L("Kompyuter savodxonligidan kiberxavfsizlikkacha 7 ta yo'nalish.",
            'Семь направлений — от компьютерной грамотности до кибербезопасности.',
            'Seven tracks — from computer literacy to cyber security.'),
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
