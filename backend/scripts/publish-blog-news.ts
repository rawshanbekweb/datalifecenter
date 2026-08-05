import 'dotenv/config';
import { slugify } from '../src/utils/slugify';

/**
 * 2026-yil yozidagi soha yangiliklari bo'yicha 3 ta blog maqolasini
 * ADMIN PANELI ORQALI chiqaradi.
 *
 * NEGA BAZAGA TO'G'RIDAN-TO'G'RI YOZMAYDI: bu seed emas, haqiqiy kontent.
 * Skript admin sifatida `POST /api/auth/login` bilan kiradi va maqolalarni
 * `POST /api/blog` ga yuboradi — ya'ni admin panelidagi "Yangi maqola"
 * formasi bosadigan AYNAN O'SHA endpoint. Natijada validatsiya, slug hosil
 * qilish, ruxsat tekshiruvi — hammasi odatdagi yo'ldan o'tadi va maqolalar
 * qo'lda kiritilganidan farq qilmaydi. Prisma orqali yozilsa bu qatlamlar
 * chetlab o'tilardi.
 *
 * Idempotent: mavjud slug QAYTA YOZILMAYDI — skript ikkinchi marta ishga
 * tushsa, admin panelda tahrirlangan matn yo'qolmaydi.
 *
 * Ishga tushirish (parolni buyruq tarixida qoldirmaslik uchun env orqali):
 *   $env:ADMIN_PASSWORD='...'; npm run publish:blog-news
 *   $env:API_URL='https://datalife.onrender.com'; $env:ADMIN_EMAIL='...'; $env:ADMIN_PASSWORD='...'; npm run publish:blog-news
 *   $env:DRY_RUN='true'; npm run publish:blog-news      (kirmaydi, faqat rejani ko'rsatadi)
 *
 * MUALLIF: maqolalar mentor biriktirilmagan holda chiqadi (mentorId yo'q),
 * chunki ularni kim nomidan chiqarish markazning o'z qarori. Admin panelidan
 * istalgan mentorni biriktirish mumkin.
 *
 * MANBALAR (2026-avgust holatiga ko'ra tekshirilgan):
 *   - SonicWall SMA 1000 zaifliklari va INC Ransomware: thehackernews.com
 *   - Hugging Face ta'minot zanjiri hodisasi: gbhackers.com haftalik sharhi
 *   - Iyul 2026 model to'lqini (GPT-5.6, Gemini 3.6, Grok 4.5, Kimi K3): thursdai.news
 *   - TIOBE iyul 2026 (Python 18.94%) va TypeScript GitHub reytingi: infoworld.com
 */

