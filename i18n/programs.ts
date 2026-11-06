import type { Locale } from "@/i18n/translations";

/**
 * Copy for the two "Your turn" pages — the Venture Program (founders) and Gameplan Advisory
 * (institutions, companies and federations) — plus the shared nav and contact strings.
 * Draft copy: review terms, promises and the Arabic before launch.
 */
export type ProgramKind = "venture" | "advisory";
type Chapter = "ventures" | "advisory" | "momentum" | "about";

export type VentureCopy = {
  tag: string; title: string; accent: string; intro: string; cta: string; otherDoor: string;
  ticker: string[];
  dealTitle: string; dealDesc: string; dealNote: string; dealEquity: string;
  deal: { id: string; label: string; headline: string; points: string[] }[];
  stageTitle: string; stageDesc: string;
  stages: { id: string; label: string; headline: string; desc: string; focus: string[] }[];
  offerTitle: string; offerHint: string;
  offer: { title: string; desc: string; more: string[] }[];
  journeyTitle: string;
  journey: { title: string; desc: string }[];
  proofTitle: string;
  proof: { name: string; desc: string; tags?: string[]; chapter: Chapter }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
};

export type AdvisoryCopy = {
  tag: string; title: string; accent: string; intro: string; cta: string; otherDoor: string;
  audienceTitle: string; audienceDesc: string; challengesLabel: string; weRunLabel: string;
  audiences: { id: "institution" | "company" | "federation"; label: string; sub: string; headline: string; challenges: string[]; weRun: string[]; cta: string }[];
  capTitle: string; capDesc: string; deliverablesLabel: string;
  capabilities: { title: string; desc: string; deliverables: string[] }[];
  modelTitle: string; modelDesc: string;
  models: { title: string; desc: string; fit: string }[];
  processTitle: string; youGet: string;
  process: { title: string; desc: string; get: string[] }[];
  whyTitle: string;
  why: { title: string; desc: string }[];
};

export type ContactCopy = { tag: string; directTitle: string; directDesc: string; doorsTitle: string };

type PagesCopy = {
  back: string; home: string; step: string; prev: string; next: string;
  nav: Record<ProgramKind | "contact", string>;
  contact: ContactCopy;
  venture: VentureCopy;
  advisory: AdvisoryCopy;
};

