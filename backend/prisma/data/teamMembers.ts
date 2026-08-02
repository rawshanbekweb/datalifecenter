import { Department } from '@prisma/client';

/**
 * Kompaniya jamoasining boshlang'ich ro'yxati.
 *
 * ATAYIN alohida faylda: to'liq `seed.ts` production'da ishlatib bo'lmaydi
 * (demo parolli akkauntlar ochadi, kurs narxlari va hamkor logotiplari
 * ustidan yozadi), jamoa ro'yxati esa kerak. Shu sababli `seed.ts` ham,
 * `scripts/seed-team.ts` ham shu bitta manbadan o'qiydi — ro'yxat ikki
 * joyda ajralib ketmaydi.
 */
export interface TeamMemberSeed {
  name: string;
  position: string;
  bio: string;
  department: Department;
  skills: string[];
  /** seed-project-<index> loyihalariga bog'lanish; bunday loyiha bo'lmasa o'tkazib yuboriladi */
  projectIndexes: number[];
  leadership?: boolean;
}

// Kompaniya jamoasi. Mentor bo'lganlari (ismi mentorSpecs bilan bir xil)
// avtomatik ravishda o'z mentor profiliga bog'lanadi.
export const TEAM_MEMBERS: TeamMemberSeed[] = [
  {
    name: 'Rustam Nazarov', position: 'Asoschi va CEO', department: 'LEADERSHIP', leadership: true,
    bio: "DATA LIFE asoschisi. IT ta'lim va dasturiy ta'minot ishlab chiqishda 10 yildan ortiq tajriba.",
    skills: ['Strategiya', 'Product', 'Jamoa boshqaruvi'], projectIndexes: [0, 1],
  },
  {
    name: 'Dilnoza Yusupova', position: 'Texnik direktor (CTO)', department: 'LEADERSHIP', leadership: true,
    bio: "Kompaniyaning texnik yo'nalishini belgilaydi va backend jamoasini boshqaradi.",
    skills: ['Node.js', 'PostgreSQL', 'Arxitektura', 'DevOps'], projectIndexes: [0, 3],
  },
  {
    name: 'Aziz Karimov', position: 'Frontend jamoa yetakchisi', department: 'ENGINEERING',
    bio: "Mijoz interfeyslarini loyihalaydi va Frontend kursini olib boradi.",
    skills: ['React', 'TypeScript', 'Next.js'], projectIndexes: [0, 3],
  },
  {
    name: 'Sardor Rashidov', position: 'Kiberxavfsizlik muhandisi', department: 'ENGINEERING',
    bio: 'Loyihalar xavfsizligini ta\'minlaydi va Cyber Security kursini olib boradi.',
    skills: ['Pentest', 'Python', 'Elasticsearch'], projectIndexes: [2],
  },
  {
    name: 'Kamola Ergasheva', position: 'Product dizayner', department: 'DESIGN',
    bio: 'Mahsulot interfeysi va brend identikasi ustida ishlaydi.',
    skills: ['Figma', 'UI/UX', 'Design System'], projectIndexes: [1, 0],
  },
  {
    name: 'Bekzod Tursunov', position: "Ma'lumot muhandisi", department: 'DATA',
    bio: "Ma'lumot oqimlari va analitika tizimlarini quradi.",
    skills: ['Python', 'Airflow', 'SQL', 'Spark'], projectIndexes: [3],
  },
  {
    name: 'Nilufar Saidova', position: 'Marketing rahbari', department: 'MARKETING',
    bio: "Kompaniya brendi va o'quv dasturlarini bozorga olib chiqadi.",
    skills: ['SMM', 'Kontent', 'Analitika'], projectIndexes: [],
  },
  {
    name: 'Jasur Qodirov', position: 'Loyihalar menejeri', department: 'OPERATIONS',
    bio: 'Mijoz loyihalarining muddat va sifatini nazorat qiladi.',
    skills: ['Agile', 'Scrum', 'Jira'], projectIndexes: [1, 2],
  },
];
