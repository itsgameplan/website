export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const chapters = ["home", "ventures", "advisory", "momentum", "about", "process", "apply"] as const;
export type Chapter = (typeof chapters)[number];
export const dictionaries = {
  en: {
    formOrigin: "AN IDEA TAKES SHAPE", formSports: "THE WORLD OF SPORT", formLoader: "BUILT IN THE REAL WORLD", formVault: "VALUE THAT LASTS", formHint: "MOVE YOUR CURSOR TO DISTURB THE PARTICLES",
    menu: "CHAPTERS", skip: "SKIP TO APPLY", explore: "EXPLORE THE WORK", sound: "SOUND",
    backToTop: "Gameplan, back to top", primaryNavigation: "Primary navigation", muteSounds: "Mute sounds", enableSounds: "Enable sounds", switchLanguage: "Switch to Arabic", chapterProgress: "Chapter progress", goTo: "Go to", blueprintCaption: "FIG. 01 / IDEA → IMPACT", mindset: "[ WHERE IT ALL STARTED ]", view: "VIEW", top: "TOP", tap: "TAP", heroSignoff: "EST. FOR WHAT'S NEXT", emailSubject: "Let's build something",
    eyebrow: "INDEPENDENT IDEAS. REAL-WORLD IMPACT.", heroA: "INNOVATION", heroB: "IS IN OUR DNA.", heroDesc: "We build, back and accelerate ambitious ideas at the intersection of sport, technology and culture.",
    scroll: "SCROLL TO EXPLORE", aboutTag: "04 / OUR HERITAGE", aboutTitle: "OUR HERITAGE", aboutAccent: "STARTED IN SPORT.", aboutDesc: "We create the strategy, the team and the tech infrastructure behind it.",
    venturesTag: "01 / EARTH MOVING & MINING", venturesTitle: "EARTH MOVING", venturesAccent: "AND MINING.", venturesDesc: "Cairo Tech is an earth moving and equipment management company. It puts the right heavy machinery on site, keeps every machine working and tracks the whole fleet, from the first dig to the final grade.", venturesCoords: "N 30°02′48″ · E 31°14′09″ · ELEV 23 M", cairoName: "CAIRO TECH", diagramCourse: "COURSE 4/4", diagramTol: "TOL ±0.5 MM", diagramBase: "BASE 230.4 M", diagramHeight: "H 146.6 M", diagramTitle: "CAIRO TECH · DWG CT-04 · SCALE 1:500",
    ventureOne: "NEW VENTURES", ventureOneDesc: "Building category-defining companies from zero to one.",
    ventureTwo: "DIGITAL PRODUCTS", ventureTwoDesc: "Crafting technology that makes the complex feel effortless.",
    ventureThree: "BRAND EXPERIENCES", ventureThreeDesc: "Creating identities and moments that people remember.",
    advisoryTag: "02 / ASL · DIGITAL GOLD", advisoryTitle: "REAL GOLD.", advisoryAccent: "ONE TAP AWAY.", advisoryDesc: "ASL is the gold buying app that puts real gold in your pocket. Buy in seconds, track it live and hold value that lasts.",
    advisoryOne: "INVEST", advisoryTwo: "SECURITY & SAFETY", advisoryThree: "ECONOMIC GROWTH & STABILITY",
    momentumTag: "03 / CASE STUDY", momentumTitle: "MOMENTUM:", momentumAccent: "CLEAN ELECTROLYTES FOR EVERYDAY WINS.", momentumDesc: "Built by Gameplan from formula to sachet to shelf.", momentumServices: "PRODUCT DEVELOPMENT · PACKAGING · MANUFACTURING · BRAND · E-COMMERCE", momentumFlavour: "PINK LEMONADE", momentumCta: "VIEW MOMENTUM",
    processTag: "05 / YOUR TURN", processTitle: "YOUR TURN.", processAccent: "TO WHAT'S NEXT.", processDesc: "Two doors. Pick the one that fits.",
    stepOne: "DISCOVER", stepOneDesc: "Find the opportunity worth pursuing.", stepTwo: "DESIGN", stepTwoDesc: "Shape a clear, compelling direction.", stepThree: "BUILD", stepThreeDesc: "Make it real, test it, refine it.", stepFour: "LAUNCH", stepFourDesc: "Put it in the world and keep moving.",
    applyTag: "06 / CONTACT", applyTitle: "GOT A", applyAccent: "GAMEPLAN?", applyDesc: "Have an idea, a challenge or an ambitious project? Let's make the next move together.", applyCta: "START A CONVERSATION", footer: "IDEAS INTO ACTION.",
    home: "HOME", about: "HERITAGE", ventures: "CAIRO TECH", advisory: "ASL", momentum: "MOMENTUM", process: "YOUR TURN", apply: "CONTACT", replay: "REPLAY INTRO",
    aboutCta: "VIEW OUR LATEST ACHIEVEMENT", aslAppStoreSmall: "Download on the", aslAppStore: "App Store", aslPlaySmall: "Get it on", aslPlay: "Google Play", aslWebsite: "VISIT WEBSITE", momentumBuilt: "WE HELP DEVELOP", mProduct: "Product development", mPackaging: "Packaging", mTech: "Tech", mManufacturing: "Manufacturing", mBrand: "Brand", doorLabel: "DOOR", doorOneTitle: "JOIN THE VENTURE PROGRAM", doorOneDesc: "For founders. Cash, services or both, for equity.", doorTwoTitle: "WORK WITH GAMEPLAN ADVISORY", doorTwoDesc: "For federations and brands. We run it end to end.", doorEnter: "OPEN THE DOOR",
    footerTitle: "LET'S MAKE THE NEXT MOVE.", footerExplore: "EXPLORE", footerWork: "WORK WITH US", footerFollow: "FOLLOW", footerRights: "ALL RIGHTS RESERVED.", footerTop: "BACK TO TOP",
  },
  ar: {
    formOrigin: "الفكرة تتشكل", formSports: "عالم الرياضة", formLoader: "نبني على أرض الواقع", formVault: "قيمة تدوم", formHint: "حرّك المؤشر لتتفاعل الجزيئات",
    menu: "الفصول", skip: "انتقل للتواصل", explore: "اكتشف أعمالنا", sound: "الصوت",
    backToTop: "جيم بلان، العودة إلى الأعلى", primaryNavigation: "التنقل الرئيسي", muteSounds: "كتم الصوت", enableSounds: "تشغيل الصوت", switchLanguage: "التبديل إلى الإنجليزية", chapterProgress: "تقدم الفصول", goTo: "انتقل إلى", blueprintCaption: "رسم ٠١ / من الفكرة إلى الأثر", mindset: "[ حيث بدأ كل شيء ]", view: "عرض", top: "الأعلى", tap: "اضغط", heroSignoff: "لما هو قادم", emailSubject: "لنصنع شيئاً معاً",
    eyebrow: "أفكار مستقلة. أثر حقيقي.", heroA: "ابتكار", heroB: "في جيناتنا.", heroDesc: "نبني وندعم ونسرّع الأفكار الطموحة عند تقاطع الرياضة والتقنية والثقافة.",
    scroll: "مرّر للاستكشاف", aboutTag: "٠٤ / إرثنا", aboutTitle: "إرثنا", aboutAccent: "بدأ في الرياضة.", aboutDesc: "نصنع الاستراتيجية والفريق والبنية التقنية التي تقف خلفها.",
    venturesTag: "٠١ / تحريك التربة والتعدين", venturesTitle: "تحريك التربة", venturesAccent: "والتعدين.", venturesDesc: "كايرو تك شركة متخصصة في أعمال تحريك التربة وإدارة المعدات. توفّر الآلات الثقيلة المناسبة في الموقع، وتحافظ على جاهزية كل آلة، وتتابع الأسطول بالكامل من أول حفر حتى التسوية النهائية.", venturesCoords: "N 30°02′48″ · E 31°14′09″ · ELEV 23 M", cairoName: "كايرو تك", diagramCourse: "المدماك ٤/٤", diagramTol: "تفاوت ±٠٫٥ مم", diagramBase: "القاعدة ٢٣٠٫٤ م", diagramHeight: "الارتفاع ١٤٦٫٦ م", diagramTitle: "كايرو تك · لوحة CT-04 · مقياس ١:٥٠٠",
    ventureOne: "مشاريع جديدة", ventureOneDesc: "نبني شركات طموحة من الفكرة إلى الانطلاق.",
    ventureTwo: "منتجات رقمية", ventureTwoDesc: "نصمم تقنيات تجعل المعقد بسيطاً.",
    ventureThree: "تجارب العلامات", ventureThreeDesc: "نصنع هويات وتجارب تبقى في الذاكرة.",
    advisoryTag: "٠٢ / أصل · الذهب الرقمي", advisoryTitle: "ذهب حقيقي.", advisoryAccent: "بلمسة واحدة.", advisoryDesc: "أصل تطبيق لشراء الذهب يضع الذهب الحقيقي في جيبك. اشترِ في ثوانٍ، وتابع قيمته لحظة بلحظة، واحتفظ بقيمة تدوم.",
    advisoryOne: "استثمر", advisoryTwo: "الأمان والحماية", advisoryThree: "النمو والاستقرار الاقتصادي",
    momentumTag: "٠٣ / دراسة حالة", momentumTitle: "مومنتم:", momentumAccent: "إلكتروليتات نقية لإنجازات كل يوم.", momentumDesc: "بنتها جيم بلان من التركيبة إلى الكيس إلى رف المتجر.", momentumServices: "تطوير المنتج · التغليف · التصنيع · العلامة التجارية · التجارة الإلكترونية", momentumFlavour: "ليموناضة وردية", momentumCta: "زوروا موقع مومنتم",
    processTag: "٠٥ / دورك", processTitle: "دورك الآن.", processAccent: "إلى الخطوة التالية.", processDesc: "بابان. اختر ما يناسبك.",
    stepOne: "نكتشف", stepOneDesc: "نحدد الفرصة التي تستحق السعي.", stepTwo: "نصمم", stepTwoDesc: "نرسم اتجاهاً واضحاً ومقنعاً.", stepThree: "نبني", stepThreeDesc: "ننفذ ونختبر ونحسن.", stepFour: "نطلق", stepFourDesc: "ننطلق إلى العالم ونواصل التقدم.",
    applyTag: "٠٦ / تواصل", applyTitle: "عندك", applyAccent: "خطة؟", applyDesc: "لديك فكرة أو تحدٍ أو مشروع طموح؟ لنبدأ الخطوة التالية معاً.", applyCta: "ابدأ المحادثة", footer: "من الفكرة إلى التنفيذ.",
    home: "الرئيسية", about: "الإرث", ventures: "كايرو تك", advisory: "أصل", momentum: "مومنتم", process: "دورك", apply: "تواصل", replay: "إعادة المقدمة",
    aboutCta: "شاهد أحدث إنجازاتنا", aslAppStoreSmall: "حمّله من", aslAppStore: "App Store", aslPlaySmall: "احصل عليه من", aslPlay: "Google Play", aslWebsite: "زيارة الموقع", momentumBuilt: "نساعد في تطوير", mProduct: "تطوير المنتج", mPackaging: "التغليف", mTech: "التقنية", mManufacturing: "التصنيع", mBrand: "العلامة التجارية", doorLabel: "الباب", doorOneTitle: "انضم إلى برنامج المشاريع", doorOneDesc: "للمؤسسين. تمويل أو خدمات أو كلاهما، مقابل حصة.", doorTwoTitle: "اعمل مع استشارات جيم بلان", doorTwoDesc: "للاتحادات والعلامات التجارية. ندير كل شيء من البداية إلى النهاية.", doorEnter: "افتح الباب",
    footerTitle: "لنصنع الخطوة التالية.", footerExplore: "استكشف", footerWork: "اعمل معنا", footerFollow: "تابعنا", footerRights: "جميع الحقوق محفوظة.", footerTop: "العودة للأعلى",
  },
};

export type Dictionary = (typeof dictionaries)[Locale];
export const hasLocale = (value: string): value is Locale => locales.some((locale) => locale === value);