const API = (process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@datalife.uz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Render'ning bepul instansi uxlab qolgan bo'lsa birinchi so'rov ~50 soniya
// kutadi — shuning uchun timeout katta olingan
const TIMEOUT_MS = 90_000;

interface Localized {
  uz: string;
  ru: string;
  kaa: string;
  en: string;
}

interface NewsPost {
  /** Slug DOIM title.uz dan hosil bo'ladi — loyihaning qolgan qismidagi qoida */
  title: Localized;
  excerpt: Localized;
  content: Localized;
  category: string;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  readMinutes: number;
  tags: string[];
}

// DIQQAT: `publishedAt` ATAYIN yo'q. `POST /api/blog` uni o'zi hozirgi vaqtga
// qo'yadi (admin panelda ham shunday) va ro'yxat shu maydon bo'yicha yangidan
// eskiga tartiblanadi. Shuning uchun quyidagi ro'yxat ENG ESKISIDAN boshlanib,
// teskari tartibda yuboriladi — natijada saytda eng yangi maqola tepada turadi.

const POSTS: NewsPost[] = [
  // ------------------------------------------------------------------ 1. Kiberxavfsizlik
  {
    category: 'Security',
    iconKey: 'Shield',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    readMinutes: 7,
    tags: ['Kiberxavfsizlik', 'Ransomware', 'VPN'],
    title: {
      uz: "2026-yil yozi: kiberhujumlar endi chegaradagi qurilmalar orqali kiryapti",
      ru: 'Лето 2026: кибератаки всё чаще идут через пограничные устройства',
      kaa: "2026-jıl jazı: kiberhújimler endi shegaradaģı qurılmalar arqalı kiredi",
      en: 'Summer 2026: attackers are getting in through your edge devices',
    },
    excerpt: {
      uz: "Iyul-avgust oylaridagi eng yirik hodisalar bir narsani ko'rsatdi — hujumchilar parol tanlash bilan emas, yamalmagan VPN qurilmalari va odamning ishonchi orqali kiryapti.",
      ru: 'Крупнейшие инциденты июля–августа показали одно: злоумышленники входят не через подбор паролей, а через непропатченные VPN-устройства и доверие сотрудников.',
      kaa: "Iyul-avgust aylarındaģı eń iri waqıyalar bir nárseni kórsetti — hújimshiler parol tańlaw menen emes, jamalmaģan VPN qurılmaları hám adamnıń isenimi arqalı kiredi.",
      en: 'The biggest incidents of July and August point the same way: intruders are not guessing passwords, they are walking in through unpatched VPN appliances and human trust.',
    },
    content: {
      uz: [
        "2026-yilning yozi kiberxavfsizlik bo'yicha tinch kelmadi. Iyul va avgust oylarida e'lon qilingan yirik hodisalarni yonma-yon qo'ysak, ular orasida aniq bir naqsh ko'rinadi: hujumchilar tarmoqqa murakkab ekspluatatsiyalar bilan emas, tashqi perimetrdagi qurilmalar va xodimlarning ishonchi orqali kiryapti.",
        "Eng ko'zga tashlangani — SonicWall SMA 1000 seriyali VPN qurilmalaridagi zaifliklar. Ular zanjir shaklida birlashtirilganda hujumchiga qurilmada ixtiyoriy buyruq bajarish imkonini beradi, ya'ni tashqaridan to'g'ridan-to'g'ri ichki tarmoqqa yo'l ochiladi. Avgust boshidan buyon bu zaifliklardan foydalanayotgan asosiy guruh sifatida INC Ransomware operatsiyasi qayd etildi. Diqqat qiling: gap yangi, hech kim bilmagan teshik haqida emas — yamoq chiqqan, lekin ko'p tashkilotlar uni o'rnatishga ulgurmagan.",
        "Ikkinchi naqsh — texnikadan ko'ra odamga qaratilgan hujumlar. Yirik farmatsevtika kompaniyasiga qilingan hujumda kirish nuqtasi telefon orqali qilingan firibgarlik (vishing) bo'ldi: xodimni ishontirib, korporativ hisobga kirish ma'lumotlari qo'lga kiritildi. Hech qanday zaiflik ishlatilmadi — shunchaki odamga ishonildi. Ko'p faktorli autentifikatsiya (MFA) bunday holatda ham to'liq himoya bermaydi, agar xodim tasdiqlash so'rovini o'zi bosib yuborsa.",
        "Uchinchi va eng yangi yo'nalish — sun'iy intellekt vositalari orqali kelayotgan ta'minot zanjiri hujumlari. Hugging Face platformasiga qaratilgan hodisa shuni ko'rsatdiki, modellar va AI-kutubxonalar ham xuddi npm yoki pip paketlari kabi hujum yo'liga aylanmoqda. Loyihangizga tashqaridan model yoki og'irliklar faylini yuklayotgan bo'lsangiz, bu ham kod yuklash bilan bir xil xavf darajasiga ega.",
        "Bu yangiliklardan o'quvchi uchun amaliy xulosa nima? Birinchidan, yamoqlarni o'rnatish jadvali xavfsizlik strategiyasining eng zerikarli, lekin eng samarali qismi bo'lib qolmoqda — ayniqsa internetga ochiq qurilmalarda. Ikkinchidan, ijtimoiy injeneriyaga qarshi himoya endi texnik emas, tashkiliy masala: xodim qanday holatda parolni hech kimga aytmasligini bilishi kerak. Uchinchidan, ta'minot zanjiri — kodingizga kiradigan har qanday tashqi narsa, jumladan AI modellari, ishonch tekshiruvidan o'tishi shart.",
        "DATA LIFE'ning Kiberxavfsizlik yo'nalishida aynan shu uchta mavzu amaliy mashg'ulotlar shaklida o'rganiladi: perimetr qurilmalarini xavfsiz sozlash, fishing va vishing stsenariylarini tanib olish, hamda loyihaga kiritilayotgan tashqi bog'liqliklarni tekshirish.",
      ].join('\n\n'),
      ru: [
        'Лето 2026 года выдалось неспокойным для кибербезопасности. Если поставить рядом крупные инциденты июля и августа, в них виден один и тот же почерк: злоумышленники попадают в сеть не через сложные эксплойты, а через устройства на периметре и доверие сотрудников.',
        'Самый заметный случай — уязвимости в VPN-устройствах SonicWall SMA серии 1000. Объединённые в цепочку, они позволяют выполнить произвольную команду на устройстве, то есть открывают путь снаружи прямо во внутреннюю сеть. С начала августа основной группой, использующей эти уязвимости, называют операцию INC Ransomware. Обратите внимание: речь не о новой, никому не известной дыре — патч вышел, но многие организации не успели его установить.',
        'Второй почерк — атаки, направленные не на технику, а на человека. В атаке на крупную фармацевтическую компанию точкой входа стал телефонный обман (вишинг): сотрудника убедили, и учётные данные корпоративной записи оказались у злоумышленников. Ни одна уязвимость не использовалась — просто человеку поверили. Многофакторная аутентификация в такой ситуации тоже не спасает полностью, если сотрудник сам подтверждает запрос.',
        'Третье и самое новое направление — атаки на цепочку поставок через инструменты искусственного интеллекта. Инцидент вокруг платформы Hugging Face показал: модели и AI-библиотеки становятся таким же вектором атаки, как пакеты npm или pip. Если вы загружаете в проект стороннюю модель или файл весов — это ровно такой же риск, как загрузка чужого кода.',
        'Какой практический вывод из этих новостей для учащегося? Во-первых, график установки патчей остаётся самой скучной, но самой результативной частью защиты — особенно на устройствах, смотрящих в интернет. Во-вторых, защита от социальной инженерии — теперь не техническая, а организационная задача: сотрудник должен понимать, в какой ситуации он не сообщает пароль никому. В-третьих, цепочка поставок: всё внешнее, что попадает в ваш код, включая AI-модели, обязано проходить проверку доверия.',
        'На направлении «Кибербезопасность» в DATA LIFE именно эти три темы разбираются на практических занятиях: безопасная настройка периметровых устройств, распознавание сценариев фишинга и вишинга, а также проверка внешних зависимостей проекта.',
      ].join('\n\n'),
      kaa: [
        "2026-jıldıń jazı kiberqáwipsizlik boyınsha tınısh kelmedi. Iyul hám avgust aylarında járiyalanģan iri waqıyalardı qatarģa qoysaq, olarda anıq bir naqıs kórinedi: hújimshiler tarmaqqa quramalı ekspluatatsiyalar menen emes, sırtqı perimetrdegi qurılmalar hám xızmetkerlerdiń isenimi arqalı kiredi.",
        "Eń kózge taslanģanı — SonicWall SMA 1000 seriyalı VPN qurılmalarındaģı ázzilikler. Olar shınjır túrinde birleskende hújimshige qurılmada qálegen buyrıqtı orınlaw múmkinshiligin beredi, yaģnıy sırttan tikkeley ishki tarmaqqa jol ashıladı. Avgust basınan berli bul ázziliklerden paydalanıp atırģan tiykarģı gruppa sıpatında INC Ransomware operatsiyası belgilendi. Itibar beriń: gáp jańa, hesh kim bilmegen tesik haqqında emes — jamaw shıqqan, biraq kóp shólkemler onı ornatıwģa úlgermegen.",
        "Ekinshi naqıs — texnikadan kóre adamģa qaratılģan hújimler. Iri farmatsevtika kompaniyasına qılınģan hújimde kiriw noqatı telefon arqalı qılınģan aldawshılıq (vishing) boldı: xızmetkerdi isendirip, korporativ esap maģlıwmatları qolģa kirgizildi. Hesh qanday ázzilik islatilmedi — ápiwayı ģana adamģa isenildi. Kóp faktorlı autentifikatsiya (MFA) bunday jaģdayda da tolıq qorģaw bermeydi, eger xızmetker tastıyıqlaw soraw'ın ózi basıp jiberse.",
        "Úshinshi hám eń jańa baģdar — jasalma intellekt qurallları arqalı kelip atırģan támiyinlew shınjırı hújimleri. Hugging Face platformasına qaratılģan waqıya sonı kórsetti: modeller hám AI-kitapxanaları da npm yaki pip paketleri sıyaqlı hújim jolına aylanbaqta. Joybarıńızģa sırttan model yaki awırlıqlar faylın júklep atırģan bolsańız, bul da kod júklew menen birdey qáwip dárejesine iye.",
        "Bul jańalıqlardan oqıwshı ushın ámeliy juwmaq ne? Birinshiden, jamawlardı ornatıw kestesi qáwipsizlik strategiyasınıń eń zerigerli, biraq eń nátiyjeli bólegi bolıp qalmaqta — ásirese internetke ashıq qurılmalarda. Ekinshiden, sotsiallıq injeneriyaģa qarsı qorģaw endi texnikalıq emes, shólkemlestiriw máselesi: xızmetker qanday jaģdayda paroldı hesh kimge aytpaytuģının biliwi kerek. Úshinshiden, támiyinlew shınjırı — kodıńızģa kiretuģın hár qanday sırtqı nárse, sonıń ishinde AI modelleri, isenim tekseriwinen ótiwi shárt.",
        "DATA LIFE'tıń Kiberqáwipsizlik baģdarında dál usı úsh tema ámeliy shınıģıwlar túrinde úyreniledi: perimetr qurılmaların qáwipsiz sazlaw, fishing hám vishing stsenariyların tanıp alıw, hám de joybarģa kirgizilip atırģan sırtqı ģárezliklerdi tekseriw.",
      ].join('\n\n'),
      en: [
        'The summer of 2026 has been anything but quiet in security. Line up the major incidents disclosed in July and August and the same signature appears in all of them: attackers are not breaking in with exotic exploits, they are walking in through perimeter devices and employee trust.',
        'The most visible case is the set of vulnerabilities in SonicWall SMA 1000 series VPN appliances. Chained together, they allow arbitrary command execution on the device — a direct path from the outside into the internal network. Since the start of August, the INC Ransomware operation has been named as the dominant actor exploiting them. Note the detail that matters: this was not an unknown hole. A patch existed; many organisations simply had not installed it yet.',
        'The second signature is attacks aimed at people rather than technology. In the intrusion at a major pharmaceutical company, the entry point was a voice phishing call: an employee was persuaded, and corporate single sign-on credentials changed hands. No vulnerability was used at all. Multi-factor authentication does not fully close this gap either, if the employee approves the prompt themselves.',
        'The third and newest direction is supply chain attacks arriving through AI tooling. The incident around the Hugging Face platform showed that models and AI libraries are becoming an attack path in exactly the way npm and pip packages already are. If you pull a third-party model or weights file into your project, you are taking on the same class of risk as pulling in someone else’s code.',
        'What is the practical takeaway for a student? First, a patching schedule remains the most boring and most effective part of any security strategy, especially for internet-facing devices. Second, defending against social engineering is now an organisational problem rather than a technical one: staff need to know the situations in which they never hand over a credential. Third, the supply chain — anything external that enters your code, AI models included — has to pass a trust check.',
        'These are exactly the three themes covered as hands-on work in the Cybersecurity track at DATA LIFE: hardening perimeter devices, recognising phishing and vishing scenarios, and vetting the external dependencies a project brings in.',
      ].join('\n\n'),
    },
  },

  // ------------------------------------------------------------------ 2. Sun'iy intellekt
  {
    category: 'AI',
    iconKey: 'Brain',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    readMinutes: 6,
    tags: ["Sun'iy intellekt", 'LLM', 'Agentlar'],
    title: {
      uz: "Iyul oyi model to'lqini: bir haftada yettita chiqarilish nimani anglatadi",
      ru: 'Июльская волна моделей: что означают семь релизов за одну неделю',
      kaa: "Iyul ayı model tolqını: bir háptede jeti shıģarılıw nedi ańlatadı",
      en: 'July’s model wave: what seven releases in one week actually mean',
    },
    excerpt: {
      uz: "OpenAI, Google, Meta, Anthropic va xAI bir oy ichida yangi modellar chiqardi. Eng muhim o'zgarish esa modelning o'zida emas — dasturchi ular bilan qanday ishlashida.",
      ru: 'OpenAI, Google, Meta, Anthropic и xAI выпустили новые модели за один месяц. Но главное изменение — не в самих моделях, а в том, как с ними теперь работает разработчик.',
      kaa: "OpenAI, Google, Meta, Anthropic hám xAI bir ay ishinde jańa modeller shıģardı. Eń áhmiyetli ózgeris bolsa modeldiń ózinde emes — proqrammistiniń olar menen qalay islewinde.",
      en: 'OpenAI, Google, Meta, Anthropic and xAI all shipped new models within a month. The important shift is not in the models themselves but in how developers now work with them.',
    },
    content: {
      uz: [
        "2026-yilning iyul oyi sun'iy intellekt sohasida g'ayrioddiy zich bo'ldi. Bir necha kun ichida yirik laboratoriyalarning deyarli barchasi yangi model yoki katta yangilanish e'lon qildi: OpenAI GPT-5.6 ni bitta model emas, uchta variantdan iborat qator sifatida chiqardi; Google Gemini 3.6 Flash oilasini yangiladi; xAI Grok 4.5 ni biznes va kod yozish vazifalariga yo'naltirdi; Meta esa Muse Spark modelini birinchi marta yopiq hamkorlik doirasidan chiqarib, ochiq to'lovli API sifatida taqdim etdi.",
        "Ochiq og'irlikli modellar tomonida ham harakat kuchli bo'ldi — Moonshot kompaniyasining Kimi K3 modeli hozirgacha ochiq chiqarilgan eng katta model bo'lib qayd etildi. Bu shuni anglatadiki, kuchli modellar endi faqat bir nechta yirik kompaniyaning serverlarida qulflanib qolmayapti.",
        "Ammo o'quvchi uchun eng muhim xabar model nomlari emas. Diqqat bilan qarasangiz, iyul oyidagi e'lonlarning aksariyati modelning o'zi haqida emas, uning ATROFIDAGI infratuzilma haqida edi: to'lovli model API'lari, boshqariladigan agent xizmatlari, tezlashtirilgan hisoblash kutubxonalari. Ya'ni soha \"qaysi model aqlliroq\" bosqichidan \"bu modelni ishlab turgan tizimga qanday ulash mumkin\" bosqichiga o'tdi.",
        "Buning dasturchi uchun amaliy ma'nosi bor. Bir yil oldin AI bilan ishlash ko'pincha chat oynasiga savol yozishdan iborat edi. Bugun esa talab qilinadigan ko'nikma boshqacha: modelni o'z tizimingizga API orqali ulash, unga vositalar (tool) berish, javobini tekshirish, xatolarni ushlash va xarajatni hisoblash. Bu allaqachon oddiy backend muhandisligi ishi — faqat javob ehtimollik asosida kelishini hisobga olish kerak.",
        "Ikkinchi amaliy xulosa: modellar tez almashadi, tanlov esa arzonlashadi. Bir necha oy oldin qimmat hisoblangan sifat bugun arzonroq modelda mavjud bo'lishi mumkin. Shuning uchun kodni bitta modelga qattiq bog'lab qo'ymaslik — provayderni almashtirish oson bo'ladigan qatlam yozish — endi yaxshi amaliyot emas, zaruriyat.",
        "Va nihoyat, xavfsizlik tomoni: agentlar mustaqil harakat qila boshlagani sari ularning nima qila olishini cheklash masalasi dolzarblashdi. Bu haqda kiberxavfsizlik bo'yicha maqolamizda ham yozgan edik — AI vositalari endi ta'minot zanjirining bir qismi.",
      ].join('\n\n'),
      ru: [
        'Июль 2026 года выдался в области искусственного интеллекта необычно плотным. За считанные дни почти все крупные лаборатории объявили о новой модели или большом обновлении: OpenAI выпустила GPT-5.6 не как одну модель, а как линейку из трёх вариантов; Google обновила семейство Gemini 3.6 Flash; xAI направила Grok 4.5 на бизнес-задачи и написание кода; Meta же впервые вывела модель Muse Spark за рамки закрытого партнёрства, представив её как платный открытый API.',
        'На стороне моделей с открытыми весами движение тоже было заметным — Kimi K3 от Moonshot был отмечен как крупнейшая открытая модель на сегодняшний день. Это значит, что сильные модели перестают быть заперты на серверах нескольких крупных компаний.',
        'Но главная новость для учащегося — не названия моделей. Присмотритесь: большая часть июльских анонсов была не о самой модели, а об инфраструктуре ВОКРУГ неё: платные API моделей, управляемые агентские сервисы, ускоренные вычислительные библиотеки. Отрасль перешла со стадии «какая модель умнее» на стадию «как подключить эту модель к работающей системе».',
        'Для разработчика у этого есть практический смысл. Год назад работа с ИИ чаще всего сводилась к вопросу в окне чата. Сегодня требуется другой навык: подключить модель к своей системе через API, дать ей инструменты, проверить ответ, обработать ошибки и посчитать стоимость. Это уже обычная backend-инженерия — с поправкой на то, что ответ приходит вероятностный.',
        'Второй практический вывод: модели быстро сменяют друг друга, а выбор дешевеет. Качество, которое несколько месяцев назад считалось дорогим, сегодня может быть доступно на более дешёвой модели. Поэтому не привязывать код жёстко к одной модели — писать слой, позволяющий легко сменить провайдера — теперь не хорошая практика, а необходимость.',
        'И наконец, сторона безопасности: чем самостоятельнее действуют агенты, тем острее вопрос ограничения их возможностей. Об этом мы писали и в статье по кибербезопасности — инструменты ИИ теперь часть цепочки поставок.',
      ].join('\n\n'),
      kaa: [
        "2026-jıldıń iyul ayı jasalma intellekt tarawında áddettegiden zıq boldı. Birneshe kún ishinde iri laboratoriyalardıń deerlik barlıģı jańa model yaki úlken jańalanıw járiyaladı: OpenAI GPT-5.6 nı bir model emes, úsh variannan ibarat qatar sıpatında shıģardı; Google Gemini 3.6 Flash shańaraģın jańaladı; xAI Grok 4.5 ti biznes hám kod jazıw wazıypalarına baģdarladı; Meta bolsa Muse Spark modelin birinshi ret jabıq sheriklik shegarasınan shıģarıp, ashıq tólemli API sıpatında usınıs etti.",
        "Ashıq awırlıqlı modeller tárepinde de háreket kúshli boldı — Moonshot kompaniyasınıń Kimi K3 modeli házirgishe ashıq shıģarılģan eń úlken model bolıp belgilendi. Bul kúshli modeller endi tek birneshe iri kompaniyanıń serverlerinde qulıplanıp qalmaytuģının ańlatadı.",
        "Biraq oqıwshı ushın eń áhmiyetli xabar model atları emes. Itibar berip qarasańız, iyul ayındaģı járiyalawlardıń kópshiligi modeldiń ózi haqqında emes, onıń ÁTIRAPINDAĢI infrastruktura haqqında edi: tólemli model API'ları, basqarılatuģın agent xızmetleri, tezlestirilgen esaplaw kitapxanaları. Yaģnıy taraw \"qaysı model aqıllıraq\" basqıshınan \"bul modeldi islep turģan sistemaģa qalay jalģaw múmkin\" basqıshına ótti.",
        "Bunıń proqrammist ushın ámeliy mánisi bar. Bir jıl aldın AI menen islew kóbinese chat aynasına soraw jazıwdan ibarat edi. Búgin bolsa talap etiletuģın kónlikpe basqasha: modeldi óz sistemańızģa API arqalı jalģaw, oģan qurallar (tool) beriw, juwabın tekseriw, qátelerdi uslaw hám qárejetti esaplaw. Bul ápiwayı backend injenerlik jumısı — tek juwap itimallıq tiykarında keletuģının esapqa alıw kerek.",
        "Ekinshi ámeliy juwmaq: modeller tez almasadı, tańlaw bolsa arzanlaydı. Birneshe ay aldın qımbat esaplanģan sapa búgin arzanıraq modelde bar bolıwı múmkin. Sonlıqtan kodtı bir modelge qattı baylap qoymaw — provayderdi almastırıw ańsat bolatuģın qatlam jazıw — endi jaqsı ámeliyat emes, zárúrlik.",
        "Hám aqırında, qáwipsizlik tárepi: agentler ģárezsiz háreket ete baslaģan sayın olardıń ne isley alatuģının sheklew máselesi áhmiyetli boldı. Bul haqqında kiberqáwipsizlik boyınsha maqalamızda da jazģan edik — AI qurallları endi támiyinlew shınjırınıń bir bólegi.",
      ].join('\n\n'),
      en: [
        'July 2026 was unusually dense in AI. Within days, nearly every major lab announced a new model or a significant update: OpenAI shipped GPT-5.6 not as a single model but as a lineup of three variants; Google refreshed the Gemini 3.6 Flash family; xAI aimed Grok 4.5 squarely at business and coding work; and Meta moved its Muse Spark model out of private partner preview into a paid, openly available API.',
        'The open-weights side was just as busy — Moonshot’s Kimi K3 was recorded as the largest openly released model to date. Strong models are no longer locked inside the server rooms of a handful of companies.',
        'But the headline for a student is not the model names. Look closely and most of July’s announcements were not about the model at all — they were about the infrastructure AROUND it: paid model APIs, managed agent services, faster compute libraries. The field has moved from "which model is smarter" to "how do I wire this model into a system that is already running".',
        'That shift has a practical meaning for developers. A year ago, working with AI mostly meant typing a question into a chat box. The skill in demand today is different: connect the model to your own system over an API, give it tools, validate what comes back, handle failures and account for cost. This is ordinary backend engineering — with the twist that the answer arrives probabilistically.',
        'A second takeaway: models are replaced quickly and the choice keeps getting cheaper. Quality that was expensive a few months ago may be available on a cheaper model today. Not hard-wiring your code to a single model — writing a layer that lets you swap providers — is no longer good practice, it is a requirement.',
        'Finally, the security angle: the more independently agents act, the more pressing it becomes to limit what they are able to do. We covered this in our cybersecurity article as well — AI tooling is now part of the supply chain.',
      ].join('\n\n'),
    },
  },

  // ------------------------------------------------------------------ 3. Dasturlash
  {
    category: 'Career',
    iconKey: 'Cpu',
    color: '#0ea5e9',
    bg: '#f0f9ff',
    border: '#bae6fd',
    readMinutes: 6,
    tags: ['Python', 'TypeScript', 'Rust'],
    title: {
      uz: "2026-yilda qaysi dasturlash tilini o'rganish kerak: raqamlar nima deydi",
      ru: 'Какой язык программирования учить в 2026 году: что говорят цифры',
      kaa: "2026-jılda qaysı proqrammalastırıw tilin úyreniw kerek: sanlar ne deydi",
      en: 'Which programming language to learn in 2026: what the numbers say',
    },
    excerpt: {
      uz: "Python reytinglarda birinchi, JavaScript amalda eng ko'p ishlatiladi, TypeScript esa jimgina birinchi o'ringa chiqdi. Bu uchta raqam bir-biriga zid emas — ular uch xil savolga javob beradi.",
      ru: 'Python первый в рейтингах, JavaScript чаще всего используют на практике, а TypeScript тихо вышел на первое место. Эти три цифры не противоречат друг другу — они отвечают на три разных вопроса.',
      kaa: "Python reytinglerde birinshi, JavaScript ámelde eń kóp isletiledi, TypeScript bolsa tınıshģana birinshi orınģa shıqtı. Bul úsh san bir-birine qarsı emes — olar úsh túrli sorawģa juwap beredi.",
      en: 'Python leads the rankings, JavaScript is the most used in practice, and TypeScript quietly took first place. The three numbers do not contradict each other — they answer three different questions.',
    },
    content: {
      uz: [
        "\"Qaysi tilni o'rganay?\" — bu savol markazimizga eng ko'p keladigan savol. 2026-yilning yozidagi raqamlarga qarab, unga aniqroq javob berish mumkin. Lekin avval bir narsani tushunib olish kerak: turli reytinglar turli narsani o'lchaydi va shuning uchun ular \"qarama-qarshi\" ko'rinadi.",
        "TIOBE indeksining 2026-yil iyul ma'lumotlariga ko'ra Python taxminan 18.94% bilan birinchi o'rinda, ortidan C, C++ va tez o'sayotgan Rust bormoqda. Ammo TIOBE qidiruv so'rovlari asosida qiziqishni o'lchaydi — ya'ni bu \"eng ko'p gaplashiladigan til\" reytingi.",
        "Amaliyotga qarasak manzara boshqacha: dasturchilar so'rovnomalari bo'yicha JavaScript taxminan 66% bilan eng ko'p ishlatiladigan til bo'lib qolmoqda. Bu \"eng ko'p yoziladigan til\" raqami — chunki veb hamon eng katta platforma.",
        "Uchinchi raqam eng qiziqarlisi: TypeScript GitHub'da hissa qo'shuvchilar soni bo'yicha birinchi o'ringa chiqdi va Python bilan JavaScript'ni ortda qoldirdi. Bu tasodif emas. AI yordamida kod yozish odatiy holga aylangani sari, tip xavfsizligi qadrliroq bo'lib bormoqda: model tez kod yozadi, lekin uning xatosini kompilyator ushlashi kerak. Ya'ni TypeScript'ning ko'tarilishi AI davrining bevosita natijasi.",
        "Boshlovchi uchun amaliy tavsiya shundan kelib chiqadi. Agar maqsadingiz veb — JavaScript'dan boshlang va imkon qadar tezroq TypeScript'ga o'ting; bugungi ish e'lonlarida ular deyarli har doim birga so'raladi. Agar maqsadingiz ma'lumotlar tahlili yoki sun'iy intellekt — Python birinchi tanlov bo'lib qolmoqda, chunki bu sohaning butun asboblar to'plami shu tilda yozilgan. Agar tizim darajasidagi ish, tezlik va xotira nazorati qiziqtirsa — Rust'ning o'sishi tasodifiy emas, lekin uni birinchi til sifatida tanlamaslikni maslahat beramiz.",
        "Yana bir eslatma: Python 3.15 hozir alfa bosqichida va barqaror versiyasi 2026-yil oktabrida kutilmoqda. Yangi versiyani kutib o'tirishning hojati yo'q — hozir o'rganganingiz o'sha versiyada ham to'liq ishlaydi.",
        "Va eng muhimi: til — vosita. Ish beruvchi sizdan sintaksisni emas, masalani yecha olishni so'raydi. Bitta tilni chuqur o'rgangan odam ikkinchisiga bir necha haftada o'tadi; beshta tilni yuzaki bilgan odam esa hech qaysisida ishonchli emas.",
      ].join('\n\n'),
      ru: [
        '«Какой язык учить?» — самый частый вопрос, который нам задают. По цифрам лета 2026 года на него можно ответить точнее. Но сперва стоит понять одно: разные рейтинги измеряют разное, поэтому и выглядят противоречивыми.',
        'По данным индекса TIOBE за июль 2026 года Python занимает первое место примерно с 18,94%, следом идут C, C++ и быстро растущий Rust. Однако TIOBE измеряет интерес по поисковым запросам — то есть это рейтинг «языка, о котором больше всего говорят».',
        'На практике картина другая: по опросам разработчиков самым используемым языком остаётся JavaScript — около 66%. Это цифра «языка, на котором больше всего пишут», потому что веб по-прежнему самая большая платформа.',
        'Третья цифра — самая интересная: TypeScript вышел на первое место на GitHub по числу контрибьюторов, обогнав и Python, и JavaScript. Это не случайность. По мере того как написание кода с помощью ИИ становится нормой, типобезопасность ценится всё выше: модель пишет быстро, но её ошибку должен поймать компилятор. Подъём TypeScript — прямое следствие эпохи ИИ.',
        'Отсюда практический совет для начинающего. Если цель — веб, начинайте с JavaScript и как можно раньше переходите на TypeScript; в сегодняшних вакансиях их почти всегда просят вместе. Если цель — анализ данных или искусственный интеллект, первым выбором остаётся Python: весь инструментарий этой области написан на нём. Если вас тянет к системному уровню, скорости и контролю над памятью — рост Rust не случаен, но первым языком мы его брать не советуем.',
        'Ещё одно замечание: Python 3.15 сейчас на стадии альфы, стабильный релиз ожидается в октябре 2026 года. Ждать новую версию не нужно — то, что вы учите сейчас, будет полностью работать и в ней.',
        'И самое главное: язык — это инструмент. Работодатель спрашивает с вас не синтаксис, а умение решить задачу. Человек, глубоко выучивший один язык, переходит на второй за несколько недель; человек, поверхностно знающий пять, не уверен ни в одном.',
      ].join('\n\n'),
      kaa: [
        "\"Qaysı tildi úyreneyin?\" — bul soraw orayımızģa eń kóp keletuģın soraw. 2026-jıldıń jazındaģı sanlarģa qarap, oģan anıģıraq juwap beriw múmkin. Biraq aldın bir nárseni túsinip alıw kerek: túrli reytingler túrli nárseni ólshaydi hám sonlıqtan olar \"qarama-qarsı\" kórinedi.",
        "TIOBE indeksiniń 2026-jıl iyul maģlıwmatlarına muwapıq Python shama menen 18.94% penen birinshi orında, artınan C, C++ hám tez ósip atırģan Rust barmaqta. Biraq TIOBE izlew soraw'ları tiykarında qızıģıwshılıqtı ólshaydi — yaģnıy bul \"eń kóp gápleseletuģın til\" reytingi.",
        "Ámeliyatqa qarasaq kórinis basqasha: proqrammistler soraw'namaları boyınsha JavaScript shama menen 66% penen eń kóp isletiletuģın til bolıp qalmaqta. Bul \"eń kóp jazılatuģın til\" sanı — sebebi veb áli de eń úlken platforma.",
        "Úshinshi san eń qızıqlısı: TypeScript GitHub'ta úles qosıwshılar sanı boyınsha birinshi orınģa shıqtı hám Python penen JavaScript'ti artta qaldırdı. Bul tosınnan emes. AI járdeminde kod jazıw áddettegi jaģdayģa aylanģan sayın, tip qáwipsizligi qımbatıraq bolıp barmaqta: model tez kod jazadı, biraq onıń qátesin kompilyator uslawı kerek. Yaģnıy TypeScript'tıń kóterilisi AI dáwiriniń tikkeley nátiyjesi.",
        "Baslawshı ushın ámeliy usınıs sonnan kelip shıģadı. Eger maqsetińiz veb bolsa — JavaScript'ten baslań hám múmkinshiligińiz barınsha tezirek TypeScript'ke ótiń; búgingi jumıs járiyalawlarında olar deerlik hámme waqıt birge soraladı. Eger maqsetińiz maģlıwmatlar analizi yaki jasalma intellekt bolsa — Python birinshi tańlaw bolıp qalmaqta, sebebi bul tarawdıń pútkil qurallar toplamı usı tilde jazılģan. Eger sistema dárejesindegi jumıs, tezlik hám yad qadaģalawı qızıqtırsa — Rust'tıń ósiwi tosınnan emes, biraq onı birinshi til sıpatında tańlamawdı máslahát beremiz.",
        "Taģı bir eskertiw: Python 3.15 házir alfa basqıshında hám turaqlı versiyası 2026-jıl oktyabrinde kútilmekte. Jańa versiyanı kútip otırıwdıń kereginshesi joq — házir úyrengenińiz sol versiyada da tolıq isleydi.",
        "Hám eń áhmiyetlisi: til — qural. Jumıs beriwshi sizden sintaksisti emes, máseleni shesh alıwdı soraydı. Bir tildi tereń úyrengen adam ekinshisine birneshe hápte ishinde ótedi; bes tildi ústirtin bilgen adam bolsa hesh qaysısında isenimli emes.",
      ].join('\n\n'),
      en: [
        '"Which language should I learn?" is the question we are asked most often. The numbers from summer 2026 let us answer it more precisely. But first, one thing has to be clear: different rankings measure different things, which is why they look contradictory.',
        'According to the TIOBE index for July 2026, Python leads with roughly 18.94%, followed by C, C++ and a fast-rising Rust. TIOBE, however, measures interest through search activity — it is a ranking of the language people talk about most.',
        'In practice the picture differs: developer surveys still put JavaScript first in actual use, at around 66%. That is the "most written" number, because the web remains the largest platform.',
        'The third number is the most interesting one: TypeScript reached first place on GitHub by contributor count, passing both Python and JavaScript. This is not an accident. As AI-assisted coding becomes standard, type safety gains value: the model writes quickly, but the compiler has to catch its mistakes. The rise of TypeScript is a direct consequence of the AI era.',
        'The practical advice for a beginner follows from that. If your goal is the web, start with JavaScript and move to TypeScript as early as you can; today’s job postings almost always ask for both together. If your goal is data or AI, Python remains the first choice — the entire toolkit of that field is written in it. If systems-level work, speed and memory control appeal to you, the growth of Rust is no accident, though we would not recommend it as a first language.',
        'One more note: Python 3.15 is currently in alpha, with a stable release expected in October 2026. There is no reason to wait for it — what you learn now will work exactly the same there.',
        'And most importantly: a language is a tool. An employer does not test you on syntax, but on whether you can solve the problem. Someone who has learned one language deeply moves to a second in a few weeks; someone who knows five superficially is confident in none.',
      ].join('\n\n'),
    },
  },
];

/** Login'dan olingan sessiya cookie'si — keyingi so'rovlarga qo'lda qo'shiladi */
let sessionCookie = '';

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API}/api${path}`, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  return res;
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

async function login(): Promise<void> {
  const res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Admin sifatida kirib bo'lmadi (${res.status}): ${await readError(res)}`);
  }

  // Auth token HttpOnly cookie'da keladi — uni ushlab qolamiz, aks holda
  // keyingi POST so'rovlar 401 oladi
  const raw = res.headers.getSetCookie?.() ?? [];
  sessionCookie = raw.map((c) => c.split(';')[0]).join('; ');
  if (!sessionCookie) {
    throw new Error("Login muvaffaqiyatli, lekin sessiya cookie'si qaytmadi");
  }

  const me = await res.json().catch(() => null);
  const role = me?.data?.user?.role ?? me?.data?.role;
  if (role !== 'ADMIN') {
    throw new Error(`${ADMIN_EMAIL} hisobi ADMIN emas (roli: ${role ?? 'noma\'lum'})`);
  }
  console.log(`Admin sifatida kirildi: ${ADMIN_EMAIL} → ${API}\n`);
}

