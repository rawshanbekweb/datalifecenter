/**
 * Server xato xabarlarining tarjima lug'ati.
 *
 * NEGA KERAK: sayt interfeysi to'liq 4 tilda (frontend/src/locales), lekin
 * backend tashlaydigan har bir xato o'zbekcha matn edi va u frontend'da
 * `err.message` sifatida to'g'ridan-to'g'ri ekranga chiqadi (41 ta joyda).
 * Ya'ni qoraqalpoq tilida saytga kirgan mehmon parolni xato tersa o'zbekcha
 * "Email yoki parol noto'g'ri" ni ko'rardi — sayt asosiy tili kaa bo'lgani
 * uchun bu eng ko'p uchraydigan yo'l edi.
 *
 * NEGA KALIT — MATNNING O'ZI, kod emas:
 * 221 ta `ApiError` chaqiruvining atigi ~40 tasida o'ziga xos `code` bor,
 * qolganlari umumiy NOT_FOUND/FORBIDDEN/CONFLICT ga tushadi — "Kurs topilmadi"
 * bilan "Foydalanuvchi topilmadi" bitta kodga ega. Shuning uchun kalit sifatida
 * o'zbekcha matn olinadi (gettext'dagi kabi): bitta ham chaqiruv joyini
 * o'zgartirmasdan hammasi tarjima bo'ladi.
 *
 * DRIFT XAVFI va uning yechimi: matn kalit bo'lgani uchun manbadagi xabarni
 * tahrirlash tarjimani "jimgina" uzib qo'yishi mumkin. Buni
 * `tests/errorMessages.test.ts` ushlaydi — u manbadagi barcha xabarlarni
 * yig'ib, shu lug'atda borligini tekshiradi.
 *
 * APOSTROF: kodda ' (ASCII) va ‘ (U+2018) aralash ishlatilgan — kalitlar
 * `normalizeMessageKey` orqali ASCII ' ga keltiriladi, shuning uchun bu yerda
 * hamma joyda faqat ASCII ' yoziladi.
 *
 * TARJIMASI YO'Q xabar o'zbekcha holida qaytadi (masalan validatorlardagi
 * shablondan yig'iladigan "Kamida bitta {x} kerak" turidagi matnlar).
 */

export interface ErrorTranslation {
  ru: string;
  kaa: string;
  en: string;
}