export const programs: Record<Locale, PagesCopy> = {
  en: {
    back: "BACK TO GAMEPLAN",
    home: "HOME",
    step: "STEP",
    prev: "Previous",
    next: "Next",
    nav: { venture: "VENTURE PROGRAM", advisory: "ADVISORY", contact: "CONTACT" },
    contact: {
      tag: "CONTACT US",
      directTitle: "PREFER TO WRITE IT YOURSELF?",
      directDesc: "Email us directly at",
      doorsTitle: "OR GO STRAIGHT TO A DOOR",
    },

    venture: {
      tag: "DOOR 01 · FOR FOUNDERS",
      title: "JOIN THE",
      accent: "VENTURE PROGRAM.",
      intro: "For founders building at the intersection of sport, technology and culture. We back you with cash, services or both, in exchange for equity — and we stay in the room while you build.",
      cta: "APPLY TO THE PROGRAM",
      otherDoor: "WORK WITH GAMEPLAN ADVISORY",
      ticker: ["CAPITAL", "PRODUCT", "PACKAGING", "TECH", "MANUFACTURING", "BRAND", "DISTRIBUTION", "NETWORK"],

      dealTitle: "BUILD YOUR DEAL",
      dealDesc: "Every deal is shaped around what the company needs. Pick a mix to see what it looks like.",
      dealNote: "All in exchange for equity. Terms are agreed up front, in plain language.",
      dealEquity: "FOR EQUITY",
      deal: [
        { id: "cash", label: "Cash", headline: "Capital to reach your next milestone.", points: ["Backing sized to the plan, not a fixed cheque", "Milestones agreed together", "Board-level support from people who have built"] },
        { id: "services", label: "Services", headline: "Our team, working as yours.", points: ["Product, packaging and manufacturing", "Tech, brand and go-to-market", "Senior people on your work, start to finish"] },
        { id: "both", label: "Both", headline: "Capital, and a team to spend it well.", points: ["Funding plus hands-on delivery", "One partner from formula to shelf", "The deepest level of the program"] },
      ],

      stageTitle: "WHERE ARE YOU TODAY?",
      stageDesc: "Pick your stage — here's where we'd put our weight.",
      stages: [
        { id: "idea", label: "Idea", headline: "Make it real enough to test.", desc: "We pressure-test the idea, size the opportunity and shape a first version you can put in front of people.", focus: ["Concept and positioning", "First product spec", "A plan for the first 90 days"] },
        { id: "proto", label: "Prototype", headline: "From sample to first run.", desc: "We turn the prototype into a product: formula, packaging, suppliers and the first production run.", focus: ["Formula and testing", "Packaging and suppliers", "First production run"] },
        { id: "launched", label: "Launched", headline: "Sharpen it and open doors.", desc: "We fix what's slowing you down, sharpen the brand and open doors to retail, partners and athletes.", focus: ["Brand and content", "Retail and partners", "Athletes and community"] },
        { id: "growing", label: "Growing", headline: "Scale without breaking.", desc: "We scale manufacturing, distribution and the team so growth doesn't break the business.", focus: ["Manufacturing at scale", "Distribution and new markets", "Team and systems"] },
      ],

      offerTitle: "WHAT YOU GET",
      offerHint: "Tap a card for more",
      offer: [
        { title: "Capital", desc: "Backing to reach your next real milestone.", more: ["Sized to what the plan needs", "Released against agreed milestones", "Help preparing for your next round"] },
        { title: "Services", desc: "Our in-house team on the work that matters.", more: ["Product development and packaging", "Tech, apps and e-commerce", "Manufacturing and suppliers"] },
        { title: "Network", desc: "The people it takes to get on the shelf and on the field.", more: ["Athletes, clubs and federations", "Retail and distribution partners", "Manufacturers and suppliers"] },
        { title: "Operators", desc: "People who have built and launched before, next to you.", more: ["Weekly working sessions", "Hands-on help, not just advice", "Straight answers when it's hard"] },
      ],

      journeyTitle: "HOW IT WORKS",
      journey: [
        { title: "Apply", desc: "Tell us what you're building, who it's for and where you are today." },
        { title: "Meet", desc: "A working session with the team to pressure-test the idea together." },
        { title: "Shape the deal", desc: "Cash, services or both, for equity. Clear terms, agreed up front." },
        { title: "Build", desc: "We get to work: formula to shelf, code to launch." },
      ],

      proofTitle: "BUILT WITH GAMEPLAN",
      proof: [
        { name: "Momentum", desc: "Clean electrolytes, built from formula to sachet to shelf.", tags: ["Product", "Packaging", "Tech", "Manufacturing", "Brand"], chapter: "momentum" },
        { name: "ASL", desc: "Real gold, one tap away.", chapter: "advisory" },
        { name: "Cairo Tech", desc: "Earth moving and equipment management.", chapter: "ventures" },
      ],

      faqTitle: "QUESTIONS FOUNDERS ASK",
      faq: [
        { q: "What kind of founders do you back?", a: "Founders building in sport, health, consumer products and the tech around them — from a first idea to growing revenue." },
        { q: "How much equity do you take?", a: "It depends on the mix of cash and services and the stage you're at. We agree it up front, in writing, before any work starts." },
        { q: "Do I keep control of my company?", a: "Yes. You run your company. We work alongside you as an operating partner." },
        { q: "Can I apply with just an idea?", a: "Yes. Tell us what you're building and why you're the one to build it." },
        { q: "What happens after I apply?", a: "We read every application. If it looks like a fit, we'll get in touch to set up a first call." },
      ],
    },

    advisory: {
      tag: "DOOR 02 · FOR INSTITUTIONS, COMPANIES AND FEDERATIONS",
      title: "WORK WITH",
      accent: "GAMEPLAN ADVISORY.",
      intro: "For institutions, companies and federations that want to do more with sport. Strategy, product, partnerships and delivery — run end to end by one team.",
      cta: "START A CONVERSATION",
      otherDoor: "JOIN THE VENTURE PROGRAM",

      audienceTitle: "WHO WE WORK WITH",
      audienceDesc: "Pick the one that sounds like you.",
      challengesLabel: "WHAT WE OFTEN HEAR",
      weRunLabel: "WHAT WE RUN FOR YOU",
      audiences: [
        {
          id: "institution", label: "Institutions", sub: "Government bodies, sports authorities, universities",
          headline: "Turn a national ambition into a programme that runs.",
          challenges: ["A strategy that still needs a delivery plan", "Many stakeholders, one deadline", "Programmes that have to show results"],
          weRun: ["Sport strategy, turned into a delivery plan", "Participation and community programmes", "Digital platforms and data", "National events and campaigns"],
          cta: "Start a brief for your institution",
        },
        {
          id: "company", label: "Companies", sub: "Brands, sponsors and investors entering sport",
          headline: "Find your place in sport — and make it pay back.",
          challenges: ["Sponsorships that don't move the business", "Unsure where to play in sport", "No in-house team to run it"],
          weRun: ["Sport market entry and positioning", "Sponsorship strategy and activation", "Products and content for fans", "Partnerships with clubs, athletes and leagues"],
          cta: "Start a brief for your company",
        },
        {
          id: "federation", label: "Federations", sub: "Federations, leagues and clubs",
          headline: "Grow the game, the fans and the revenue.",
          challenges: ["Income that relies on a few big deals", "Fans the federation can't reach directly", "Events that need to run like products"],
          weRun: ["Commercial and sponsorship programmes", "Fan apps, ticketing and membership", "Competitions and events", "Brand, content and media"],
          cta: "Start a brief for your federation",
        },
      ],

      capTitle: "WHAT WE DO",
      capDesc: "Six capabilities, one team. Pick one to see what you get.",
      deliverablesLabel: "YOU GET",
      capabilities: [
        { title: "Strategy", desc: "Where to play and how to win, turned into a plan people can act on.", deliverables: ["Market and stakeholder review", "Strategy and roadmap", "Business case and KPIs"] },
        { title: "Product & tech", desc: "Apps, platforms and data, built and run by our own team.", deliverables: ["Fan and member apps", "Ticketing and e-commerce", "Data dashboards"] },
        { title: "Brand & content", desc: "Identity, campaigns and content that sound like you.", deliverables: ["Brand identity and guidelines", "Campaigns and launches", "Social and video content"] },
        { title: "Partnerships", desc: "Sponsors, rights and commercial deals, found and delivered.", deliverables: ["Sponsorship packages", "Partner search and negotiation", "Activation plans"] },
        { title: "Events & delivery", desc: "Competitions, launches and programmes, run on the ground.", deliverables: ["Event concept and planning", "Operations on the day", "Post-event reporting"] },
        { title: "Data & insight", desc: "Know your fans, members and partners — and act on it.", deliverables: ["Audience research", "Reporting and dashboards", "Recommendations you can act on"] },
      ],

      modelTitle: "HOW WE CAN WORK TOGETHER",
      modelDesc: "Three ways in. We'll suggest one after the first conversation.",
      models: [
        { title: "Project", desc: "A defined outcome, a clear scope and an end date.", fit: "Best for a launch, a strategy or a single event." },
        { title: "Programme", desc: "A multi-stage effort we run end to end, phase by phase.", fit: "Best for transformations and multi-year plans." },
        { title: "Embedded team", desc: "Our people inside your organisation, for as long as you need.", fit: "Best when you need capacity and know-how fast." },
      ],

      processTitle: "HOW WE WORK",
      youGet: "AT THIS STAGE YOU GET",
      process: [
        { title: "Brief", desc: "We learn the goal, the constraints and what success looks like.", get: ["A shared, written brief", "Who's involved and who decides", "What success looks like, in numbers"] },
        { title: "Plan", desc: "One clear plan with owners, a timeline and a budget.", get: ["A phased plan", "Owners for every workstream", "Budget and milestones"] },
        { title: "Build", desc: "Our team makes it: product, brand, partnerships.", get: ["Weekly progress", "Work you can see and test", "Decisions made quickly"] },
        { title: "Run", desc: "We deliver, measure and keep improving it with you.", get: ["Live delivery", "Reporting against the goals", "A plan for what's next"] },
      ],

      whyTitle: "WHY GAMEPLAN",
      why: [
        { title: "Operators, not just advisors", desc: "We build and run things ourselves — products, brands, ventures." },
        { title: "One team, end to end", desc: "Strategy and delivery under one roof, so nothing gets lost in the handover." },
        { title: "Our heritage is in sport", desc: "We know the people, the calendars and the pressure." },
      ],
    },
  },

  ar: {
    back: "العودة إلى جيم بلان",
    home: "الرئيسية",
    step: "الخطوة",
    prev: "السابق",
    next: "التالي",
    nav: { venture: "برنامج المشاريع", advisory: "الاستشارات", contact: "تواصل معنا" },
    contact: {
      tag: "تواصل معنا",
      directTitle: "تفضّل الكتابة بنفسك؟",
      directDesc: "راسلنا مباشرة على",
      doorsTitle: "أو اذهب مباشرة إلى أحد البابين",
    },

    venture: {
      tag: "الباب ٠١ · للمؤسسين",
      title: "انضم إلى",
      accent: "برنامج المشاريع.",
      intro: "للمؤسسين الذين يبنون عند تقاطع الرياضة والتقنية والثقافة. ندعمك بالتمويل أو الخدمات أو كليهما مقابل حصة، ونبقى معك طوال رحلة البناء.",
      cta: "قدّم على البرنامج",
      otherDoor: "اعمل مع استشارات جيم بلان",
      ticker: ["التمويل", "المنتج", "التغليف", "التقنية", "التصنيع", "العلامة التجارية", "التوزيع", "الشبكة"],

      dealTitle: "صمّم اتفاقك",
      dealDesc: "نصيغ كل اتفاق حول ما تحتاجه الشركة. اختر المزيج لترى شكله.",
      dealNote: "كل ذلك مقابل حصة، بشروط نتفق عليها منذ البداية وبلغة واضحة.",
      dealEquity: "مقابل حصة",
      deal: [
        { id: "cash", label: "تمويل", headline: "رأس مال يوصلك إلى إنجازك التالي.", points: ["دعم بحجم الخطة، لا مبلغ ثابت", "إنجازات نتفق عليها معاً", "دعم على مستوى مجلس الإدارة من أشخاص بنوا من قبل"] },
        { id: "services", label: "خدمات", headline: "فريقنا يعمل كأنه فريقك.", points: ["تطوير المنتج والتغليف والتصنيع", "التقنية والعلامة والدخول إلى السوق", "خبراء كبار على عملك من البداية إلى النهاية"] },
        { id: "both", label: "كلاهما", headline: "رأس مال، وفريق يحسن إنفاقه.", points: ["تمويل مع تنفيذ عملي", "شريك واحد من التركيبة إلى الرف", "أعمق مستويات البرنامج"] },
      ],

      stageTitle: "أين أنت اليوم؟",
      stageDesc: "اختر مرحلتك، وسنريك أين نركّز جهدنا.",
      stages: [
        { id: "idea", label: "فكرة", headline: "اجعلها حقيقية بما يكفي لتُختبر.", desc: "نختبر الفكرة ونقدّر حجم الفرصة ونشكّل نسخة أولى تضعها أمام الناس.", focus: ["المفهوم والتموضع", "مواصفات المنتج الأولى", "خطة أول ٩٠ يوماً"] },
        { id: "proto", label: "نموذج أولي", headline: "من العيّنة إلى أول إنتاج.", desc: "نحوّل النموذج إلى منتج: التركيبة والتغليف والموردون وأول دفعة إنتاج.", focus: ["التركيبة والاختبار", "التغليف والموردون", "أول دفعة إنتاج"] },
        { id: "launched", label: "بعد الإطلاق", headline: "اصقلها وافتح الأبواب.", desc: "نعالج ما يبطئك ونصقل العلامة ونفتح الأبواب أمام التجزئة والشركاء والرياضيين.", focus: ["العلامة والمحتوى", "التجزئة والشركاء", "الرياضيون والمجتمع"] },
        { id: "growing", label: "نمو", headline: "توسّع دون أن تنكسر.", desc: "نوسّع التصنيع والتوزيع والفريق كي لا يكسر النمو الشركة.", focus: ["التصنيع على نطاق واسع", "التوزيع وأسواق جديدة", "الفريق والأنظمة"] },
      ],

      offerTitle: "ما الذي تحصل عليه",
      offerHint: "اضغط على البطاقة للمزيد",
      offer: [
        { title: "التمويل", desc: "دعم يوصلك إلى إنجازك الحقيقي التالي.", more: ["بحجم ما تحتاجه الخطة", "يُصرف مع الإنجازات المتفق عليها", "مساعدة في التحضير لجولتك التالية"] },
        { title: "الخدمات", desc: "فريقنا الداخلي على العمل الأهم.", more: ["تطوير المنتج والتغليف", "التقنية والتطبيقات والتجارة الإلكترونية", "التصنيع والموردون"] },
        { title: "الشبكة", desc: "الأشخاص الذين تحتاجهم للوصول إلى الرف والملعب.", more: ["رياضيون وأندية واتحادات", "شركاء التجزئة والتوزيع", "مصنّعون وموردون"] },
        { title: "المشغّلون", desc: "أشخاص بنوا وأطلقوا من قبل، إلى جانبك.", more: ["جلسات عمل أسبوعية", "مساعدة عملية لا نصائح فقط", "إجابات صريحة حين يصعب الأمر"] },
      ],

      journeyTitle: "كيف يعمل",
      journey: [
        { title: "قدّم", desc: "أخبرنا بما تبنيه ولمن، وأين وصلت اليوم." },
        { title: "نلتقي", desc: "جلسة عمل مع الفريق لاختبار الفكرة معاً." },
        { title: "نصيغ الاتفاق", desc: "تمويل أو خدمات أو كلاهما مقابل حصة، بشروط واضحة منذ البداية." },
        { title: "نبني", desc: "نبدأ العمل: من التركيبة إلى الرف، ومن الكود إلى الإطلاق." },
      ],

      proofTitle: "بُني مع جيم بلان",
      proof: [
        { name: "مومنتم", desc: "إلكتروليتات نقية، من التركيبة إلى الكيس إلى الرف.", tags: ["المنتج", "التغليف", "التقنية", "التصنيع", "العلامة"], chapter: "momentum" },
        { name: "أصل", desc: "ذهب حقيقي بلمسة واحدة.", chapter: "advisory" },
        { name: "كايرو تك", desc: "تحريك التربة وإدارة المعدات.", chapter: "ventures" },
      ],

      faqTitle: "أسئلة يطرحها المؤسسون",
      faq: [
        { q: "أي نوع من المؤسسين تدعمون؟", a: "مؤسسون يبنون في الرياضة والصحة والمنتجات الاستهلاكية والتقنية المحيطة بها، من الفكرة الأولى حتى نمو الإيرادات." },
        { q: "ما حجم الحصة التي تأخذونها؟", a: "يعتمد ذلك على مزيج التمويل والخدمات وعلى مرحلتك. نتفق عليه كتابياً قبل بدء أي عمل." },
        { q: "هل أحتفظ بالسيطرة على شركتي؟", a: "نعم. أنت من يدير شركتك، ونحن نعمل إلى جانبك كشريك تشغيلي." },
        { q: "هل يمكنني التقديم بفكرة فقط؟", a: "نعم. أخبرنا بما تبنيه ولماذا أنت الشخص المناسب لبنائه." },
        { q: "ماذا يحدث بعد التقديم؟", a: "نقرأ كل طلب. إذا بدا مناسباً، نتواصل معك لتحديد مكالمة أولى." },
      ],
    },

    advisory: {
      tag: "الباب ٠٢ · للمؤسسات والشركات والاتحادات",
      title: "اعمل مع",
      accent: "استشارات جيم بلان.",
      intro: "للمؤسسات والشركات والاتحادات التي تريد أن تحقق المزيد من خلال الرياضة. الاستراتيجية والمنتج والشراكات والتنفيذ، يديرها فريق واحد من البداية إلى النهاية.",
      cta: "ابدأ المحادثة",
      otherDoor: "انضم إلى برنامج المشاريع",

      audienceTitle: "مع من نعمل",
      audienceDesc: "اختر ما يشبهك.",
      challengesLabel: "ما نسمعه كثيراً",
      weRunLabel: "ما نديره لك",
      audiences: [
        {
          id: "institution", label: "المؤسسات", sub: "جهات حكومية وهيئات رياضية وجامعات",
          headline: "حوّل الطموح الوطني إلى برنامج يعمل.",
          challenges: ["استراتيجية ما زالت تحتاج خطة تنفيذ", "جهات معنية كثيرة وموعد نهائي واحد", "برامج يجب أن تُظهر نتائج"],
          weRun: ["استراتيجية رياضية تتحول إلى خطة تنفيذ", "برامج المشاركة والمجتمع", "منصات رقمية وبيانات", "فعاليات وحملات وطنية"],
          cta: "ابدأ موجزاً لمؤسستك",
        },
        {
          id: "company", label: "الشركات", sub: "علامات تجارية ورعاة ومستثمرون يدخلون عالم الرياضة",
          headline: "جد مكانك في الرياضة، واجعله يعود بالفائدة.",
          challenges: ["رعايات لا تحرّك الأعمال", "غموض حول أين تلعب في الرياضة", "لا يوجد فريق داخلي لإدارتها"],
          weRun: ["دخول سوق الرياضة والتموضع", "استراتيجية الرعاية وتفعيلها", "منتجات ومحتوى للجماهير", "شراكات مع الأندية والرياضيين والدوريات"],
          cta: "ابدأ موجزاً لشركتك",
        },
        {
          id: "federation", label: "الاتحادات", sub: "اتحادات ودوريات وأندية",
          headline: "نمِّ اللعبة والجماهير والإيرادات.",
          challenges: ["دخل يعتمد على صفقات كبيرة قليلة", "جماهير لا يصل إليها الاتحاد مباشرة", "فعاليات تحتاج أن تُدار كمنتجات"],
          weRun: ["برامج تجارية ورعاية", "تطبيقات الجماهير والتذاكر والعضوية", "المسابقات والفعاليات", "العلامة والمحتوى والإعلام"],
          cta: "ابدأ موجزاً لاتحادك",
        },
      ],

      capTitle: "ما الذي نقدّمه",
      capDesc: "ست قدرات وفريق واحد. اختر واحدة لترى ما تحصل عليه.",
      deliverablesLabel: "تحصل على",
      capabilities: [
        { title: "الاستراتيجية", desc: "أين نلعب وكيف نفوز، في خطة قابلة للتنفيذ.", deliverables: ["مراجعة السوق والجهات المعنية", "الاستراتيجية وخارطة الطريق", "دراسة الجدوى ومؤشرات الأداء"] },
        { title: "المنتج والتقنية", desc: "تطبيقات ومنصات وبيانات يبنيها ويشغّلها فريقنا.", deliverables: ["تطبيقات الجماهير والأعضاء", "التذاكر والتجارة الإلكترونية", "لوحات بيانات"] },
        { title: "العلامة والمحتوى", desc: "هوية وحملات ومحتوى يشبهك.", deliverables: ["الهوية وإرشاداتها", "الحملات والإطلاقات", "محتوى التواصل والفيديو"] },
        { title: "الشراكات", desc: "رعاة وحقوق وصفقات تجارية، نجدها وننفذها.", deliverables: ["باقات الرعاية", "البحث عن الشركاء والتفاوض", "خطط التفعيل"] },
        { title: "الفعاليات والتنفيذ", desc: "مسابقات وإطلاقات وبرامج، ندير تفاصيلها على أرض الواقع.", deliverables: ["مفهوم الفعالية والتخطيط", "التشغيل يوم الحدث", "تقارير ما بعد الفعالية"] },
        { title: "البيانات والرؤى", desc: "اعرف جماهيرك وأعضاءك وشركاءك، وتصرّف بناءً على ذلك.", deliverables: ["أبحاث الجمهور", "التقارير ولوحات البيانات", "توصيات قابلة للتنفيذ"] },
      ],

      modelTitle: "كيف يمكن أن نعمل معاً",
      modelDesc: "ثلاث طرق للبدء، نقترح إحداها بعد المحادثة الأولى.",
      models: [
        { title: "مشروع", desc: "نتيجة محددة ونطاق واضح وموعد انتهاء.", fit: "الأنسب لإطلاق أو استراتيجية أو فعالية واحدة." },
        { title: "برنامج", desc: "جهد متعدد المراحل نديره من البداية إلى النهاية، مرحلة بمرحلة.", fit: "الأنسب للتحولات والخطط متعددة السنوات." },
        { title: "فريق مدمج", desc: "أشخاصنا داخل مؤسستك، للمدة التي تحتاجها.", fit: "الأنسب حين تحتاج قدرة وخبرة بسرعة." },
      ],

      processTitle: "كيف نعمل",
      youGet: "في هذه المرحلة تحصل على",
      process: [
        { title: "الموجز", desc: "نفهم الهدف والقيود وشكل النجاح.", get: ["موجز مكتوب ومشترك", "من المعنيون ومن يقرر", "شكل النجاح بالأرقام"] },
        { title: "الخطة", desc: "خطة واحدة واضحة بمسؤولين وجدول زمني وميزانية.", get: ["خطة على مراحل", "مسؤول لكل مسار عمل", "الميزانية والمحطات"] },
        { title: "البناء", desc: "فريقنا ينفذ: المنتج والعلامة والشراكات.", get: ["تقدّم أسبوعي", "عمل تراه وتختبره", "قرارات سريعة"] },
        { title: "التشغيل", desc: "ننفذ ونقيس ونطوّر معك باستمرار.", get: ["تنفيذ مباشر", "تقارير مقابل الأهداف", "خطة للخطوة التالية"] },
      ],

      whyTitle: "لماذا جيم بلان",
      why: [
        { title: "مشغّلون لا مستشارون فقط", desc: "نبني ونشغّل بأنفسنا: منتجات وعلامات ومشاريع." },
        { title: "فريق واحد من البداية إلى النهاية", desc: "الاستراتيجية والتنفيذ تحت سقف واحد، فلا يضيع شيء في التسليم." },
        { title: "إرثنا في الرياضة", desc: "نعرف الناس والمواعيد والضغط." },
      ],
    },
  },
};
