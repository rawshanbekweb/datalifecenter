/**
 * Qatlamlar tartibi (z-index).
 *
 * NEGA BITTA JOYDA: qiymatlar har bir komponentda qo'lda yozilganda tartib
 * jimgina buzilardi — kurs so'rovi modali 70 da, sayt header'i esa 100 da
 * edi, ya'ni modal ochilganda header uning USTIDA qolib ketardi. Bunday
 * xatoni ko'zdan kechirib topish qiyin: raqamlar alohida-alohida to'g'ri
 * ko'rinadi, faqat solishtirilgandagina noto'g'riligi bilinadi.
 *
 * Yangi qatlam kerak bo'lsa shu yerga qo'shing va oraliq raqam tanlang —
 * qiymatlar ataylab siyrak (100 lik qadam) qoldirilgan.
 */
export const Z = {
  /** Sahifa ichida yopishib turadigan panellar (masalan saqlash paneli) */
  stickyBar: 20,
  /** Kabinet (admin/mentor/talaba) header'i — sahifa kontenti ustida yopishadi */
  cabinetHeader: 30,
  /** Sahifa ichidagi suzuvchi elementlar: "yuqoriga" tugmasi va h.k. */
  floating: 99,
  /**
   * Mobil menyu paneli — ATAYIN header'dan PAST.
   * Panel header ostidan (top: 70) ochiladi va u bilan biroz kesishadi;
   * pastda turgani uchun header hamisha to'liq ko'rinadi.
   */
  siteMenu: 99,
  /** Sayt header'i — sahifa kontenti ustida turadi */
  header: 100,
  /** Header menyusi ostidagi ko'rinmas qoplama (tashqariga bosilganda yopadi) */
  headerMenuBackdrop: 199,
  /** Header ichidan ochiladigan menyular (til tanlash, bildirishnomalar) */
  headerMenu: 200,
  /** Kabinet yon paneli va uning fon qoplamasi */
  sidebarOverlay: 490,
  sidebar: 500,
  /** Modal oynalar — HAR DOIM header'dan yuqorida */
  modal: 1000,
  /** Tasdiqlash oynasi: modal ICHIDAN ham chaqiriladi, shuning uchun undan yuqori */
  confirm: 8000,
  /** Qalqib chiquvchi xabarlar — hamma narsadan yuqori */
  toast: 9000,
  /** Server uyg'onmoqda banneri — toast bilan bir darajada, lekin pastda turadi */
  banner: 9000,
  /**
   * Sayt ochilishidagi splash ekrani — hammasidan tepada.
   * U yuklanish tugagach yo'qoladi, shuning uchun boshqa qatlamlar bilan
   * raqobatlashmaydi; qiymati eng yuqori bo'lishi kifoya.
   */
  splash: 9999,
} as const;