export const ERROR_MESSAGES: Record<string, ErrorTranslation> = {
  // ── Umumiy / ApiError standart matnlari ───────────────────────────────────
  'Autentifikatsiya talab qilinadi': {
    ru: 'Требуется аутентификация',
    kaa: 'Autentifikaciya talap etiledi',
    en: 'Authentication is required',
  },
  "Ruxsat yo'q": {
    ru: 'Доступ запрещён',
    kaa: 'Ruqsat joq',
    en: 'Access denied',
  },
  Topilmadi: {
    ru: 'Не найдено',
    kaa: 'Tabılmadı',
    en: 'Not found',
  },
  'Serverda xatolik yuz berdi': {
    ru: 'Произошла ошибка на сервере',
    kaa: 'Serverde qátelik júz berdi',
    en: 'A server error occurred',
  },
  "Sessiya eskirgan. Qaytadan kiring.": {
    ru: 'Сессия устарела. Войдите заново.',
    kaa: 'Sessiya eskirgen. Qaytadan kiriń.',
    en: 'Your session has expired. Please sign in again.',
  },
  "Uzoq vaqt harakat bo'lmagani uchun tizimdan chiqarildingiz": {
    ru: 'Вы вышли из системы из-за длительного бездействия',
    kaa: 'Uzaq waqıt háreket bolmaǵanı ushın sistemadan shıǵarıldıńız',
    en: 'You were signed out due to a long period of inactivity',
  },
  "So'rov yuborish uchun avval emailingizni tasdiqlang": {
    ru: 'Чтобы отправить заявку, сначала подтвердите email',
    kaa: "Soraw jiberiw ushın aldın emailińizdi tastıyıqlań",
    en: 'Please verify your email before sending a request',
  },
  'Seans topilmadi': {
    ru: 'Сессия не найдена',
    kaa: 'Seans tabılmadı',
    en: 'Session not found',
  },
  "Token yaroqsiz yoki muddati o'tgan": {
    ru: 'Токен недействителен или истёк',
    kaa: 'Token jaramsız yaki múddeti ótken',
    en: 'The token is invalid or has expired',
  },
  "So'rov manbai (Origin) ruxsat etilmagan": {
    ru: 'Источник запроса (Origin) не разрешён',
    kaa: 'Soraw derekligi (Origin) ruqsat etilmegen',
    en: 'The request origin is not allowed',
  },
  'Qurilma identifikatori yuborilmadi': {
    ru: 'Идентификатор устройства не передан',
    kaa: 'Qurılma identifikatorı jiberilmedi',
    en: 'No device identifier was sent',
  },
  "Bir so'rovda 100 tadan ko'p element so'rab bo'lmaydi": {
    ru: 'За один запрос нельзя запросить более 100 элементов',
    kaa: 'Bir sorawda 100 nen kóp element sorap bolmaydı',
    en: 'You cannot request more than 100 items in a single request',
  },

  // ── Chastota chegarasi (rate limit) ───────────────────────────────────────
  "Juda ko'p so'rov yuborildi. Birozdan keyin qayta urinib ko'ring.": {
    ru: 'Отправлено слишком много запросов. Повторите попытку чуть позже.',
    kaa: 'Júdá kóp soraw jiberildi. Azǵana waqıttan keyin qayta urınıp kóriń.',
    en: 'Too many requests were sent. Please try again in a little while.',
  },
  "Juda ko'p so'rov. Birozdan keyin urinib ko'ring.": {
    ru: 'Слишком много запросов. Повторите чуть позже.',
    kaa: 'Júdá kóp soraw. Azǵana waqıttan keyin urınıp kóriń.',
    en: 'Too many requests. Please try again in a little while.',
  },
  "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.": {
    ru: 'Слишком много попыток. Повторите через 15 минут.',
    kaa: 'Júdá kóp urınıw. 15 minuttan keyin qayta urınıp kóriń.',
    en: 'Too many attempts. Please try again in 15 minutes.',
  },
  "Juda ko'p muvaffaqiyatsiz urinish. 15 daqiqadan keyin qayta urinib ko'ring.": {
    ru: 'Слишком много неудачных попыток. Повторите через 15 минут.',
    kaa: 'Júdá kóp sátsiz urınıw. 15 minuttan keyin qayta urınıp kóriń.',
    en: 'Too many failed attempts. Please try again in 15 minutes.',
  },
  "Juda ko'p xabar yuborildi. Birozdan keyin qayta urinib ko'ring.": {
    ru: 'Отправлено слишком много сообщений. Повторите попытку чуть позже.',
    kaa: 'Júdá kóp xabar jiberildi. Azǵana waqıttan keyin qayta urınıp kóriń.',
    en: 'Too many messages were sent. Please try again in a little while.',
  },
  "Juda ko'p xabar yuborildi. Birozdan keyin urinib ko'ring.": {
    ru: 'Отправлено слишком много сообщений. Повторите чуть позже.',
    kaa: 'Júdá kóp xabar jiberildi. Azǵana waqıttan keyin urınıp kóriń.',
    en: 'Too many messages were sent. Please try again in a little while.',
  },

  // ── Autentifikatsiya va hisob ─────────────────────────────────────────────
  "Email yoki parol noto'g'ri": {
    ru: 'Неверный email или пароль',
    kaa: 'Email yaki parol nadurıs',
    en: 'Incorrect email or password',
  },
  "Bu email allaqachon ro'yxatdan o'tgan": {
    ru: 'Этот email уже зарегистрирован',
    kaa: 'Bul email aldın dizimnen ótken',
    en: 'This email is already registered',
  },
  'Hisob topilmadi': {
    ru: 'Аккаунт не найден',
    kaa: 'Esap tabılmadı',
    en: 'Account not found',
  },
  'Foydalanuvchi topilmadi': {
    ru: 'Пользователь не найден',
    kaa: 'Paydalanıwshı tabılmadı',
    en: 'User not found',
  },
  'Hisobingiz bloklangan. Administratorga murojaat qiling.': {
    ru: 'Ваш аккаунт заблокирован. Обратитесь к администратору.',
    kaa: 'Esabıńız bloklanǵan. Administratorǵa múrájat etiń.',
    en: 'Your account is blocked. Please contact an administrator.',
  },
  'Bu telefon raqami bilan hisob ochish chegarasi tugagan. Administratorga murojaat qiling.': {
    ru: 'Достигнут лимит регистраций с этим номером телефона. Обратитесь к администратору.',
    kaa: 'Bul telefon nomeri menen esap ashıw shegarasına jetildi. Administratorǵa múrájat etiń.',
    en: 'The account limit for this phone number has been reached. Please contact an administrator.',
  },
  'Email allaqachon tasdiqlangan': {
    ru: 'Email уже подтверждён',
    kaa: 'Email aldın tastıyıqlanǵan',
    en: 'The email is already verified',
  },
  "Joriy parol noto'g'ri": {
    ru: 'Текущий пароль неверен',
    kaa: 'Ámeldegi parol nadurıs',
    en: 'The current password is incorrect',
  },
  "Havola yaroqsiz yoki muddati o'tgan. Profil sahifasidan qayta yuborishni so'rang.": {
    ru: 'Ссылка недействительна или истекла. Запросите повторную отправку на странице профиля.',
    kaa: 'Silteme jaramsız yaki múddeti ótken. Profil betinen qayta jiberiwdi sorań.',
    en: 'The link is invalid or has expired. Request a new one from your profile page.',
  },
  "Havola yaroqsiz yoki muddati o'tgan. Parolni tiklashni qaytadan so'rang.": {
    ru: 'Ссылка недействительна или истекла. Запросите восстановление пароля заново.',
    kaa: 'Silteme jaramsız yaki múddeti ótken. Paroldı qálpine keltiriwdi qaytadan sorań.',
    en: 'The link is invalid or has expired. Request a password reset again.',
  },
  'Havola yaroqsiz yoki muddati tugagan': {
    ru: 'Ссылка недействительна или истекла',
    kaa: 'Silteme jaramsız yaki múddeti tamamlanǵan',
    en: 'The link is invalid or has expired',
  },

  // ── Foydalanuvchilarni boshqarish (admin) ─────────────────────────────────
  "O'zingizning admin huquqingizni olib tashlay olmaysiz": {
    ru: 'Нельзя снять права администратора с самого себя',
    kaa: 'Óz admin huqıqıńızdı alıp tastay almaysız',
    en: 'You cannot remove your own admin rights',
  },
  "O'zingizni bloklay olmaysiz": {
    ru: 'Нельзя заблокировать самого себя',
    kaa: 'Ózińizdi bloklay almaysız',
    en: 'You cannot block yourself',
  },
  "Admin hisobini bloklab bo'lmaydi, avval rolini o'zgartiring": {
    ru: 'Аккаунт администратора нельзя заблокировать, сначала измените его роль',
    kaa: 'Admin esabın bloklap bolmaydı, aldın rolin ózgertiń',
    en: 'An admin account cannot be blocked; change its role first',
  },
  "O'zingizni o'chira olmaysiz": {
    ru: 'Нельзя удалить самого себя',
    kaa: 'Ózińizdi óshire almaysız',
    en: 'You cannot delete yourself',
  },
  "Admin hisobini o'chirib bo'lmaydi, avval rolini o'zgartiring": {
    ru: 'Аккаунт администратора нельзя удалить, сначала измените его роль',
    kaa: 'Admin esabın óshirip bolmaydı, aldın rolin ózgertiń',
    en: 'An admin account cannot be deleted; change its role first',
  },

  // ── Kurslar ───────────────────────────────────────────────────────────────
  'Kurs topilmadi': {
    ru: 'Курс не найден',
    kaa: 'Kurs tabılmadı',
    en: 'Course not found',
  },
  'Kurs topilmadi yoki sizga biriktirilmagan': {
    ru: 'Курс не найден или не закреплён за вами',
    kaa: 'Kurs tabılmadı yaki sizge bekitilmegen',
    en: 'The course was not found or is not assigned to you',
  },
  'Bu kurs sizga biriktirilmagan': {
    ru: 'Этот курс за вами не закреплён',
    kaa: 'Bul kurs sizge bekitilmegen',
    en: 'This course is not assigned to you',
  },
  'Bu kursga mentor biriktirilmagan': {
    ru: 'К этому курсу не прикреплён ментор',
    kaa: 'Bul kursqa mentor bekitilmegen',
    en: 'No mentor is assigned to this course',
  },
  'Bu kursga talabalar yozilgan, avval ularni olib tashlang': {
    ru: 'На этот курс записаны студенты, сначала удалите их',
    kaa: 'Bul kursqa studentler jazılǵan, aldın olardı alıp taslań',
    en: 'Students are enrolled in this course; remove them first',
  },
  'Modul topilmadi': {
    ru: 'Модуль не найден',
    kaa: 'Modul tabılmadı',
    en: 'Module not found',
  },
  'Dars topilmadi': {
    ru: 'Урок не найден',
    kaa: 'Sabaq tabılmadı',
    en: 'Lesson not found',
  },

  // ── Kursga yozilish, format va joylar ─────────────────────────────────────
  'Yozilish topilmadi': {
    ru: 'Запись не найдена',
    kaa: 'Jazılıw tabılmadı',
    en: 'Enrollment not found',
  },
  "To'lov yozuvi topilmadi": {
    ru: 'Запись о платеже не найдена',
    kaa: 'Tólem jazıwı tabılmadı',
    en: 'Payment record not found',
  },
  "To'lov summasi noldan katta bo'lishi kerak": {
    ru: 'Сумма платежа должна быть больше нуля',
    kaa: 'Tólem summası noldan úlken bolıwı kerek',
    en: 'The payment amount must be greater than zero',
  },
  "To'lov summasi manfiy bo'lmasligi kerak": {
    ru: 'Сумма платежа не может быть отрицательной',
    kaa: 'Tólem summası teris bolmawı kerek',
    en: 'The payment amount cannot be negative',
  },
  "To'lov sanasi noto'g'ri": {
    ru: 'Неверная дата платежа',
    kaa: 'Tólem sánesi qáte',
    en: 'Invalid payment date',
  },
  'Siz bu kursga yozilmagansiz': {
    ru: 'Вы не записаны на этот курс',
    kaa: 'Siz bul kursqa jazılmaǵansız',
    en: 'You are not enrolled in this course',
  },
  'Siz bu kursga allaqachon yozilgansiz': {
    ru: 'Вы уже записаны на этот курс',
    kaa: 'Siz bul kursqa aldın jazılǵansız',
    en: 'You are already enrolled in this course',
  },
  "Bu kursga faol yozilishingiz yo'q": {
    ru: 'У вас нет активной записи на этот курс',
    kaa: 'Bul kursqa aktiv jazılıwıńız joq',
    en: 'You have no active enrollment in this course',
  },
  "Yozilishingiz hali tasdiqlanmagan — to'lov kutilmoqda": {
    ru: 'Ваша запись ещё не подтверждена — ожидается оплата',
    kaa: 'Jazılıwıńız ele tastıyıqlanbaǵan — tólem kútilip atır',
    en: 'Your enrollment is not confirmed yet — payment is pending',
  },
  'Yozilishingiz bekor qilingan': {
    ru: 'Ваша запись отменена',
    kaa: 'Jazılıwıńız biykar etilgen',
    en: 'Your enrollment has been cancelled',
  },
  'Format aniq tanlanishi kerak (online yoki offline)': {
    ru: 'Нужно явно выбрать формат (онлайн или офлайн)',
    kaa: 'Format anıq saylanıwı kerek (onlayn yaki oflayn)',
    en: 'A format must be chosen explicitly (online or offline)',
  },
  "Bu kurs tanlangan formatda o'tilmaydi": {
    ru: 'Этот курс не проводится в выбранном формате',
    kaa: 'Bul kurs saylanǵan formatta ótkerilmeydi',
    en: 'This course is not offered in the selected format',
  },
  "Bu kurs offline o'tiladi — yozilish uchun administrator bilan bog'laning": {
    ru: 'Этот курс проходит офлайн — для записи свяжитесь с администратором',
    kaa: 'Bul kurs oflayn ótkeriledi — jazılıw ushın administrator menen baylanısıń',
    en: 'This course is taught offline — contact an administrator to enroll',
  },
  "Bu kursga yozilish uchun so'rov qoldiring — administrator siz bilan bog'lanadi": {
    ru: 'Чтобы записаться на этот курс, оставьте заявку — администратор свяжется с вами',
    kaa: 'Bul kursqa jazılıw ushın soraw qaldırıń — administrator siz benen baylanısadı',
    en: 'Leave a request to enroll in this course — an administrator will contact you',
  },
  'Bu kursga onlayn yozilish hozircha yopiq — tez orada ochiladi': {
    ru: 'Онлайн-запись на этот курс пока закрыта — скоро откроется',
    kaa: 'Bul kursqa onlayn jazılıw házirshe jabıq — tez arada ashıladı',
    en: 'Online enrollment for this course is closed for now — it will open soon',
  },
  "Bu guruhda joylar tugagan — keyingi guruh ochilishini kuting yoki so'rov qoldiring": {
    ru: 'В этой группе мест не осталось — дождитесь следующей группы или оставьте заявку',
    kaa: 'Bul toparda orınlar tamamlandı — keyingi topar ashılıwın kútiń yamasa soraw qaldırıń',
    en: 'This group is full — wait for the next group or leave a request',
  },

  // ── O'quv guruhlari ───────────────────────────────────────────────────────
  'Guruh topilmadi': {
    ru: 'Группа не найдена',
    kaa: 'Topar tabılmadı',
    en: 'Group not found',
  },
  'Guruh formati kurs formatiga mos emas': {
    ru: 'Формат группы не соответствует формату курса',
    kaa: 'Topar formatı kurs formatına sáykes emes',
    en: 'The group format does not match the course format',
  },
  "Guruh formati o'quvchining yozilish formatiga mos emas": {
    ru: 'Формат группы не совпадает с форматом записи студента',
    kaa: "Topar formatı studenttiń jazılıw formatına sáykes emes",
    en: "The group format does not match the student's enrollment format",
  },
  'Guruh boshqa kursga tegishli': {
    ru: 'Группа относится к другому курсу',
    kaa: 'Topar basqa kursqa tiyisli',
    en: 'The group belongs to a different course',
  },
  'Bu mentor kursga biriktirilmagan': {
    ru: 'Этот ментор не закреплён за курсом',
    kaa: 'Bul mentor kursqa bekitilmegen',
    en: 'This mentor is not assigned to the course',
  },
  "Tugagan guruhga o'quvchi qo'shilmaydi": {
    ru: 'В завершённую группу нельзя добавить студента',
    kaa: "Juwmaqlanǵan toparǵa student qosılmaydı",
    en: 'Students cannot be added to a finished group',
  },
  'Bu guruhda joylar tugagan': {
    ru: 'В этой группе нет свободных мест',
    kaa: 'Bul toparda orınlar tawsıldı',
    en: 'This group is full',
  },
  "Guruh nomi kamida 2 ta belgidan iborat bo'lishi kerak": {
    ru: 'Название группы должно содержать минимум 2 символа',
    kaa: "Topar atı keminde 2 belgiden ibarat bolıwı kerek",
    en: 'The group name must be at least 2 characters',
  },
  'Hafta kuni 0 dan 6 gacha': {
    ru: 'День недели — от 0 до 6',
    kaa: "Hápte kúni 0 den 6 ǵa shekem",
    en: 'Weekday must be between 0 and 6',
  },
  "Format noto'g'ri": {
    ru: 'Неверный формат',
    kaa: 'Format qáte',
    en: 'Invalid format',
  },
  "Boshlanish sanasi noto'g'ri": {
    ru: 'Неверная дата начала',
    kaa: 'Baslanıw sánesi qáte',
    en: 'Invalid start date',
  },
  "Tugash sanasi noto'g'ri": {
    ru: 'Неверная дата окончания',
    kaa: 'Juwmaqlanıw sánesi qáte',
    en: 'Invalid end date',
  },
  'Kamida 1 joy': {
    ru: 'Минимум 1 место',
    kaa: 'Keminde 1 orın',
    en: 'At least 1 seat',
  },
  "Hech bo'lmasa bitta maydon yuborilishi kerak": {
    ru: 'Нужно отправить хотя бы одно поле',
    kaa: 'Keminde bir maydan jiberiliwi kerek',
    en: 'At least one field must be provided',
  },
  'Yozilish tanlanishi kerak': {
    ru: 'Нужно выбрать запись',
    kaa: 'Jazılıw saylanıwı kerek',
    en: 'An enrollment must be selected',
  },

  // ── Kurs so'rovlari ───────────────────────────────────────────────────────
  "So'rov topilmadi": {
    ru: 'Заявка не найдена',
    kaa: 'Soraw tabılmadı',
    en: 'Request not found',
  },
  "Bu kurs bo'yicha so'rovingiz allaqachon ko'rib chiqilmoqda": {
    ru: 'Ваша заявка по этому курсу уже рассматривается',
    kaa: 'Bul kurs boyınsha sorawıńız aldın kórip shıǵılıp atır',
    en: 'Your request for this course is already being reviewed',
  },
  "Bu so'rov hisobsiz yuborilgan — avval o'quvchi ro'yxatdan o'tishi kerak": {
    ru: 'Эта заявка отправлена без аккаунта — сначала студент должен зарегистрироваться',
    kaa: 'Bul soraw esapsız jiberilgen — aldın student dizimnen ótiwi kerek',
    en: 'This request was sent without an account — the student must register first',
  },

  // ── To'lovlar va obuna ────────────────────────────────────────────────────
  'Obuna topilmadi': {
    ru: 'Подписка не найдена',
    kaa: 'Obuna tabılmadı',
    en: 'Subscription not found',
  },
  'Obuna muddati tugagan — davom etish uchun yangilang': {
    ru: 'Срок подписки истёк — продлите, чтобы продолжить',
    kaa: 'Obuna múddeti tamamlandı — dawam etiw ushın jańalań',
    en: 'Your subscription has expired — renew it to continue',
  },
  "Obuna bo'limi hozircha yopiq — kursga kirishni administrator ochadi": {
    ru: 'Раздел подписок пока закрыт — доступ к курсу открывает администратор',
    kaa: 'Obuna bólimi házirshe jabıq — kursqa kiriwdi administrator ashadı',
    en: 'The subscription section is closed for now — an administrator grants course access',
  },
  'Sizda allaqachon faol yoki kutilayotgan obuna bor': {
    ru: 'У вас уже есть активная или ожидающая подписка',
    kaa: 'Sizde aldın aktiv yaki kútilip atırǵan obuna bar',
    en: 'You already have an active or pending subscription',
  },
  "Bu kurs bepul — to'lov talab qilinmaydi": {
    ru: 'Этот курс бесплатный — оплата не требуется',
    kaa: 'Bul kurs biypul — tólem talap etilmeydi',
    en: 'This course is free — no payment is required',
  },
  "Bu yozilish uchun to'lov talab qilinmaydi": {
    ru: 'Оплата по этой записи не требуется',
    kaa: 'Bul jazılıw ushın tólem talap etilmeydi',
    en: 'No payment is required for this enrollment',
  },
  "Bu obuna uchun to'lov talab qilinmaydi": {
    ru: 'Оплата по этой подписке не требуется',
    kaa: 'Bul obuna ushın tólem talap etilmeydi',
    en: 'No payment is required for this subscription',
  },
  "Bu yozilish uchun to'lov allaqachon tasdiqlangan": {
    ru: 'Оплата по этой записи уже подтверждена',
    kaa: 'Bul jazılıw ushın tólem aldın tastıyıqlanǵan',
    en: 'Payment for this enrollment has already been confirmed',
  },
  "Bu yozilish uchun to'lov allaqachon amalga oshirilgan": {
    ru: 'Оплата по этой записи уже произведена',
    kaa: 'Bul jazılıw ushın tólem aldın ámelge asırılǵan',
    en: 'Payment for this enrollment has already been made',
  },
  'Chek yuklanmagan': {
    ru: 'Чек не загружен',
    kaa: 'Chek júklenbegen',
    en: 'No receipt uploaded',
  },
  "Bu obuna uchun chek yuklab bo'lmaydi": {
    ru: 'Для этой подписки нельзя загрузить чек',
    kaa: 'Bul obuna ushın chek júklep bolmaydı',
    en: 'A receipt cannot be uploaded for this subscription',
  },
  'Click hozircha sozlanmagan': {
    ru: 'Click пока не настроен',
    kaa: 'Click házirshe sazlanbaǵan',
    en: 'Click is not configured yet',
  },
  'Payme hozircha sozlanmagan': {
    ru: 'Payme пока не настроен',
    kaa: 'Payme házirshe sazlanbaǵan',
    en: 'Payme is not configured yet',
  },

  // ── Topshiriqlar va savol-javob ───────────────────────────────────────────
  'Topshiriq topilmadi': {
    ru: 'Задание не найдено',
    kaa: 'Tapsırma tabılmadı',
    en: 'Assignment not found',
  },
  'Bu topshiriq sizga tegishli emas': {
    ru: 'Это задание вам не принадлежит',
    kaa: 'Bul tapsırma sizge tiyisli emes',
    en: 'This assignment does not belong to you',
  },
  "Bu topshiriq sizga mo'ljallanmagan": {
    ru: 'Это задание предназначено не вам',
    kaa: 'Bul tapsırma sizge arnalmaǵan',
    en: 'This assignment is not intended for you',
  },
  'Bu topshiriq allaqachon qabul qilingan': {
    ru: 'Это задание уже принято',
    kaa: 'Bul tapsırma aldın qabıllanǵan',
    en: 'This assignment has already been accepted',
  },
  'Savol topilmadi': {
    ru: 'Вопрос не найден',
    kaa: 'Soraw tabılmadı',
    en: 'Question not found',
  },
  'Bu savol sizning kursingizga tegishli emas': {
    ru: 'Этот вопрос не относится к вашему курсу',
    kaa: 'Bul soraw sizdiń kursıńızǵa tiyisli emes',
    en: 'This question does not belong to your course',
  },
  'Javob topilmadi': {
    ru: 'Ответ не найден',
    kaa: 'Juwap tabılmadı',
    en: 'Answer not found',
  },
  'Bu javob sizning kursingizga tegishli emas': {
    ru: 'Этот ответ не относится к вашему курсу',
    kaa: 'Bul juwap sizdiń kursıńızǵa tiyisli emes',
    en: 'This answer does not belong to your course',
  },
  "Savol-javob faqat kursga yozilgan o'quvchilar uchun ochiq": {
    ru: 'Вопросы и ответы доступны только студентам, записанным на курс',
    kaa: 'Soraw-juwap tek kursqa jazılǵan studentler ushın ashıq',
    en: 'Q&A is open only to students enrolled in the course',
  },

  // ── Sharhlar ──────────────────────────────────────────────────────────────
  'Sharh topilmadi': {
    ru: 'Отзыв не найден',
    kaa: 'Pikir tabılmadı',
    en: 'Review not found',
  },
  'Sharh faqat kursni tugatgan talabalar uchun': {
    ru: 'Отзыв могут оставить только студенты, завершившие курс',
    kaa: 'Pikir tek kurstı tamamlaǵan studentler ushın',
    en: 'Only students who have completed the course can leave a review',
  },

  // ── Sertifikat ────────────────────────────────────────────────────────────
  'Sertifikat faqat kurs yakunlangandan keyin beriladi': {
    ru: 'Сертификат выдаётся только после завершения курса',
    kaa: 'Sertifikat tek kurs tamamlanǵannan keyin beriledi',
    en: 'A certificate is issued only after the course is completed',
  },
  "Sertifikat topilmadi yoki raqam formati noto'g'ri": {
    ru: 'Сертификат не найден или неверный формат номера',
    kaa: 'Sertifikat tabılmadı yaki nomer formatı nadurıs',
    en: 'Certificate not found or the number format is invalid',
  },
  'Bunday raqamli haqiqiy sertifikat topilmadi': {
    ru: 'Подлинный сертификат с таким номером не найден',
    kaa: 'Bunday nomerli haqıyqıy sertifikat tabılmadı',
    en: 'No valid certificate with this number was found',
  },

  // ── Xabarlar (chat) ───────────────────────────────────────────────────────
  'Xabar topilmadi': {
    ru: 'Сообщение не найдено',
    kaa: 'Xabar tabılmadı',
    en: 'Message not found',
  },
  'Suhbat topilmadi': {
    ru: 'Диалог не найден',
    kaa: 'Sáwbet tabılmadı',
    en: 'Conversation not found',
  },
  'Bu suhbat sizga tegishli emas': {
    ru: 'Этот диалог вам не принадлежит',
    kaa: 'Bul sáwbet sizge tiyisli emes',
    en: 'This conversation does not belong to you',
  },
  "O'zingizga xabar yoza olmaysiz": {
    ru: 'Нельзя написать сообщение самому себе',
    kaa: 'Ózińizge xabar jaza almaysız',
    en: 'You cannot message yourself',
  },
  "Faqat o'zingiz yozilgan kurs mentoriga yoza olasiz": {
    ru: 'Писать можно только ментору курса, на который вы записаны',
    kaa: 'Tek ózińiz jazılǵan kurs mentorına jaza alasız',
    en: 'You can only message the mentor of a course you are enrolled in',
  },
  "Faqat o'z kursingizdagi o'quvchiga yoza olasiz": {
    ru: 'Писать можно только студенту своего курса',
    kaa: 'Tek óz kursıńızdaǵı studentke jaza alasız',
    en: 'You can only message a student from your own course',
  },
  "Xabar yuborishga ruxsat yo'q": {
    ru: 'Нет прав на отправку сообщений',
    kaa: 'Xabar jiberiwge ruqsat joq',
    en: 'You are not allowed to send messages',
  },
  'Admin administratsiyaga yoza olmaydi': {
    ru: 'Администратор не может писать администрации',
    kaa: 'Admin administraciyaǵa jaza almaydı',
    en: 'An admin cannot message the administration',
  },
  "Qabul qiluvchi ko'rsatilmadi": {
    ru: 'Получатель не указан',
    kaa: 'Qabıl etiwshi kórsetilmedi',
    en: 'No recipient was specified',
  },

  // ── Jonli darslar ─────────────────────────────────────────────────────────
  'Sessiya topilmadi': {
    ru: 'Сессия не найдена',
    kaa: 'Sessiya tabılmadı',
    en: 'Session not found',
  },
  'Bu sessiya sizga tegishli emas': {
    ru: 'Эта сессия вам не принадлежит',
    kaa: 'Bul sessiya sizge tiyisli emes',
    en: 'This session does not belong to you',
  },
  "Bu jonli darsga kirish huquqingiz yo'q": {
    ru: 'У вас нет доступа к этому живому уроку',
    kaa: 'Bul janlı sabaqqa kiriw huqıqıńız joq',
    en: 'You do not have access to this live session',
  },

  // ── Mentorlar va jamoa ────────────────────────────────────────────────────
  'Mentor topilmadi': {
    ru: 'Ментор не найден',
    kaa: 'Mentor tabılmadı',
    en: 'Mentor not found',
  },
  "Sizning hisobingizga mentor profili bog'lanmagan. Administratorga murojaat qiling.": {
    ru: 'К вашему аккаунту не привязан профиль ментора. Обратитесь к администратору.',
    kaa: 'Esabıńızǵa mentor profili baylanıspaǵan. Administratorǵa múrájat etiń.',
    en: 'No mentor profile is linked to your account. Please contact an administrator.',
  },
  "Bog'lanadigan mentor topilmadi": {
    ru: 'Ментор для привязки не найден',
    kaa: 'Baylanıstırılatuǵın mentor tabılmadı',
    en: 'The mentor to link was not found',
  },
  "Bog'lanadigan foydalanuvchi topilmadi": {
    ru: 'Пользователь для привязки не найден',
    kaa: 'Baylanıstırılatuǵın paydalanıwshı tabılmadı',
    en: 'The user to link was not found',
  },
  "Bu foydalanuvchi allaqachon boshqa mentorga bog'langan": {
    ru: 'Этот пользователь уже привязан к другому ментору',
    kaa: 'Bul paydalanıwshı aldın basqa mentorǵa baylanısqan',
    en: 'This user is already linked to another mentor',
  },
  "Bu mentorga bog'langan kurslar bor, avval uni kurslardan olib tashlang": {
    ru: 'К этому ментору привязаны курсы, сначала открепите его от них',
    kaa: 'Bul mentorǵa baylanısqan kurslar bar, aldın onı kurslardan alıp taslań',
    en: 'This mentor has linked courses; remove them from those courses first',
  },
  "Bu mentorga bog'langan kurslar bor, avval ularni boshqa mentorga o'tkazing": {
    ru: 'К этому ментору привязаны курсы, сначала передайте их другому ментору',
    kaa: 'Bul mentorǵa baylanısqan kurslar bar, aldın olardı basqa mentorǵa ótkeriń',
    en: 'This mentor has linked courses; transfer them to another mentor first',
  },
  "Jamoa a'zosi topilmadi": {
    ru: 'Участник команды не найден',
    kaa: 'Komanda aǵzası tabılmadı',
    en: 'Team member not found',
  },
  "Akkauntingiz jamoa profiliga bog'lanmagan — administratorga murojaat qiling": {
    ru: 'Ваш аккаунт не привязан к профилю команды — обратитесь к администратору',
    kaa: 'Akkauntıńız komanda profiline baylanıspaǵan — administratorǵa múrájat etiń',
    en: 'Your account is not linked to a team profile — contact an administrator',
  },

  // ── Kontent (blog, loyiha, hamkor, e'lon, galereya) ───────────────────────
  'Maqola topilmadi': {
    ru: 'Статья не найдена',
    kaa: 'Maqala tabılmadı',
    en: 'Article not found',
  },
  'Loyiha topilmadi': {
    ru: 'Проект не найден',
    kaa: 'Joybar tabılmadı',
    en: 'Project not found',
  },
  "O'yin topilmadi": {
    ru: 'Игра не найдена',
    kaa: 'Oyın tabılmadı',
    en: 'Game not found',
  },
  'Tanlangan loyihalardan biri topilmadi': {
    ru: 'Один из выбранных проектов не найден',
    kaa: 'Saylanǵan joybarlardıń biri tabılmadı',
    en: 'One of the selected projects was not found',
  },
  'Hamkor topilmadi': {
    ru: 'Партнёр не найден',
    kaa: 'Sherik tabılmadı',
    en: 'Partner not found',
  },
  "E'lon topilmadi": {
    ru: 'Объявление не найдено',
    kaa: 'Daǵaza tabılmadı',
    en: 'Announcement not found',
  },
  'Voqea topilmadi': {
    ru: 'Момент не найден',
    kaa: 'Waqıya tabılmadı',
    en: 'Moment not found',
  },
  'Bunday kontent topilmadi': {
    ru: 'Такой контент не найден',
    kaa: 'Bunday kontent tabılmadı',
    en: 'No such content was found',
  },
  'Bunday kontent turi mavjud emas': {
    ru: 'Такого типа контента не существует',
    kaa: 'Bunday kontent túri joq',
    en: 'No such content type',
  },
  "Bu kontent turida ko'rishlar hisoblanmaydi": {
    ru: 'Для этого типа контента просмотры не считаются',
    kaa: 'Bul kontent túrinde kóriwler esaplanbaydı',
    en: 'Views are not counted for this content type',
  },
  "Bunday bo'lim mavjud emas": {
    ru: 'Такого раздела не существует',
    kaa: 'Bunday bólim joq',
    en: 'No such section',
  },

  // ── Fayl yuklash ──────────────────────────────────────────────────────────
  'Fayl yuborilmadi': {
    ru: 'Файл не отправлен',
    kaa: 'Fayl jiberilmedi',
    en: 'No file was sent',
  },
  'Fayl topilmadi': {
    ru: 'Файл не найден',
    kaa: 'Fayl tabılmadı',
    en: 'File not found',
  },
  "Fayl mazmuni e'lon qilingan turiga mos emas": {
    ru: 'Содержимое файла не соответствует заявленному типу',
    kaa: 'Fayl mazmunı járiyalanǵan túrine sáykes emes',
    en: 'The file contents do not match the declared type',
  },
  'Fayl bulut xotira hajmi chegarasidan katta. Kichikroq fayl yuklang yoki administrator xotira rejasini oshirsin.': {
    ru: 'Файл превышает лимит облачного хранилища. Загрузите файл меньшего размера или попросите администратора расширить тариф хранилища.',
    kaa: 'Fayl bult saqlaw kólemi shegarasınan úlken. Kishirek fayl júkleń yamasa administrator saqlaw rejesin arttırsın.',
    en: 'The file exceeds the cloud storage size limit. Upload a smaller file or ask an administrator to increase the storage plan.',
  },
  "Faylni bulut xotirasiga yuklab bo'lmadi. Qayta urinib ko'ring.": {
    ru: 'Не удалось загрузить файл в облачное хранилище. Попробуйте ещё раз.',
    kaa: 'Fayldı bult saqlawına júklep bolmadı. Qayta urınıp kóriń.',
    en: 'The file could not be uploaded to cloud storage. Please try again.',
  },

  // ── Forma tekshiruvi (zod validatorlari) ──────────────────────────────────
  // Shablondan yig'iladigan matnlar (masalan "Kamida bitta {narsa} kerak")
  // ATAYIN yo'q — ular o'zbekcha holida qoladi va faqat admin formalarida
  // ko'rinadi. Bu yerda ochiq formalarda (kontakt, ro'yxatdan o'tish, sharh)
  // chiqadigan xabarlar bor.
  "Email noto'g'ri": {
    ru: 'Неверный email',
    kaa: 'Email nadurıs',
    en: 'Invalid email',
  },
  "Telefon raqami noto'g'ri": {
    ru: 'Неверный номер телефона',
    kaa: 'Telefon nomeri nadurıs',
    en: 'Invalid phone number',
  },
  "Parol kamida 8 ta belgidan iborat bo'lishi kerak": {
    ru: 'Пароль должен содержать не менее 8 символов',
    kaa: 'Parol keminde 8 belgiden ibarat bolıwı kerek',
    en: 'The password must be at least 8 characters long',
  },
  'Parol kerak': {
    ru: 'Введите пароль',
    kaa: 'Parol kerek',
    en: 'A password is required',
  },
  'Joriy parol kerak': {
    ru: 'Введите текущий пароль',
    kaa: 'Ámeldegi parol kerek',
    en: 'The current password is required',
  },
  'Token kerak': {
    ru: 'Требуется токен',
    kaa: 'Token kerek',
    en: 'A token is required',
  },
  "Ism kamida 2 ta belgidan iborat bo'lsin": {
    ru: 'Имя должно содержать не менее 2 символов',
    kaa: 'At keminde 2 belgiden ibarat bolsın',
    en: 'The name must be at least 2 characters long',
  },
  'Ism juda uzun': {
    ru: 'Слишком длинное имя',
    kaa: 'At júdá uzın',
    en: 'The name is too long',
  },
  'Email juda uzun': {
    ru: 'Слишком длинный email',
    kaa: 'Email júdá uzın',
    en: 'The email is too long',
  },
  'Telefon raqami juda uzun': {
    ru: 'Слишком длинный номер телефона',
    kaa: 'Telefon nomeri júdá uzın',
    en: 'The phone number is too long',
  },
  'Mavzu juda uzun': {
    ru: 'Слишком длинная тема',
    kaa: 'Tema júdá uzın',
    en: 'The subject is too long',
  },
  'Xabar juda uzun': {
    ru: 'Слишком длинное сообщение',
    kaa: 'Xabar júdá uzın',
    en: 'The message is too long',
  },
  'Xabar juda uzun (4000 belgidan oshmasin)': {
    ru: 'Слишком длинное сообщение (не более 4000 символов)',
    kaa: 'Xabar júdá uzın (4000 belgiden aspasın)',
    en: 'The message is too long (4000 characters maximum)',
  },
  "Xabar bo'sh bo'lmasligi kerak": {
    ru: 'Сообщение не может быть пустым',
    kaa: 'Xabar bos bolmawı kerek',
    en: 'The message cannot be empty',
  },
  "Javob bo'sh bo'lmasligi kerak": {
    ru: 'Ответ не может быть пустым',
    kaa: 'Juwap bos bolmawı kerek',
    en: 'The answer cannot be empty',
  },
  'Javob juda uzun': {
    ru: 'Слишком длинный ответ',
    kaa: 'Juwap júdá uzın',
    en: 'The answer is too long',
  },
  'Izoh juda uzun': {
    ru: 'Слишком длинный комментарий',
    kaa: 'Pikir júdá uzın',
    en: 'The comment is too long',
  },
  "Reyting 1 dan 5 gacha bo'lishi kerak": {
    ru: 'Рейтинг должен быть от 1 до 5',
    kaa: 'Reyting 1 den 5 ke shekem bolıwı kerek',
    en: 'The rating must be between 1 and 5',
  },
  'Kurs tanlanishi kerak': {
    ru: 'Нужно выбрать курс',
    kaa: 'Kurs saylanıwı kerek',
    en: 'A course must be selected',
  },
  'Format tanlanishi kerak': {
    ru: 'Нужно выбрать формат',
    kaa: 'Format saylanıwı kerek',
    en: 'A format must be selected',
  },
  'Dars tanlanishi shart': {
    ru: 'Нужно выбрать урок',
    kaa: 'Sabaq saylanıwı shárt',
    en: 'A lesson must be selected',
  },
  'Rad etish sababi kerak': {
    ru: 'Укажите причину отказа',
    kaa: 'Bas tartıw sebebi kerek',
    en: 'A rejection reason is required',
  },
  'Kamida bitta maydon yuborilishi kerak': {
    ru: 'Нужно передать хотя бы одно поле',
    kaa: 'Keminde bir maydan jiberiliwi kerek',
    en: 'At least one field must be provided',
  },
  "Hech narsa o'zgartirilmadi": {
    ru: 'Ничего не изменено',
    kaa: 'Hesh nárse ózgertilmedi',
    en: 'Nothing was changed',
  },
  'Hech narsa tanlanmadi': {
    ru: 'Ничего не выбрано',
    kaa: 'Hesh nárse saylanbadı',
    en: 'Nothing was selected',
  },
  "Yo qabul qiluvchi, yo administratsiya tanlanishi kerak": {
    ru: 'Нужно выбрать либо получателя, либо администрацию',
    kaa: 'Ya qabıl etiwshi, ya administraciya saylanıwı kerek',
    en: 'Either a recipient or the administration must be selected',
  },

  // ── Forma tekshiruvi: uzunlik va majburiy maydonlar ───────────────────────
  "Ism kamida 2 ta belgidan iborat bo'lishi kerak": {
    ru: 'Имя должно содержать не менее 2 символов',
    kaa: 'At keminde 2 belgiden ibarat bolıwı kerek',
    en: 'The name must be at least 2 characters long',
  },
  "Nom kamida 2 ta belgidan iborat bo'lishi kerak": {
    ru: 'Название должно содержать не менее 2 символов',
    kaa: 'Atı keminde 2 belgiden ibarat bolıwı kerek',
    en: 'The name must be at least 2 characters long',
  },
  "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak": {
    ru: 'Заголовок должен содержать не менее 3 символов',
    kaa: 'Sarlawha keminde 3 belgiden ibarat bolıwı kerek',
    en: 'The title must be at least 3 characters long',
  },
  "Mavzu kamida 3 ta belgidan iborat bo'lishi kerak": {
    ru: 'Тема должна содержать не менее 3 символов',
    kaa: 'Tema keminde 3 belgiden ibarat bolıwı kerek',
    en: 'The subject must be at least 3 characters long',
  },
  "Savol kamida 3 ta belgidan iborat bo'lishi kerak": {
    ru: 'Вопрос должен содержать не менее 3 символов',
    kaa: 'Soraw keminde 3 belgiden ibarat bolıwı kerek',
    en: 'The question must be at least 3 characters long',
  },
  "Javob kamida 3 ta belgidan iborat bo'lishi kerak": {
    ru: 'Ответ должен содержать не менее 3 символов',
    kaa: 'Juwap keminde 3 belgiden ibarat bolıwı kerek',
    en: 'The answer must be at least 3 characters long',
  },
  "Xabar kamida 5 ta belgidan iborat bo'lishi kerak": {
    ru: 'Сообщение должно содержать не менее 5 символов',
    kaa: 'Xabar keminde 5 belgiden ibarat bolıwı kerek',
    en: 'The message must be at least 5 characters long',
  },
  "Sharh kamida 5 ta belgidan iborat bo'lishi kerak": {
    ru: 'Отзыв должен содержать не менее 5 символов',
    kaa: 'Pikir keminde 5 belgiden ibarat bolıwı kerek',
    en: 'The review must be at least 5 characters long',
  },
  "Topshiriq matni kamida 5 ta belgidan iborat bo'lishi kerak": {
    ru: 'Текст задания должен содержать не менее 5 символов',
    kaa: 'Tapsırma teksti keminde 5 belgiden ibarat bolıwı kerek',
    en: 'The assignment text must be at least 5 characters long',
  },
  "So'rov matni kamida 5 ta belgidan iborat bo'lishi kerak": {
    ru: 'Текст заявки должен содержать не менее 5 символов',
    kaa: 'Soraw teksti keminde 5 belgiden ibarat bolıwı kerek',
    en: 'The request text must be at least 5 characters long',
  },
  "Javob bo'sh bo'lishi mumkin emas": {
    ru: 'Ответ не может быть пустым',
    kaa: 'Juwap bos bolıwı múmkin emes',
    en: 'The answer cannot be empty',
  },

  // ── Forma tekshiruvi: qiymat oralig'i va format ───────────────────────────
  "Muddat noto'g'ri": {
    ru: 'Неверный срок',
    kaa: 'Múddet nadurıs',
    en: 'Invalid deadline',
  },
  "Sana noto'g'ri": {
    ru: 'Неверная дата',
    kaa: 'Sáne nadurıs',
    en: 'Invalid date',
  },
  "Boshlanish vaqti noto'g'ri": {
    ru: 'Неверное время начала',
    kaa: 'Baslanıw waqtı nadurıs',
    en: 'Invalid start time',
  },
  "Holat noto'g'ri": {
    ru: 'Неверный статус',
    kaa: 'Halat nadurıs',
    en: 'Invalid status',
  },
  "Rol noto'g'ri": {
    ru: 'Неверная роль',
    kaa: 'Rol nadurıs',
    en: 'Invalid role',
  },
  "Baho 0 dan kichik bo'lmasin": {
    ru: 'Оценка не может быть меньше 0',
    kaa: 'Baha 0 den kishi bolmasın',
    en: 'The grade cannot be less than 0',
  },
  'Baho 100 dan oshmasin': {
    ru: 'Оценка не может превышать 100',
    kaa: 'Baha 100 den aspasın',
    en: 'The grade cannot exceed 100',
  },
  "Foiz 0 dan kichik bo'lmasin": {
    ru: 'Процент не может быть меньше 0',
    kaa: 'Procent 0 den kishi bolmasın',
    en: 'The percentage cannot be less than 0',
  },
  'Foiz 100 dan oshmasin': {
    ru: 'Процент не может превышать 100',
    kaa: 'Procent 100 den aspasın',
    en: 'The percentage cannot exceed 100',
  },
  "Fokus 0 dan kichik bo'lmaydi": {
    ru: 'Фокус не может быть меньше 0',
    kaa: 'Fokus 0 den kishi bolmaydı',
    en: 'The focus point cannot be less than 0',
  },
  "Fokus 100 dan katta bo'lmaydi": {
    ru: 'Фокус не может быть больше 100',
    kaa: 'Fokus 100 den úlken bolmaydı',
    en: 'The focus point cannot be greater than 100',
  },
  "Narx manfiy bo'lmasin": {
    ru: 'Цена не может быть отрицательной',
    kaa: 'Baha teris bolmasın',
    en: 'The price cannot be negative',
  },
  'Kamida 15 daqiqa': {
    ru: 'Минимум 15 минут',
    kaa: 'Keminde 15 minut',
    en: 'At least 15 minutes',
  },
  "Ko'pi bilan 8 soat": {
    ru: 'Максимум 8 часов',
    kaa: 'Kóbi menen 8 saat',
    en: 'At most 8 hours',
  },
  "Ko'pi bilan 20 ta ko'nikma": {
    ru: 'Максимум 20 навыков',
    kaa: 'Kóbi menen 20 kónlikpe',
    en: 'At most 20 skills',
  },
  "Bir marta ko'pi bilan 200 ta o'chirish mumkin": {
    ru: 'За один раз можно удалить не более 200 записей',
    kaa: 'Bir waqıtta kóbi menen 200 jazıw óshiriledi',
    en: 'At most 200 records can be deleted at once',
  },
  'Qiymat 20 belgidan oshmasligi kerak': {
    ru: 'Значение не должно превышать 20 символов',
    kaa: 'Mánis 20 belgiden aspawı kerek',
    en: 'The value must not exceed 20 characters',
  },
  "provider 'click' yoki 'payme' bo'lishi kerak": {
    ru: "provider должен быть 'click' или 'payme'",
    kaa: "provider 'click' yaki 'payme' bolıwı kerek",
    en: "The provider must be either 'click' or 'payme'",
  },
  "blocked qiymati boolean bo'lishi kerak": {
    ru: 'Значение blocked должно быть логическим (true/false)',
    kaa: 'blocked mánisi boolean bolıwı kerek',
    en: 'The blocked value must be a boolean',
  },

  // ── Forma tekshiruvi: to'ldirilishi shart bo'lgan maydonlar ───────────────
  'Kategoriya kerak': {
    ru: 'Укажите категорию',
    kaa: 'Kategoriya kerek',
    en: 'A category is required',
  },
  'Qiymat kerak': {
    ru: 'Укажите значение',
    kaa: 'Mánis kerek',
    en: 'A value is required',
  },
  'Ikonka kerak': {
    ru: 'Выберите иконку',
    kaa: 'Ikonka kerek',
    en: 'An icon is required',
  },
  'Rang kerak': {
    ru: 'Укажите цвет',
    kaa: 'Reń kerek',
    en: 'A color is required',
  },
  "Ko'rsatkich kerak": {
    ru: 'Укажите показатель',
    kaa: 'Kórsetkish kerek',
    en: 'An indicator is required',
  },
  'Rasm kerak': {
    ru: 'Загрузите изображение',
    kaa: 'Súwret kerek',
    en: 'An image is required',
  },
  'Telefon kerak': {
    ru: 'Укажите телефон',
    kaa: 'Telefon kerek',
    en: 'A phone number is required',
  },
  'Telegram kerak': {
    ru: 'Укажите Telegram',
    kaa: 'Telegram kerek',
    en: 'A Telegram handle is required',
  },
  'Email kerak': {
    ru: 'Укажите email',
    kaa: 'Email kerek',
    en: 'An email is required',
  },
  'Manzil kerak': {
    ru: 'Укажите адрес',
    kaa: 'Mánzil kerek',
    en: 'An address is required',
  },
  'Vaqt kerak': {
    ru: 'Укажите время',
    kaa: 'Waqıt kerek',
    en: 'A time is required',
  },
  'Valyuta kerak': {
    ru: 'Укажите валюту',
    kaa: 'Valyuta kerek',
    en: 'A currency is required',
  },
  'Logotip manzili kerak': {
    ru: 'Укажите адрес логотипа',
    kaa: 'Logotip mánzili kerek',
    en: 'A logo URL is required',
  },
  'Skrinshot manzili kerak': {
    ru: 'Укажите адрес скриншота',
    kaa: 'Skrinshot mánzili kerek',
    en: 'A screenshot URL is required',
  },
  'APK fayl manzili kerak': {
    ru: 'Укажите адрес APK-файла',
    kaa: 'APK fayl mánzili kerek',
    en: 'An APK file URL is required',
  },
  'Versiya kerak': {
    ru: 'Укажите версию',
    kaa: 'Versiya kerek',
    en: 'A version is required',
  },
  'Kamida bitta texnologiya kerak': {
    ru: 'Нужна хотя бы одна технология',
    kaa: 'Keminde bir texnologiya kerek',
    en: 'At least one technology is required',
  },
  'Loyiha tanlanmagan': {
    ru: 'Проект не выбран',
    kaa: 'Joybar saylanbaǵan',
    en: 'No project selected',
  },
  'courseId kerak': {
    ru: 'Требуется courseId',
    kaa: 'courseId kerek',
    en: 'courseId is required',
  },
  'receiptUrl kerak': {
    ru: 'Требуется receiptUrl',
    kaa: 'receiptUrl kerek',
    en: 'receiptUrl is required',
  },
  'Kamida bitta maydon (status yoki paymentStatus) yuborilishi kerak': {
    ru: 'Нужно передать хотя бы одно поле (status или paymentStatus)',
    kaa: 'Keminde bir maydan (status yaki paymentStatus) jiberiliwi kerek',
    en: 'At least one field (status or paymentStatus) must be provided',
  },
  'enrollmentId yoki subscriptionId dan aynan bittasi berilishi kerak': {
    ru: 'Нужно передать ровно одно из полей: enrollmentId или subscriptionId',
    kaa: 'enrollmentId yaki subscriptionId nen dál biri beriliwi kerek',
    en: 'Exactly one of enrollmentId or subscriptionId must be provided',
  },
  "To'lovni rad etishda sabab ko'rsatilishi shart": {
    ru: 'При отклонении оплаты нужно указать причину',
    kaa: 'Tólemnen bas tartqanda sebep kórsetiliwi shárt',
    en: 'A reason must be given when rejecting a payment',
  },
  "Rad etishda sabab ko'rsatilishi shart": {
    ru: 'При отклонении нужно указать причину',
    kaa: 'Bas tartqanda sebep kórsetiliwi shárt',
    en: 'A reason must be given when rejecting',
  },
};
