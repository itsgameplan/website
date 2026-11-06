import type { Locale } from "@/i18n/translations";

/**
 * Click-to-compose forms. Each question's picks are turned into a sentence with its
 * template ("{x}" = the picks, joined naturally), and the sentences become the email body.
 */
export type BriefKind = "venture" | "advisory" | "contact";

export type BriefChoice = { id: string; label: string; say?: string };
export type BriefGroup = {
  id: string;
  label: string;
  multi?: boolean;
  /** "{x}" is replaced by the picked choices */
  template: string;
  /** English: use the label in lower case inside the sentence (unless the choice has its own `say`) */
  lower?: boolean;
  choices: BriefChoice[];
};

export type BriefCopy = {
  title: string;
  accent: string;
  intro: string;
  subject: string;
  groups: BriefGroup[];
  /** choice ids (any group) that reveal the phone field */
  phoneFor?: string[];
};

export type BriefUi = {
  yourMessage: string;
  to: string;
  subjectLabel: string;
  name: string;
  namePh: string;
  company: string;
  companyPh: string;
  email: string;
  emailPh: string;
  phone: string;
  phonePh: string;
  notes: string;
  notesPh: string;
  optional: string;
  pickMany: string;
  pickOne: string;
  send: string;
  copy: string;
  copied: string;
  reset: string;
  edited: string;
  needName: string;
  needPick: string;
  sentTitle: string;
  sentBody: string;
  hello: string;
  iAm: (name: string, company: string) => string;
  replyTo: (email: string, phone: string) => string;
  thanks: string;
  and: string;
  sep: string;
  placeholder: string;
  stepAbout: string;
  stepPick: string;
};

const timingEn: BriefGroup = {
  id: "timing", label: "When do you want to start?", template: "We'd like to start {x}.",
  choices: [
    { id: "now", label: "Right away", say: "right away" },
    { id: "soon", label: "In 1–3 months", say: "in the next 1–3 months" },
    { id: "later", label: "Later this year", say: "later this year" },
    { id: "explore", label: "Just exploring", say: "once the fit is right — we're exploring for now" },
  ],
};
const timingAr: BriefGroup = {
  id: "timing", label: "متى تريد أن تبدأ؟", template: "نرغب في البدء {x}.",
  choices: [
    { id: "now", label: "فوراً", say: "فوراً" },
    { id: "soon", label: "خلال ١–٣ أشهر", say: "خلال الأشهر ١–٣ القادمة" },
    { id: "later", label: "لاحقاً هذا العام", say: "لاحقاً هذا العام" },
    { id: "explore", label: "نستكشف فقط", say: "حين يتضح التوافق، فنحن نستكشف حالياً" },
  ],
};

