export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const chapters = ["home", "about", "ventures", "advisory", "momentum", "process", "apply"] as const;
export type Chapter = (typeof chapters)[number];
export const dictionaries = {
  en: {
    formOrigin: "AN IDEA TAKES SHAPE", formSports: "THE WORLD OF SPORT", formLoader: "BUILT IN THE REAL WORLD", formVault: "VALUE THAT LASTS", formHint: "MOVE YOUR CURSOR TO DISTURB THE PARTICLES",
    menu: "CHAPTERS", skip: "SKIP TO APPLY", explore: "EXPLORE THE WORK", sound: "SOUND",
    backToTop: "Gameplan, back to top", primaryNavigation: "Primary navigation", muteSounds: "Mute sounds", enableSounds: "Enable sounds", switchLanguage: "Switch to Arabic", chapterProgress: "Chapter progress", goTo: "Go to", blueprintCaption: "FIG. 01 / IDEA → IMPACT", mindset: "[ THE GAMEPLAN MINDSET ]", view: "VIEW", top: "TOP", tap: "TAP", heroSignoff: "EST. FOR WHAT'S NEXT", emailSubject: "Let's build something",
    eyebrow: "INDEPENDENT IDEAS. REAL-WORLD IMPACT.", heroA: "WE DON'T", heroB: "PLAY SMALL.", heroDesc: "We build, back and accelerate ambitious ideas at the intersection of sport, technology and culture.",
    scroll: "SCROLL TO EXPLORE", aboutTag: "01 / OUR THINKING", aboutTitle: "THE FUTURE ISN'T FOUND.", aboutAccent: "IT'S BUILT.", aboutDesc: "Gameplan is a creative venture company. We turn bold thinking into businesses, products and experiences that move people forward.",
    venturesTag: "02 / WHAT WE BUILD", venturesTitle: "BUILT TO", venturesAccent: "MOVE.", venturesDesc: "From the first spark to the final detail, we turn promising ideas into things people actually use.",
    ventureOne: "NEW VENTURES", ventureOneDesc: "Building category-defining companies from zero to one.",
    ventureTwo: "DIGITAL PRODUCTS", ventureTwoDesc: "Crafting technology that makes the complex feel effortless.",
    ventureThree: "BRAND EXPERIENCES", ventureThreeDesc: "Creating identities and moments that people remember.",
    advisoryTag: "03 / HOW WE HELP", advisoryTitle: "THINK BIGGER.", advisoryAccent: "MOVE FASTER.", advisoryDesc: "The right combination of strategy, design and technology can change the trajectory of an idea.",
    advisoryOne: "STRATEGY & POSITIONING", advisoryTwo: "PRODUCT & TECHNOLOGY", advisoryThree: "GROWTH & EXECUTION",
    momentumTag: "04 / CASE STUDY", momentumTitle: "MOMENTUM.", momentumAccent: "HYDRATION IN MOTION.", momentumDesc: "Clean electrolytes for everyday wins. Built by Gameplan from formula to sachet to shelf.", momentumServices: "PRODUCT DEVELOPMENT · PACKAGING · MANUFACTURING · BRAND · E-COMMERCE", momentumFlavour: "PINK LEMONADE",
    processTag: "05 / OUR APPROACH", processTitle: "FROM WHAT IF", processAccent: "TO WHAT'S NEXT.", processDesc: "A simple process. No unnecessary theatre. Just thoughtful work and relentless execution.",
    stepOne: "DISCOVER", stepOneDesc: "Find the opportunity worth pursuing.", stepTwo: "DESIGN", stepTwoDesc: "Shape a clear, compelling direction.", stepThree: "BUILD", stepThreeDesc: "Make it real, test it, refine it.", stepFour: "LAUNCH", stepFourDesc: "Put it in the world and keep moving.",
    applyTag: "06 / LET'S MAKE SOMETHING", applyTitle: "GOT A", applyAccent: "GAMEPLAN?", applyDesc: "Have an idea, a challenge or an ambitious project? Let's make the next move together.", applyCta: "START A CONVERSATION", footer: "IDEAS INTO ACTION.",
    home: "HOME", about: "ABOUT", ventures: "VENTURES", advisory: "ADVISORY", momentum: "MOMENTUM", process: "PROCESS", apply: "APPLY", replay: "REPLAY INTRO",
  },
  ar: {
    formOrigin: "الفكرة تتشكل", formSports: "عالم الرياضة", formLoader: "نبني على أرض الواقع", formVault: "قيمة تدوم", formHint: "حرّك المؤشر لتتفاعل الجزيئات",
    menu: "الفصول", skip: "انتقل للتواصل", explore: "اكتشف أعمالنا", sound: "الصوت",
    backToTop: "جيم بلان، العودة إلى الأعلى", primaryNavigation: "التنقل الرئيسي", muteSounds: "كتم الصوت", enableSounds: "تشغيل الصوت", switchLanguage: "التبديل إلى الإنجليزية", chapterProgress: "تقدم الفصول", goTo: "انتقل إلى", blueprintCaption: "رسم ٠١ / من الفكرة إلى الأثر", mindset: "[ عقلية جيم بلان ]", view: "عرض", top: "الأعلى", tap: "اضغط", heroSignoff: "لما هو قادم", emailSubject: "لنصنع شيئاً معاً",
    eyebrow: "أفكار مستقلة. أثر حقيقي.", heroA: "طموحنا", heroB: "بلا حدود.", heroDesc: "نبني وندعم ونسرّع الأفكار الطموحة عند تقاطع الرياضة والتقنية والثقافة.",
    scroll: "مرّر للاستكشاف", aboutTag: "٠١ / رؤيتنا", aboutTitle: "المستقبل لا ننتظره.", aboutAccent: "بل نصنعه.", aboutDesc: "جيم بلان شركة لبناء المشاريع الإبداعية. نحوّل الأفكار الجريئة إلى شركات ومنتجات وتجارب تصنع الفرق.",
    venturesTag: "٠٢ / ما نبنيه", venturesTitle: "نبتكر كي", venturesAccent: "نتقدم.", venturesDesc: "من الشرارة الأولى إلى أدق التفاصيل، نحوّل الأفكار الواعدة إلى حلول يستخدمها الناس.",
    ventureOne: "مشاريع جديدة", ventureOneDesc: "نبني شركات طموحة من الفكرة إلى الانطلاق.",
    ventureTwo: "منتجات رقمية", ventureTwoDesc: "نصمم تقنيات تجعل المعقد بسيطاً.",
    ventureThree: "تجارب العلامات", ventureThreeDesc: "نصنع هويات وتجارب تبقى في الذاكرة.",
    advisoryTag: "٠٣ / كيف نساعد", advisoryTitle: "فكّر أبعد.", advisoryAccent: "تحرّك أسرع.", advisoryDesc: "الاستراتيجية والتصميم والتقنية معاً قادرة على تغيير مسار أي فكرة.",
    advisoryOne: "الاستراتيجية والتموضع", advisoryTwo: "المنتجات والتقنية", advisoryThree: "النمو والتنفيذ",
    momentumTag: "٠٤ / دراسة حالة", momentumTitle: "مومنتم.", momentumAccent: "ترطيب يواكب حركتك.", momentumDesc: "إلكتروليتات نقية لإنجازات كل يوم. بنتها جيم بلان من التركيبة إلى الكيس إلى رف المتجر.", momentumServices: "تطوير المنتج · التغليف · التصنيع · العلامة التجارية · التجارة الإلكترونية", momentumFlavour: "ليموناضة وردية",
    processTag: "٠٥ / منهجيتنا", processTitle: "من ماذا لو", processAccent: "إلى الخطوة التالية.", processDesc: "عملية واضحة بلا تعقيد غير ضروري. عمل مدروس وتنفيذ مستمر.",
    stepOne: "نكتشف", stepOneDesc: "نحدد الفرصة التي تستحق السعي.", stepTwo: "نصمم", stepTwoDesc: "نرسم اتجاهاً واضحاً ومقنعاً.", stepThree: "نبني", stepThreeDesc: "ننفذ ونختبر ونحسن.", stepFour: "نطلق", stepFourDesc: "ننطلق إلى العالم ونواصل التقدم.",
    applyTag: "٠٦ / لنصنع شيئاً", applyTitle: "عندك", applyAccent: "خطة؟", applyDesc: "لديك فكرة أو تحدٍ أو مشروع طموح؟ لنبدأ الخطوة التالية معاً.", applyCta: "ابدأ المحادثة", footer: "من الفكرة إلى التنفيذ.",
    home: "الرئيسية", about: "من نحن", ventures: "المشاريع", advisory: "الاستشارات", momentum: "مومنتم", process: "المنهجية", apply: "تواصل", replay: "إعادة المقدمة",
  },
};

export type Dictionary = (typeof dictionaries)[Locale];
export const hasLocale = (value: string): value is Locale => locales.some((locale) => locale === value);