/** Bazadagi mavjud maqolalarning slug'lari — takror chiqarmaslik uchun */
async function existingSlugs(): Promise<Set<string>> {
  const res = await api('/blog/admin');
  if (!res.ok) {
    throw new Error(`Mavjud maqolalarni o'qib bo'lmadi: ${await readError(res)}`);
  }
  const body = await res.json();
  const items: { slug: string }[] = body?.data?.items ?? body?.data ?? [];
  return new Set(items.map((p) => p.slug));
}

async function main(): Promise<void> {
  if (!DRY_RUN && !ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD berilmagan. Masalan: $env:ADMIN_PASSWORD='...'; npm run publish:blog-news");
  }

  if (DRY_RUN) {
    console.log(`DRY RUN — ${API} ga hech narsa yuborilmaydi\n`);
    for (const post of POSTS) console.log(`  chiqarilardi: ${post.title.uz}`);
    console.log(`\nJami ${POSTS.length} ta maqola.`);
    return;
  }

  await login();
  const taken = await existingSlugs();

  let published = 0;
  let skipped = 0;

  // Teskari tartibda: ro'yxatdagi oxirgi (eng eski) maqola birinchi chiqadi,
  // shunda saytda birinchi maqola eng tepada turadi
  for (const post of [...POSTS].reverse()) {
    // Slug'ni backend title.uz dan hosil qiladi — shu yerda ham AYNAN o'sha
    // funksiya bilan hisoblaymiz va bandligini OLDINDAN tekshiramiz. Aks holda
    // qayta ishga tushirilganda backend oxiriga "-2" qo'shib nusxa yaratardi.
    const slug = slugify(post.title.uz);
    if (taken.has(slug)) {
      console.log(`  o'tkazib yuborildi (allaqachon bor): ${slug}`);
      skipped += 1;
      continue;
    }

    const res = await api('/blog', {
      method: 'POST',
      body: JSON.stringify({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        iconKey: post.iconKey,
        color: post.color,
        bg: post.bg,
        border: post.border,
        readMinutes: post.readMinutes,
        tags: post.tags,
        published: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`"${post.title.uz}" chiqarilmadi: ${await readError(res)}`);
    }

    const body = await res.json();
    console.log(`  chiqarildi: ${body?.data?.slug ?? slug}`);
    published += 1;
  }

  console.log(`\nJami: ${published} ta chiqarildi, ${skipped} ta o'tkazib yuborildi.`);
}

main().catch((err) => {
  console.error(`\nXATO: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