export const briefForms: Record<Locale, { ui: BriefUi } & Record<BriefKind, BriefCopy>> = {
  en: {
    ui: {
      yourMessage: "YOUR MESSAGE",
      to: "To",
      subjectLabel: "Subject",
      name: "Your name",
      namePh: "First and last name",
      company: "Company or team",
      companyPh: "Where you work",
      email: "Your email",
      emailPh: "you@company.com",
      phone: "Phone number",
      phonePh: "+971 …",
      notes: "Anything else?",
      notesPh: "A line or two about what you're working on",
      optional: "optional",
      pickMany: "pick any",
      pickOne: "pick one",
      send: "SEND WITH MY EMAIL",
      copy: "COPY MESSAGE",
      copied: "COPIED",
      reset: "Rewrite from my picks",
      edited: "You've edited the message — your picks won't overwrite it.",
      needName: "Add your name so we know who to reply to.",
      needPick: "Pick at least one option, or write a note.",
      sentTitle: "Your email app should be open.",
      sentBody: "The message is ready to send. Nothing opened? Copy the message and email it to",
      hello: "Hi Gameplan team,",
      iAm: (name, company) => `I'm ${name}${company ? ` from ${company}` : ""}.`,
      replyTo: (email, phone) => [email && `Email: ${email}`, phone && `Phone: ${phone}`].filter(Boolean).join("\n"),
      thanks: "Thanks,",
      and: "and",
      sep: ", ",
      placeholder: "Your message writes itself here as you pick options on the right.",
      stepAbout: "ABOUT YOU",
      stepPick: "PICK WHAT FITS",
    },
    venture: {
      title: "GOT A",
      accent: "GAMEPLAN?",
      intro: "Click what fits — we'll write the message for you. Then send it from your own email.",
      subject: "Venture Program application",
      groups: [
        {
          id: "sector", label: "What are you building in?", multi: true, lower: true, template: "We're building in {x}.",
          choices: [
            { id: "sport", label: "Sport" }, { id: "health", label: "Health & wellness" }, { id: "consumer", label: "Consumer products" },
            { id: "tech", label: "Tech & apps" }, { id: "media", label: "Media & content" }, { id: "other", label: "Something else", say: "a space that doesn't fit a box" },
          ],
        },
        {
          id: "stage", label: "Where are you today?", template: "Right now we're at the {x} stage.", lower: true,
          choices: [{ id: "idea", label: "Idea" }, { id: "proto", label: "Prototype" }, { id: "launched", label: "Launched" }, { id: "growing", label: "Growing revenue", say: "growth" }],
        },
        {
          id: "need", label: "What do you need?", multi: true, lower: true, template: "We're looking for {x}.",
          choices: [
            { id: "capital", label: "Capital" }, { id: "product", label: "Product development" }, { id: "manufacturing", label: "Packaging & manufacturing" },
            { id: "tech", label: "Tech" }, { id: "brand", label: "Brand & marketing" }, { id: "distribution", label: "Distribution" },
          ],
        },
        timingEn,
      ],
    },
    advisory: {
      title: "LET'S MAKE",
      accent: "THE NEXT MOVE.",
      intro: "Click what fits — we'll write the brief for you. Then send it from your own email.",
      subject: "Gameplan Advisory enquiry",
      groups: [
        {
          id: "org", label: "Who are you?", template: "We're a {x}.",
          choices: [
            { id: "institution", label: "Institution", say: "public institution" }, { id: "company", label: "Company", say: "company" },
            { id: "federation", label: "Federation / league", say: "federation or league" }, { id: "club", label: "Club / team", say: "club" },
            { id: "other", label: "Something else", say: "different kind of organisation" },
          ],
        },
        {
          id: "services", label: "What do you need help with?", multi: true, lower: true, template: "We need help with {x}.",
          choices: [
            { id: "strategy", label: "Strategy" }, { id: "product", label: "Product & tech" }, { id: "brand", label: "Brand & content" },
            { id: "partners", label: "Partnerships & sponsorship" }, { id: "delivery", label: "Events & delivery" }, { id: "data", label: "Data & insight" },
          ],
        },
        {
          id: "model", label: "How would you like to work?", template: "We're thinking of {x}.",
          choices: [
            { id: "project", label: "A project", say: "a defined project" }, { id: "programme", label: "A programme", say: "a longer programme" },
            { id: "embedded", label: "An embedded team", say: "an embedded team" }, { id: "unsure", label: "Not sure yet", say: "whatever fits best, and we'd value your advice" },
          ],
        },
        timingEn,
      ],
    },
    contact: {
      title: "LET'S",
      accent: "TALK.",
      intro: "Pick a topic, add your details, and we'll write the message. It sends from your own email.",
      subject: "Hello from the Gameplan website",
      phoneFor: ["call", "whatsapp"],
      groups: [
        {
          id: "topic", label: "What's it about?", template: "I'm getting in touch about {x}.",
          choices: [
            { id: "venture", label: "Venture Program", say: "the Venture Program" }, { id: "advisory", label: "Advisory", say: "Gameplan Advisory" },
            { id: "partner", label: "Partnership", say: "a partnership" }, { id: "press", label: "Press", say: "a press enquiry" },
            { id: "careers", label: "Careers", say: "working at Gameplan" }, { id: "other", label: "Something else", say: "something else" },
          ],
        },
        {
          id: "reply", label: "How should we reply?", template: "The best way to reach me is {x}.",
          choices: [{ id: "email", label: "Email", say: "email" }, { id: "call", label: "Phone call", say: "a phone call" }, { id: "whatsapp", label: "WhatsApp", say: "WhatsApp" }],
        },
      ],
    },
  },
  ar: {
    ui: {
      yourMessage: "رسالتك",
      to: "إلى",
      subjectLabel: "الموضوع",
      name: "اسمك",
      namePh: "الاسم الكامل",
      company: "الشركة أو الفريق",
      companyPh: "جهة عملك",
      email: "بريدك الإلكتروني",
      emailPh: "you@company.com",
      phone: "رقم الهاتف",
      phonePh: "+971 …",
      notes: "هل من شيء آخر؟",
      notesPh: "سطر أو سطران عمّا تعمل عليه",
      optional: "اختياري",
      pickMany: "اختر ما يناسب",
      pickOne: "اختر واحداً",
      send: "أرسل من بريدي",
      copy: "انسخ الرسالة",
      copied: "تم النسخ",
      reset: "أعد الكتابة من اختياراتي",
      edited: "عدّلت الرسالة بنفسك، ولن تغيّرها اختياراتك.",
      needName: "أضف اسمك لنعرف لمن نرد.",
      needPick: "اختر خياراً واحداً على الأقل أو اكتب ملاحظة.",
      sentTitle: "يُفترض أن يكون تطبيق البريد قد فُتح.",
      sentBody: "الرسالة جاهزة للإرسال. لم يُفتح شيء؟ انسخ الرسالة وأرسلها إلى",
      hello: "مرحباً فريق جيم بلان،",
      iAm: (name, company) => `أنا ${name}${company ? ` من ${company}` : ""}.`,
      replyTo: (email, phone) => [email && `البريد: ${email}`, phone && `الهاتف: ${phone}`].filter(Boolean).join("\n"),
      thanks: "شكراً،",
      and: "و",
      sep: "، ",
      placeholder: "تُكتب رسالتك هنا تلقائياً كلما اخترت من الخيارات.",
      stepAbout: "عنك",
      stepPick: "اختر ما يناسبك",
    },
    venture: {
      title: "عندك",
      accent: "خطة؟",
      intro: "اختر ما يناسبك وسنكتب الرسالة نيابة عنك، ثم أرسلها من بريدك.",
      subject: "طلب الانضمام إلى برنامج المشاريع",
      groups: [
        {
          id: "sector", label: "في أي مجال تبني؟", multi: true, template: "نعمل في مجال {x}.",
          choices: [
            { id: "sport", label: "الرياضة" }, { id: "health", label: "الصحة والعافية" }, { id: "consumer", label: "المنتجات الاستهلاكية" },
            { id: "tech", label: "التقنية والتطبيقات" }, { id: "media", label: "الإعلام والمحتوى" }, { id: "other", label: "مجال آخر", say: "مجال لا يندرج تحت تصنيف واحد" },
          ],
        },
        {
          id: "stage", label: "أين أنت اليوم؟", template: "نحن حالياً في مرحلة {x}.",
          choices: [{ id: "idea", label: "الفكرة" }, { id: "proto", label: "النموذج الأولي" }, { id: "launched", label: "ما بعد الإطلاق" }, { id: "growing", label: "نمو الإيرادات" }],
        },
        {
          id: "need", label: "ما الذي تحتاجه؟", multi: true, template: "نبحث عن {x}.",
          choices: [
            { id: "capital", label: "التمويل" }, { id: "product", label: "تطوير المنتج" }, { id: "manufacturing", label: "التغليف والتصنيع" },
            { id: "tech", label: "التقنية" }, { id: "brand", label: "العلامة والتسويق" }, { id: "distribution", label: "التوزيع" },
          ],
        },
        timingAr,
      ],
    },
    advisory: {
      title: "لنصنع",
      accent: "الخطوة التالية.",
      intro: "اختر ما يناسبك وسنكتب الموجز نيابة عنك، ثم أرسله من بريدك.",
      subject: "استفسار عن استشارات جيم بلان",
      groups: [
        {
          id: "org", label: "من أنتم؟", template: "نحن {x}.",
          choices: [
            { id: "institution", label: "مؤسسة", say: "مؤسسة عامة" }, { id: "company", label: "شركة", say: "شركة" },
            { id: "federation", label: "اتحاد / دوري", say: "اتحاد أو دوري" }, { id: "club", label: "نادٍ / فريق", say: "نادٍ رياضي" },
            { id: "other", label: "جهة أخرى", say: "جهة من نوع آخر" },
          ],
        },
        {
          id: "services", label: "في ماذا تحتاج المساعدة؟", multi: true, template: "نحتاج المساعدة في {x}.",
          choices: [
            { id: "strategy", label: "الاستراتيجية" }, { id: "product", label: "المنتج والتقنية" }, { id: "brand", label: "العلامة والمحتوى" },
            { id: "partners", label: "الشراكات والرعاية" }, { id: "delivery", label: "الفعاليات والتنفيذ" }, { id: "data", label: "البيانات والرؤى" },
          ],
        },
        {
          id: "model", label: "كيف تفضّل أن نعمل؟", template: "نفكر في {x}.",
          choices: [
            { id: "project", label: "مشروع", say: "مشروع محدد" }, { id: "programme", label: "برنامج", say: "برنامج أطول" },
            { id: "embedded", label: "فريق مدمج", say: "فريق مدمج" }, { id: "unsure", label: "لم نحدد بعد", say: "ما يناسبنا أكثر، ونرغب في نصيحتكم" },
          ],
        },
        timingAr,
      ],
    },
    contact: {
      title: "لنتحدث",
      accent: "معاً.",
      intro: "اختر الموضوع وأضف بياناتك، وسنكتب الرسالة. تُرسل من بريدك أنت.",
      subject: "مرحباً من موقع جيم بلان",
      phoneFor: ["call", "whatsapp"],
      groups: [
        {
          id: "topic", label: "ما الموضوع؟", template: "أتواصل معكم بخصوص {x}.",
          choices: [
            { id: "venture", label: "برنامج المشاريع", say: "برنامج المشاريع" }, { id: "advisory", label: "الاستشارات", say: "استشارات جيم بلان" },
            { id: "partner", label: "شراكة", say: "شراكة" }, { id: "press", label: "الصحافة", say: "استفسار صحفي" },
            { id: "careers", label: "الوظائف", say: "العمل في جيم بلان" }, { id: "other", label: "أمر آخر", say: "أمر آخر" },
          ],
        },
        {
          id: "reply", label: "كيف نرد عليك؟", template: "أفضل طريقة للتواصل معي هي {x}.",
          choices: [{ id: "email", label: "البريد", say: "البريد الإلكتروني" }, { id: "call", label: "مكالمة", say: "مكالمة هاتفية" }, { id: "whatsapp", label: "واتساب", say: "واتساب" }],
        },
      ],
    },
  },
};
