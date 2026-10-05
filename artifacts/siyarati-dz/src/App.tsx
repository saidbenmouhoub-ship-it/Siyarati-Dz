import { useEffect, useMemo, useRef, useState } from 'react';
import { getDecodeVinQueryKey, useDecodeVin, type VinDecodeResponse } from '@workspace/api-client-react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeCheck, Calculator, CarFront, Check, ChevronRight, ClipboardCheck, Copy, FileText, Info, LoaderCircle, LockKeyhole, MessageCircle, ShieldCheck, X } from 'lucide-react';

type Lang = 'fr' | 'ar';
type Status = 'ok' | 'attn' | 'crit';
type Category = 'engine' | 'body' | 'electronics' | 'documents';
type Vehicle = { data: VinDecodeResponse | null; series: string; registrationYear: string; wilaya: string };
type Valuation = { year: number; mileage: number; condition: string; low: number; market: number; high: number };
type QuoteCoverage = 'thirdSimple' | 'thirdCollision' | 'comprehensive';
const insurers = ['SAA','CAAT','CIAR','Alliance Assurances','CASH Assurances','Trust Assurances'] as const;
type Insurer = typeof insurers[number];
type QuoteRequest = { name: string; phone: string; wilaya: string; agency: Insurer; make: string; model: string; year: string; vin: string; cover: QuoteCoverage };
type PaymentDemo = { method: string; rip: string; unlocked: boolean };

const insurerWhatsappNumbers: Record<Insurer, string> = {
  SAA: '213560001234',
  CAAT: '213560902635',
  CIAR: '213661765379',
  'Alliance Assurances': '213550685050',
  'CASH Assurances': '213550123456',
  'Trust Assurances': '213770123456',
};

const text = {
  fr: {
    navVehicle: 'Identifier', navValue: 'Estimer', navCheck: 'Inspection', navInsurance: 'Assurance', navReport: 'Rapport',
    demo: 'DÉMO LOCALE', brandSubtitle: 'AUTO, EN CLAIR', heroTag: 'ACHAT AUTO, EN TOUTE CLARTÉ', heroTitle: <>Achetez mieux.<br/><em>Roulez serein.</em></>,
    heroBody: 'Les bons réflexes avant de signer. Identifiez, estimez et inspectez votre prochain véhicule avec des repères pensés pour le marché algérien.',
    start: 'Commencer l’inspection', estimate: 'Estimer un prix', health: 'ÉTAT DU CONTRÔLE', carLabel: 'Votre prochain véhicule', carMeta: 'Inspection personnelle · Algérie', score: 'À vérifier',
    idTitle: 'Identifier le véhicule', idIntro: 'VIN ou immatriculation : rassemblez les informations utiles avant votre visite.',
    vin: 'Numéro VIN (17 caractères)', series: 'Série d’immatriculation', year: 'Année', registrationYear: 'Année d’immatriculation', wilaya: 'Wilaya', seriesPlaceholder: 'Ex. 123 · 456 · 78', vinPlaceholder: 'Ex. 5UXWX7C5… (17 caractères)', choose: 'Sélectionner',
    vinOrRegistration: 'Saisissez un VIN valide ou renseignez les trois champs d’immatriculation.', notProvided: 'Non renseigné',
    decode: 'Décoder avec la NHTSA', decodeLoading: 'Interrogation de la NHTSA…', decodeFailed: 'Impossible de joindre le service NHTSA. Réessayez dans un instant.',
    sheet: 'Données constructeur vPIC', registrationOnly: 'Immatriculation enregistrée', noManufacturerFound: 'Aucun décodage constructeur complet',
    registrationNotice: 'La NHTSA ne décode pas les immatriculations algériennes. Saisissez le VIN pour demander les données constructeur.',
    localDemo: 'Le VIN saisi est transmis à l’API publique vPIC de la NHTSA. La couverture varie selon le constructeur, surtout hors des États-Unis. Un champ vide signifie « donnée non disponible », pas « équipement absent ». Vérifiez toujours les documents.',
    make: 'Marque', model: 'Modèle', modelSeries: 'Série constructeur', engine: 'Motorisation', trim: 'Finition', equipment: 'Équipements de sécurité retournés par vPIC', country: 'Pays d’assemblage', plant: 'Usine / lieu d’assemblage', fuel: 'Carburant', gearbox: 'Transmission', bodyClass: 'Type de carrosserie', apiNotReturned: 'Non renseigné par vPIC', noSafetyData: 'Aucune donnée de sécurité retournée', sourceNhtsa: 'Source : NHTSA vPIC',
    valuationTitle: 'Une fourchette, pas une promesse', valuationIntro: 'Un repère rapide en dinars, basé sur l’année, le kilométrage et l’état déclaré.',
    calcTitle: 'Paramètres d’estimation', mileage: 'Kilométrage (km)', condition: 'État général', excellent: 'Très bon', good: 'Bon', fair: 'À prévoir', calculate: 'Calculer l’estimation', estimation: 'Estimation indicative', market: 'Valeur centrale', low: 'Fourchette basse', high: 'Fourchette haute', rangeDisclaimer: 'Repère de démonstration uniquement · le marché réel varie selon la version, l’historique et la région.',
    inspectionTitle: 'Votre inspection en 50 points', inspectionIntro: 'Faites le tour du véhicule. Chaque point passe de conforme à attention ou critique.',
    allOk: 'Aucun point renseigné', inspected: 'points vérifiés', okay: 'Conforme', attention: 'Attention', critical: 'Critique', reset: 'Tout réinitialiser',
    categories: { engine: 'Moteur & mécanique', body: 'Carrosserie & châssis', electronics: 'Électricité & confort', documents: 'Documents & historique' },
    insuranceTitle: 'Demander un devis d’assurance', insuranceIntro: 'Choisissez votre agence et préparez une demande avec les informations de votre véhicule.',
    contactInfo: 'Votre demande', fullName: 'Nom et prénom', phone: 'Numéro de téléphone', vehicle: 'Véhicule', cover: 'Type de couverture', thirdSimple: 'Tiers Simple', thirdCollision: 'Tiers Collision', comprehensive: 'Tous Risques', agency: 'Agence préférée', requestOffers: 'Envoyer ma demande de devis', quoteResults: 'Résumé de la demande', annual: 'par an, à titre indicatif', quoteNotice: 'Les informations ne seront partagées qu’après ouverture de WhatsApp et confirmation de l’envoi par vos soins.',
    vehicleDetails: 'Informations du véhicule', agencyHint: 'Choisissez une seule agence. Le lien WhatsApp sera adressé à son contact.', quoteVehicleHint: 'Si vous avez décodé un VIN, ces champs sont préremplis. Vous pouvez les corriger ou saisir le véhicule manuellement.', quoteModalTitle: 'Confirmez votre demande', quoteModalBody: 'WhatsApp va s’ouvrir avec le message prérempli pour l’agence choisie. Vérifiez les détails puis appuyez sur Envoyer dans WhatsApp.', sendViaWhatsapp: 'Envoyer ma demande via WhatsApp', insurer: 'Agence', modelYearLabel: 'Année-modèle', vinOptional: 'VIN (facultatif)', selectAgency: 'Sélectionner une agence',
    reportTitle: 'Le rapport complet, à portée de main', reportBody: 'Débloquez la synthèse d’inspection, les points à négocier et votre fiche véhicule sur cette page.', unlock: 'Débloquer le rapport', unlocked: 'Rapport de démonstration débloqué', unlockedBody: 'Votre synthèse locale est prête. Les données restent sur cette page et ne constituent pas une expertise certifiée.',
    reportSummary: 'Votre synthèse', reportSummaryBody: 'Examinez les éléments signalés pendant la visite, demandez les factures d’entretien et faites contrôler le véhicule par un professionnel indépendant avant achat.',
    footerDemo: 'Le VIN est transmis à NHTSA uniquement pour le décodage. Les autres données de cette démonstration restent locales.', footerMade: 'Des repères utiles, sans fausse promesse.',
    modalTitle: 'Débloquer votre rapport', modalSubtitle: 'Choisissez une méthode de démonstration. Aucun paiement ne sera effectué.',
    methods: { baridi: 'BaridiMob', edahabia: 'Edahabia', flexy: 'Flexy' }, ripTitle: 'RIP fictif de démonstration', copy: 'Copier', copied: 'Copié', fakeRip: '000-000-000000000000-DEMO',
    payNotice: 'Démo uniquement : aucune donnée de carte, compte ou paiement n’est collectée. Rien ne sera débité. Ce RIP est explicitement fictif.',
    simulatePay: 'Simuler le déblocage', cancel: 'Annuler', paymentDone: 'Déblocage simulé. Aucun paiement réel n’a eu lieu.',
    invalidVin: 'Le VIN doit contenir exactement 17 caractères alphanumériques (sans I, O ni Q).', invalidRegistration: 'Saisissez la série, l’année et la wilaya.', invalidValuation: 'Vérifiez l’année et le kilométrage.', invalidPhone: 'Saisissez un numéro de téléphone algérien valide.', invalidQuote: 'Complétez votre nom, votre wilaya, l’agence et les informations requises du véhicule.',
    vinLabel: 'VIN', plateLabel: 'Immatriculation', yearLabel: 'Année-modèle', months: 'Mois', simulated: 'SIMULÉ', close: 'Fermer', vehiclePlaceholder: 'Ex. Renault Clio 4 1.5 dCi',
  },
  ar: {
    navVehicle: 'بيانات السيارة', navValue: 'التقييم', navCheck: 'الفحص', navInsurance: 'التأمين', navReport: 'التقرير',
    demo: 'عرض تجريبي محلي', brandSubtitle: 'معلومات السيارة بثقة', heroTag: 'شراء السيارات بكل وضوح', heroTitle: <>اشترِ بذكاء.<br/><em>وقُد باطمئنان.</em></>,
    heroBody: 'خطوات عملية قبل التوقيع. تعرّف على سيارتك القادمة، وقدّر سعرها وافحصها بمؤشرات تناسب السوق الجزائري.',
    start: 'ابدأ الفحص', estimate: 'قدّر السعر', health: 'حالة الفحص', carLabel: 'سيارتك القادمة', carMeta: 'فحص شخصي · الجزائر', score: 'تحتاج إلى التحقق',
    idTitle: 'التعرّف على السيارة', idIntro: 'رقم الهيكل أو التسجيل: اجمع المعلومات المهمة قبل المعاينة.',
    vin: 'رقم الهيكل VIN (17 خانة)', series: 'سلسلة التسجيل', year: 'السنة', registrationYear: 'سنة التسجيل', wilaya: 'الولاية', seriesPlaceholder: 'مثال: 123 · 456 · 78', vinPlaceholder: 'مثال: 5UXWX7C5… (17 خانة)', choose: 'اختر',
    vinOrRegistration: 'أدخل رقم هيكل صحيحاً أو أكمل حقول التسجيل الثلاثة.', notProvided: 'غير محدد',
    decode: 'فك الرقم عبر NHTSA', decodeLoading: 'جارٍ الاتصال بـ NHTSA…', decodeFailed: 'تعذر الاتصال بخدمة NHTSA. حاول مجدداً بعد قليل.',
    sheet: 'بيانات الشركة المصنّعة من vPIC', registrationOnly: 'تم إدخال بيانات التسجيل', noManufacturerFound: 'لم يتم العثور على بيانات كاملة للشركة المصنّعة',
    registrationNotice: 'لا تفك NHTSA أرقام التسجيل الجزائرية. أدخل رقم الهيكل لطلب بيانات الشركة المصنّعة.',
    localDemo: 'يُرسل رقم الهيكل إلى واجهة vPIC العامة التابعة لـ NHTSA. تختلف التغطية حسب الشركة المصنّعة، خصوصاً خارج الولايات المتحدة. تعني الخانة الفارغة أن البيانات غير متاحة، لا أن التجهيز غير موجود. تحقّق دائماً من الوثائق.',
    make: 'العلامة', model: 'الطراز', modelSeries: 'سلسلة الشركة المصنّعة', engine: 'المحرك', trim: 'الفئة', equipment: 'تجهيزات السلامة التي أعادتها vPIC', country: 'بلد التجميع', plant: 'المصنع / موقع التجميع', fuel: 'الوقود', gearbox: 'ناقل الحركة', bodyClass: 'نوع الهيكل', apiNotReturned: 'لم ترد قيمة من vPIC', noSafetyData: 'لم ترد بيانات عن السلامة', sourceNhtsa: 'المصدر: NHTSA vPIC',
    valuationTitle: 'نطاق سعري لا وعد بالبيع', valuationIntro: 'مؤشر سريع بالدينار حسب السنة والمسافة المقطوعة والحالة المعلنة.',
    calcTitle: 'معايير التقييم', mileage: 'المسافة المقطوعة (كم)', condition: 'الحالة العامة', excellent: 'جيدة جداً', good: 'جيدة', fair: 'تحتاج إلى صيانة', calculate: 'احسب التقدير', estimation: 'تقدير إرشادي', market: 'القيمة المتوسطة', low: 'الحد الأدنى', high: 'الحد الأعلى', rangeDisclaimer: 'مؤشر تجريبي فقط · يختلف السوق الفعلي حسب النسخة والسجل والمنطقة.',
    inspectionTitle: 'قائمة فحص من 50 نقطة', inspectionIntro: 'افحص السيارة نقطةً نقطة. اختر سليم أو انتباه أو حرج لكل بند.',
    allOk: 'لم تسجل أي نقطة', inspected: 'نقطة مفحوصة', okay: 'سليم', attention: 'انتباه', critical: 'حرج', reset: 'إعادة ضبط الكل',
    categories: { engine: 'المحرك والميكانيك', body: 'الهيكل والطلاء', electronics: 'الكهرباء والراحة', documents: 'الوثائق والسجل' },
    insuranceTitle: 'طلب عرض تأمين', insuranceIntro: 'اختر وكالتك وجهّز طلباً يتضمن معلومات السيارة.',
    contactInfo: 'طلبك', fullName: 'الاسم واللقب', phone: 'رقم الهاتف', vehicle: 'السيارة', cover: 'نوع التغطية', thirdSimple: 'ضد الغير البسيط', thirdCollision: 'ضد الغير مع التصادم', comprehensive: 'جميع الأخطار', agency: 'الوكالة المفضلة', requestOffers: 'إرسال طلب عرض السعر', quoteResults: 'ملخص الطلب', annual: 'سنوياً، على سبيل التقدير', quoteNotice: 'لن تتم مشاركة المعلومات إلا بعد فتح WhatsApp وتأكيد الإرسال بنفسك.',
    vehicleDetails: 'معلومات السيارة', agencyHint: 'اختر وكالة واحدة. سيوجه رابط WhatsApp إلى جهة اتصالها.', quoteVehicleHint: 'إذا سبق فك رقم الهيكل، تُملأ هذه الخانات تلقائياً. يمكنك تعديلها أو إدخال السيارة يدوياً.', quoteModalTitle: 'تأكيد الطلب', quoteModalBody: 'سيُفتح WhatsApp برسالة جاهزة للوكالة المختارة. راجع التفاصيل ثم اضغط إرسال داخل WhatsApp.', sendViaWhatsapp: 'إرسال طلبي عبر WhatsApp', insurer: 'الوكالة', modelYearLabel: 'سنة الطراز', vinOptional: 'رقم الهيكل (اختياري)', selectAgency: 'اختر وكالة',
    reportTitle: 'تقرير شامل بين يديك', reportBody: 'افتح ملخص الفحص والنقاط التي تستحق التفاوض وبطاقة السيارة على هذه الصفحة.', unlock: 'فتح التقرير', unlocked: 'تم فتح التقرير التجريبي', unlockedBody: 'ملخصك المحلي جاهز. تبقى البيانات على هذه الصفحة ولا تُعدّ خبرة معتمدة.',
    reportSummary: 'ملخصك', reportSummaryBody: 'راجع النقاط المسجلة خلال الزيارة، واطلب فواتير الصيانة، واستعن بفني مستقل لفحص السيارة قبل الشراء.',
    footerDemo: 'يُرسل رقم الهيكل إلى NHTSA لغرض فكّه فقط. تبقى بقية بيانات هذا العرض التجريبي محلية.', footerMade: 'مؤشرات مفيدة بلا وعود زائفة.',
    modalTitle: 'فتح تقريرك', modalSubtitle: 'اختر طريقة تجريبية. لن يتم أي دفع.',
    methods: { baridi: 'بريدي موب', edahabia: 'الذهبية', flexy: 'فليكسي' }, ripTitle: 'RIP تجريبي غير حقيقي', copy: 'نسخ', copied: 'تم النسخ', fakeRip: '000-000-000000000000-DEMO',
    payNotice: 'للتجربة فقط: لا نجمع بيانات بطاقة أو حساب أو دفع. لن يتم خصم أي مبلغ. رقم RIP خيالي بوضوح.',
    simulatePay: 'محاكاة فتح التقرير', cancel: 'إلغاء', paymentDone: 'تمت محاكاة الفتح. لم يحدث أي دفع فعلي.',
    invalidVin: 'يجب أن يتكون رقم الهيكل من 17 خانة حرفية ورقمية (من دون I أو O أو Q).', invalidRegistration: 'أدخل السلسلة والسنة والولاية.', invalidValuation: 'تحقق من السنة والمسافة المقطوعة.', invalidPhone: 'أدخل رقم هاتف جزائرياً صحيحاً.', invalidQuote: 'أكمل الاسم والولاية والوكالة ومعلومات السيارة المطلوبة.',
    vinLabel: 'رقم الهيكل', plateLabel: 'التسجيل', yearLabel: 'سنة الطراز', months: 'شهر', simulated: 'محاكاة', close: 'إغلاق', vehiclePlaceholder: 'مثال: Renault Clio 4 1.5 dCi',
  },
} as const;

const wilayas = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M’Sila','Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M’Ghair','El Meniaa'];
const wilayaArabic: Record<string,string> = {
  Adrar:'أدرار',Chlef:'الشلف',Laghouat:'الأغواط','Oum El Bouaghi':'أم البواقي',Batna:'باتنة',Béjaïa:'بجاية',Biskra:'بسكرة',Béchar:'بشار',Blida:'البليدة',Bouira:'البويرة',Tamanrasset:'تمنراست',Tébessa:'تبسة',Tlemcen:'تلمسان',Tiaret:'تيارت','Tizi Ouzou':'تيزي وزو',Alger:'الجزائر',Djelfa:'الجلفة',Jijel:'جيجل',Sétif:'سطيف',Saïda:'سعيدة',Skikda:'سكيكدة','Sidi Bel Abbès':'سيدي بلعباس',Annaba:'عنابة',Guelma:'قالمة',Constantine:'قسنطينة',Médéa:'المدية',Mostaganem:'مستغانم','M’Sila':'المسيلة',Mascara:'معسكر',Ouargla:'ورقلة',Oran:'وهران','El Bayadh':'البيض',Illizi:'إليزي','Bordj Bou Arréridj':'برج بوعريريج',Boumerdès:'بومرداس','El Tarf':'الطارف',Tindouf:'تندوف',Tissemsilt:'تيسمسيلت','El Oued':'الوادي',Khenchela:'خنشلة','Souk Ahras':'سوق أهراس',Tipaza:'تيبازة',Mila:'ميلة','Aïn Defla':'عين الدفلى',Naâma:'النعامة','Aïn Témouchent':'عين تموشنت',Ghardaïa:'غرداية',Relizane:'غليزان',Timimoun:'تيميمون','Bordj Badji Mokhtar':'برج باجي مختار','Ouled Djellal':'أولاد جلال','Béni Abbès':'بني عباس','In Salah':'عين صالح','In Guezzam':'عين قزام',Touggourt:'تقرت',Djanet:'جانت','El M’Ghair':'المغير','El Meniaa':'المنيعة'
};
const categoryItems: Record<Category, string[]> = {
  engine: ['Démarrage à froid','Ralenti stable','Aucun voyant moteur','Pas de fumée anormale','Niveau d’huile correct','Absence de fuite d’huile','Liquide de refroidissement propre','Température moteur stable','Boîte de vitesses fluide','Embrayage sans patinage','Freinage sans vibration','Direction sans jeu','Suspension sans bruit','Échappement en bon état'],
  body: ['Alignement des panneaux','Peinture uniforme','Absence de corrosion visible','Bas de caisse sans choc','Longerons sans déformation','Pare-brise sans fissure','Vitres en bon état','Portières bien alignées','Coffre ferme correctement','Capot ferme correctement','Pneus usure régulière','Profondeur des pneus correcte','Jantes sans dommage majeur','Éclairage extérieur intact'],
  electronics: ['Batterie et démarrage','Alternateur en charge','Phares avant fonctionnels','Feux arrière fonctionnels','Clignotants fonctionnels','Essuie-glaces fonctionnels','Climatisation opérationnelle','Ventilation fonctionnelle','Lève-vitres fonctionnels','Verrouillage centralisé','Écran et commandes','Capteurs de stationnement'],
  documents: ['Carte grise originale','Identité vendeur vérifiée','Numéro VIN cohérent','Numéro de série lisible','Contrôle technique valide','Assurance en cours','Historique d’entretien disponible','Factures des réparations','Absence de gage à vérifier','Kilométrage cohérent avec l’usure'],
};
const categoryArabic: Record<Category, string[]> = {
  engine: ['تشغيل المحرك بارداً','ثبات دوران المحرك','عدم ظهور لمبة المحرك','عدم وجود دخان غير طبيعي','مستوى الزيت مناسب','لا يوجد تسرب زيت','سائل التبريد نظيف','حرارة المحرك مستقرة','تبديل السرعات سلس','القابض لا ينزلق','الفرامل بلا اهتزاز','التوجيه بلا ارتخاء','التعليق بلا ضجيج','العادم بحالة جيدة'],
  body: ['تناسق ألواح الهيكل','تجانس الطلاء','لا صدأ ظاهر','أسفل الهيكل بلا صدمة','الدعامات بلا تشوه','الزجاج الأمامي بلا شقوق','النوافذ بحالة جيدة','الأبواب متناسقة','الصندوق يغلق جيداً','غطاء المحرك يغلق جيداً','تآكل الإطارات متساوٍ','عمق نقشة الإطارات مناسب','الجنوط بلا ضرر كبير','الإنارة الخارجية سليمة'],
  electronics: ['البطارية والتشغيل','شحن المولد الكهربائي','المصابيح الأمامية تعمل','المصابيح الخلفية تعمل','إشارات الانعطاف تعمل','ماسحات الزجاج تعمل','المكيف يعمل','التهوية تعمل','النوافذ الكهربائية تعمل','القفل المركزي يعمل','الشاشة وأزرار التحكم','حساسات الركن'],
  documents: ['البطاقة الرمادية الأصلية','التحقق من هوية البائع','تطابق رقم الهيكل','رقم التسلسل مقروء','المراقبة التقنية سارية','التأمين ساري','توفر سجل الصيانة','فواتير الإصلاحات','التحقق من عدم وجود رهن','المسافة متوافقة مع الاستهلاك'],
};
const statuses: Status[] = ['ok','attn','crit'];
const navIds = ['vehicle','valuation','inspection','insurance','report'] as const;

function InputField({ label, name, value, onChange, placeholder, type = 'text', min, max, testId, dir, required, autoComplete, maxLength }: { label:string;name:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;min?:number;max?:number;testId:string;dir?:string;required?:boolean;autoComplete?:string;maxLength?:number }) {
  return <div className="field"><label htmlFor={name}>{label}</label><input className="input" id={name} name={name} type={type} min={min} max={max} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} data-testid={testId} dir={dir} required={required} autoComplete={autoComplete} maxLength={maxLength}/></div>;
}

function App() {
  const [lang,setLang] = useState<Lang>('fr');
  const [vin,setVin] = useState(''); const [series,setSeries] = useState(''); const [carYear,setCarYear] = useState(''); const [carWilaya,setCarWilaya] = useState('');
  const [vehicle,setVehicle] = useState<Vehicle|null>(null); const [vehicleError,setVehicleError] = useState(''); const [decodeError,setDecodeError] = useState('');
  const decodeSequence = useRef(0);
  const [valYear,setValYear] = useState('2019'); const [mileage,setMileage] = useState('85000'); const [condition,setCondition] = useState('good'); const [valuation,setValuation] = useState<Valuation|null>(null); const [valuationError,setValuationError] = useState('');
  const [checklist,setChecklist] = useState<Record<string,Status>>({});
  const [quoteName,setQuoteName] = useState(''); const [quotePhone,setQuotePhone] = useState(''); const [quoteWilaya,setQuoteWilaya] = useState('');
  const [quoteMake,setQuoteMake] = useState(''); const [quoteModel,setQuoteModel] = useState(''); const [quoteYear,setQuoteYear] = useState(''); const [quoteVin,setQuoteVin] = useState('');
  const [cover,setCover] = useState<QuoteCoverage>('thirdSimple'); const [selectedInsurer,setSelectedInsurer] = useState<Insurer|''>('');
  const [quoteError,setQuoteError] = useState(''); const [quoteRequest,setQuoteRequest] = useState<QuoteRequest|null>(null); const [quoteConfirmationOpen,setQuoteConfirmationOpen] = useState(false);
  const [modalOpen,setModalOpen] = useState(false); const [paymentMethod,setPaymentMethod] = useState('baridi'); const [copied,setCopied] = useState(false); const [payment,setPayment] = useState<PaymentDemo|null>(null);
  const t = text[lang], isAr = lang === 'ar';
  useEffect(() => {
    const decoded = vehicle?.data;
    if (!decoded?.decoded) return;
    setQuoteMake(decoded.make ?? '');
    setQuoteModel(decoded.model ?? '');
    setQuoteYear(decoded.modelYear ?? '');
    setQuoteVin(decoded.vin);
  }, [vehicle?.data?.decoded, vehicle?.data?.make, vehicle?.data?.model, vehicle?.data?.modelYear, vehicle?.data?.vin]);
  const counts = useMemo(()=>statuses.reduce((out,status)=>{out[status]=Object.values(checklist).filter(s=>s===status).length;return out;},{ok:0,attn:0,crit:0} as Record<Status,number>),[checklist]);
  const allItems = useMemo(()=>Object.entries(categoryItems).flatMap(([category,items])=>items.map((label,index)=>({id:`${category}-${index+1}`,category:category as Category,label,arabic:categoryArabic[category as Category][index]}))),[]);
  const totalPoints = allItems.length;
  const inspectedCount = Object.keys(checklist).length;
  const score = Math.round((counts.ok + counts.attn*.55 + counts.crit*.1) / totalPoints * 100);
  const formatDzd = (v:number) => `${Math.round(v/1000).toLocaleString('fr-FR')} 000`;
  const displayWilaya = (name:string) => isAr ? (wilayaArabic[name]||name) : name;
  const insuranceWilayaLabel = (code:string) => {
    const name = wilayas[Number(code) - 1];
    return name ? `${code.padStart(2,'0')} · ${displayWilaya(name)}` : t.notProvided;
  };
  const coverageLabel = (coverage:QuoteCoverage) => coverage === 'thirdSimple' ? t.thirdSimple : coverage === 'thirdCollision' ? t.thirdCollision : t.comprehensive;
  function clearQuoteRequest() {
    setQuoteRequest(null);
    setQuoteConfirmationOpen(false);
    setQuoteError('');
  }
  function buildWhatsAppUrl(request:QuoteRequest) {
    const message = [
      'Siyarati DZ · ' + t.requestOffers,
      '',
      `${t.fullName}: ${request.name}`,
      `${t.phone}: ${request.phone}`,
      `${t.wilaya}: ${insuranceWilayaLabel(request.wilaya)}`,
      `${t.insurer}: ${request.agency}`,
      `${t.make}: ${request.make}`,
      `${t.model}: ${request.model}`,
      `${t.modelYearLabel}: ${request.year}`,
      ...(request.vin ? [`${t.vinLabel}: ${request.vin}`] : []),
      `${t.cover}: ${coverageLabel(request.cover)}`,
    ].join('\n');
    return `https://wa.me/${insurerWhatsappNumbers[request.agency]}?text=${encodeURIComponent(message)}`;
  }
  const normalizedVin = vin.trim().toUpperCase();
  const vinQuery = useDecodeVin(
    { vin: normalizedVin },
    { query: { enabled: false, queryKey: getDecodeVinQueryKey({ vin: normalizedVin }), retry: false } },
  );
  function clearVehicleResult(clearQuoteVehicle = false) {
    decodeSequence.current += 1;
    setVehicle(null);
    setVehicleError('');
    setDecodeError('');
    clearQuoteRequest();
    if(clearQuoteVehicle){setQuoteMake('');setQuoteModel('');setQuoteYear('');setQuoteVin('');}
  }
  async function identifyVehicle(e:React.FormEvent<HTMLFormElement>) {
    if(vinQuery.isFetching)return;
    e.preventDefault(); setVehicleError(''); setDecodeError(''); setVehicle(null);
    const normalized=normalizedVin;
    if(normalized && !/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)){setVehicleError(t.invalidVin);return;}
    const hasRegistration=Boolean(series.trim()&&carYear&&carWilaya);
    if(!normalized&&!hasRegistration){setVehicleError(t.invalidRegistration);return;}
    const registrationYear=Number(carYear);
    if(hasRegistration&&(!Number.isInteger(registrationYear)||registrationYear<1960||registrationYear>new Date().getFullYear())){setVehicleError(t.invalidRegistration);return;}
    const registration={series:series.trim(),registrationYear:carYear,wilaya:carWilaya};
    if(!normalized){setVehicle({data:null,...registration});return;}
    const requestSequence=++decodeSequence.current;
    const result=await vinQuery.refetch();
    if(requestSequence!==decodeSequence.current)return;
    if(result.error||!result.data){setDecodeError(t.decodeFailed);return;}
    setVehicle({data:result.data,...registration});
  }
  function calculateValue(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();setValuationError('');
    const y=Number(valYear), km=Number(mileage), currentYear=new Date().getFullYear();
    if(!Number.isFinite(y)||y<1990||y>currentYear||!Number.isFinite(km)||km<0||km>1000000){setValuationError(t.invalidValuation);return;}
    const base=1650000-(currentYear-y)*82000-Math.max(0,km-30000)*2.15;
    const conditionFactor=condition==='excellent'?1.12:condition==='fair'?.82:1;
    const market=Math.max(180000,Math.round(base*conditionFactor/10000)*10000);
    setValuation({year:y,mileage:km,condition,market,low:Math.round(market*.88/10000)*10000,high:Math.round(market*1.12/10000)*10000});
  }
  function setItemStatus(id:string,status:Status) { setChecklist(prev=>({...prev,[id]:status})); }
  function submitQuote(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();setQuoteError('');
    const normalizedPhone=quotePhone.trim().replace(/[ .()-]/g,'');
    const validPhone=/^(?:\+213|0)(?:5|6|7)\d{8}$/.test(normalizedPhone);
    if(!validPhone){setQuoteError(t.invalidPhone);return;}
    const wilayaNumber=Number(quoteWilaya);
    const modelYear=Number(quoteYear);
    const validWilaya=Number.isInteger(wilayaNumber)&&wilayaNumber>=1&&wilayaNumber<=58;
    const validYear=Number.isInteger(modelYear)&&modelYear>=1886&&modelYear<=new Date().getFullYear()+1;
    if(!quoteName.trim()||!validWilaya||!selectedInsurer||!quoteMake.trim()||!quoteModel.trim()||!validYear){setQuoteError(t.invalidQuote);return;}
    if(quoteVin.trim()&&!/^[A-HJ-NPR-Z0-9]{17}$/.test(quoteVin.trim().toUpperCase())){setQuoteError(t.invalidVin);return;}
    setQuoteRequest({
      name:quoteName.trim(),phone:quotePhone.trim(),wilaya:quoteWilaya,agency:selectedInsurer,
      make:quoteMake.trim(),model:quoteModel.trim(),year:String(modelYear),vin:quoteVin.trim().toUpperCase(),cover,
    });
    setQuoteConfirmationOpen(true);
  }
  async function copyRip() { try { await navigator.clipboard.writeText(t.fakeRip);setCopied(true);window.setTimeout(()=>setCopied(false),1800); } catch { setCopied(false); } }
  function completePayment() { setPayment({method:paymentMethod,rip:paymentMethod==='baridi'?t.fakeRip:'',unlocked:true});setModalOpen(false); }
  function openModal() { setModalOpen(true); }

  return <main className={`app-shell${isAr?' rtl':''}`} dir={isAr?'rtl':'ltr'} lang={lang}>
    <header className="topbar"><div className="wrap top-inner">
      <a className="brand" href="#top" aria-label="Siyarati DZ" data-testid="link-brand"><span className="brand-mark">S</span><span><span className="brand-title">Siyarati DZ</span><span className="brand-sub">{t.brandSubtitle}</span></span></a>
      <nav className="navlinks" aria-label={isAr?'التنقل الرئيسي':'Navigation principale'}>{navIds.map((id,i)=><a href={`#${id}`} key={id} data-testid={`link-nav-${id}`}>{[t.navVehicle,t.navValue,t.navCheck,t.navInsurance,t.navReport][i]}</a>)}</nav>
      <div className="top-actions"><span className="demo-pill" data-testid="status-demo"><i className="demo-dot"/> {t.demo}</span><button className="lang-toggle" type="button" onClick={()=>setLang(isAr?'fr':'ar')} aria-label={isAr?'Passer en français':'التبديل إلى العربية'} data-testid="button-language">{isAr?'FR':'عربي'}</button></div>
    </div></header>
    <div className="wrap" id="top">
      <section className="hero" aria-labelledby="hero-title">
        <div><div className="eyebrow">{t.heroTag}</div><h1 id="hero-title">{t.heroTitle}</h1><p className="hero-copy">{t.heroBody}</p>
          <div className="hero-actions"><a className="btn btn-primary" href="#vehicle" data-testid="link-start-inspection"><ClipboardCheck size={15}/>{t.start}</a><a className="btn btn-quiet" href="#valuation" data-testid="link-estimate"><Calculator size={15}/>{t.estimate}<ArrowDownRight size={14}/></a></div>
        </div>
        <div className="hero-visual" aria-label={t.carLabel}>
          <div className="vehicle-orbit"/>
          <div className="car-card"><div className="car-topline"><span>SIYARATI / 01</span><span>36°45′ N · 3°03′ E</span></div>
            <div className="car-illustration"><svg viewBox="0 0 480 155" role="img" aria-label="Illustration de voiture compacte">
              <defs><linearGradient id="body" x1="0" x2="1"><stop stopColor="#167b64"/><stop offset=".48" stopColor="#44c9a0"/><stop offset="1" stopColor="#158c88"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8ed4d0"/><stop offset="1" stopColor="#23444c"/></linearGradient></defs>
              <ellipse cx="242" cy="131" rx="170" ry="12" fill="#061015" opacity=".8"/><path d="M74 108l10-26q7-16 24-20l52-9 40-39q9-9 24-10h84q17 1 28 14l35 39 47 11q15 4 19 19l6 22q1 11-11 14l-20 3h-23q-2-39-38-39t-40 39H165q-3-39-39-39t-39 39l-13-3q-9-2-8-15z" fill="url(#body)" stroke="#83e3c1" strokeWidth="2"/>
              <path d="M178 48l32-31q6-6 16-6h38v39zM275 11h32q12 2 21 13l25 24h-78z" fill="url(#glass)" stroke="#80cabd" strokeWidth="1.5"/>
              <path d="M257 14v38M374 50l25 6" stroke="#1f6f64" strokeWidth="3"/><path d="M92 88l21-4M415 88l17 5" stroke="#d9f5dc" strokeWidth="5" strokeLinecap="round"/>
              <circle cx="126" cy="115" r="27" fill="#101a20" stroke="#b6cbc6" strokeWidth="4"/><circle cx="126" cy="115" r="11" fill="#647c7c"/><circle cx="362" cy="115" r="27" fill="#101a20" stroke="#b6cbc6" strokeWidth="4"/><circle cx="362" cy="115" r="11" fill="#647c7c"/>
              <path d="M182 56h166" stroke="#a0f0d1" strokeOpacity=".6"/><path d="M196 76h172" stroke="#0a5148" strokeWidth="2"/>
            </svg></div>
            <div className="car-statline"><div><div className="vehicle-label">{t.carLabel}</div><div className="vehicle-meta">{t.carMeta}</div></div><div className="health-score"><strong>{score}<small style={{display:'inline',fontFamily:'inherit',fontSize:10}}>/100</small></strong><small>{t.score}</small></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="vehicle">
        <div className="section-heading"><div><div className="section-index">01 / {t.navVehicle.toUpperCase()}</div><h2>{t.idTitle}</h2></div><p className="section-intro">{t.idIntro}</p></div>
        <div className="grid-2"><div className="panel">
          <div className="panel-label">{t.vinLabel} + {t.plateLabel}</div>
          <form onSubmit={identifyVehicle} noValidate>
            <p className="helper">{t.vinOrRegistration}</p><div className="form-grid">
              <div className="field full"><label htmlFor="vin">{t.vin}</label><input className="input" id="vin" value={vin} onChange={e=>{setVin(e.target.value.toUpperCase());clearVehicleResult()}} placeholder={t.vinPlaceholder} maxLength={17} autoCapitalize="characters" data-testid="input-vin" aria-describedby="nhtsa-privacy-note"/></div>
              <InputField label={t.series} name="series" value={series} onChange={v=>{setSeries(v);clearVehicleResult()}} placeholder={t.seriesPlaceholder} testId="input-registration-series"/>
              <InputField label={t.registrationYear} name="registration-year" value={carYear} onChange={v=>{setCarYear(v);clearVehicleResult()}} type="number" min={1960} max={new Date().getFullYear()} testId="input-registration-year"/>
              <div className="field full"><label htmlFor="car-wilaya">{t.wilaya}</label><select className="input" id="car-wilaya" value={carWilaya} onChange={e=>{setCarWilaya(e.target.value);clearVehicleResult()}} data-testid="select-registration-wilaya"><option value="">{t.choose}</option>{wilayas.map(w=><option key={w} value={w}>{displayWilaya(w)}</option>)}</select></div>
            </div>
            {vehicleError&&<p className="error-text" role="alert" data-testid="error-vehicle">{vehicleError}</p>}
            {decodeError&&<p className="error-text" role="alert" data-testid="status-vin-error">{decodeError}</p>}
            <div className="form-actions"><button type="submit" className="btn btn-primary" disabled={vinQuery.isFetching} data-testid="button-identify-vehicle">{vinQuery.isFetching?<LoaderCircle size={15} className="animate-spin"/>:<CarFront size={15}/ >}{vinQuery.isFetching?t.decodeLoading:t.decode}<ChevronRight size={14}/></button></div>
          </form>
          {vehicle&&<div className="result-box" aria-live="polite" data-testid="result-vehicle-sheet">
            <div className="result-title">{vehicle.data?.decoded?<BadgeCheck size={16}/>:<Info size={16}/>}<span>{vehicle.data?.decoded?`${vehicle.data.make} ${vehicle.data.model} · ${t.sheet}`:vehicle.data?t.noManufacturerFound:t.registrationOnly}</span></div>
            {vehicle.data&&<><div className="spec-grid">
              {[
                [t.make,vehicle.data.make],[t.model,vehicle.data.model],[t.yearLabel,vehicle.data.modelYear],
                [t.engine,vehicle.data.engine],[t.trim,vehicle.data.trim],[t.modelSeries,vehicle.data.series],
                [t.fuel,vehicle.data.fuelType],[t.gearbox,vehicle.data.transmission],[t.bodyClass,vehicle.data.bodyClass],
                [t.country,vehicle.data.assemblyCountry],[t.plant,vehicle.data.assemblyPlant],
                [t.series,vehicle.series||null],[t.registrationYear,vehicle.registrationYear||null],[t.wilaya,vehicle.wilaya?displayWilaya(vehicle.wilaya):null],
              ].map(([label,value])=><div className="spec-cell" key={label}><span>{label}</span><strong>{value||t.apiNotReturned}</strong></div>)}
              <div className="spec-cell" style={{gridColumn:'1/-1'}}><span>{t.equipment}</span><strong>{vehicle.data.safetyEquipment.join(' · ')||t.noSafetyData}</strong></div>
            </div>
            {vehicle.data.errorMessage&&vehicle.data.errorCode!=='0'&&<p className="helper" data-testid="text-vin-api-message">{vehicle.data.errorMessage}</p>}
            <a className="helper" href="https://vpic.nhtsa.dot.gov/api/" target="_blank" rel="noreferrer" data-testid="link-nhtsa-source">{t.sourceNhtsa} · {vehicle.data.vin}</a></>}
            {!vehicle.data&&<><div className="spec-grid"><div className="spec-cell"><span>{t.plateLabel}</span><strong>{vehicle.series}</strong></div><div className="spec-cell"><span>{t.registrationYear}</span><strong>{vehicle.registrationYear}</strong></div><div className="spec-cell"><span>{t.wilaya}</span><strong>{displayWilaya(vehicle.wilaya)}</strong></div></div><div className="notice"><Info size={15}/><span>{t.registrationNotice}</span></div></>}
          </div>}
        </div><div className="panel" style={{display:'flex',flexDirection:'column',justifyContent:'space-between',gap:18}}>
          <div><div className="panel-label">{isAr?'كيف تقرأ بياناتك':'À SAVOIR AVANT DE DÉCODER'}</div><h3 style={{fontSize:20,margin:'0 0 10px',letterSpacing:'-.5px'}}>{isAr?'رقم الهيكل ليس كل القصة':'Un numéro ne raconte pas tout.'}</h3><p className="section-intro" style={{maxWidth:400}}>{isAr?'استخدم رقم الهيكل للمقارنة مع الوثائق، وافحص السيارة ميدانياً.':'Comparez toujours le VIN aux documents du véhicule et vérifiez les éléments sur place.'}</p></div>
          <div className="notice" id="nhtsa-privacy-note"><Info size={15}/><span>{t.localDemo}</span></div>
        </div></div>
      </section>

      <section className="section" id="valuation">
        <div className="section-heading"><div><div className="section-index">02 / {t.navValue.toUpperCase()}</div><h2>{t.valuationTitle}</h2></div><p className="section-intro">{t.valuationIntro}</p></div>
        <div className="valuation-layout"><div className="panel"><div className="panel-label">{t.calcTitle}</div><form onSubmit={calculateValue} noValidate><div className="form-grid">
          <InputField label={t.year} name="valuation-year" value={valYear} onChange={v=>{setValYear(v);setValuation(null)}} type="number" min={1990} max={new Date().getFullYear()} testId="input-valuation-year"/>
          <InputField label={t.mileage} name="mileage" value={mileage} onChange={v=>{setMileage(v);setValuation(null)}} type="number" min={0} max={1000000} testId="input-mileage"/>
          <div className="field full"><label htmlFor="condition">{t.condition}</label><select className="input" id="condition" value={condition} onChange={e=>{setCondition(e.target.value);setValuation(null)}} data-testid="select-condition"><option value="excellent">{t.excellent}</option><option value="good">{t.good}</option><option value="fair">{t.fair}</option></select></div>
        </div>{valuationError&&<p className="error-text" role="alert" data-testid="error-valuation">{valuationError}</p>}<div className="form-actions"><button className="btn btn-primary" type="submit" data-testid="button-calculate-valuation"><Calculator size={15}/>{t.calculate}</button></div></form></div>
        <div className="panel valuation-result" aria-live="polite">{valuation?<><div className="panel-label">{t.estimation} · {t.simulated}</div><div className="market-price" data-testid="value-market-price">{formatDzd(valuation.market)} <span>DA</span></div><div className="helper">{valuation.year} · {valuation.mileage.toLocaleString('fr-FR')} km · {t[valuation.condition as 'good'|'excellent'|'fair']}</div><div className="range-bar"><i className="range-marker"/></div><div className="range-values"><span>{formatDzd(valuation.low)} DA</span><span>{formatDzd(valuation.high)} DA</span></div><div className="price-labels"><div>{t.low}<strong>{formatDzd(valuation.low)} DA</strong></div><div style={{textAlign:'center'}}>{t.market}<strong>{formatDzd(valuation.market)} DA</strong></div><div style={{textAlign:'right'}}>{t.high}<strong>{formatDzd(valuation.high)} DA</strong></div></div><div className="notice warn" style={{marginTop:18}}><AlertTriangle size={14}/><span>{t.rangeDisclaimer}</span></div></>:<><div className="panel-label">{t.estimation} · {t.simulated}</div><div className="market-price" style={{color:'#64777b'}}>— <span>DA</span></div><div className="helper">{t.rangeDisclaimer}</div><div className="range-bar" style={{opacity:.35}}/></>}</div></div>
      </section>

      <section className="section" id="inspection">
        <div className="section-heading"><div><div className="section-index">03 / {t.navCheck.toUpperCase()}</div><h2>{t.inspectionTitle}</h2></div><p className="section-intro">{t.inspectionIntro}</p></div>
        <div className="panel">
          <div className="inspection-summary"><div className="score-ring" data-testid="value-inspection-score">{score}</div><div className="summary-copy"><strong>{inspectedCount===0?t.allOk:`${inspectedCount} / ${totalPoints} ${t.inspected}`}</strong><span data-testid="text-inspection-summary">{t.categories.engine} · {t.categories.body} · {t.categories.electronics} · {t.categories.documents}</span></div>
            <div className="status-totals"><div className="total-chip ok" data-testid="count-conforme"><small>{t.okay}</small><b>{counts.ok}</b></div><div className="total-chip attn" data-testid="count-attention"><small>{t.attention}</small><b>{counts.attn}</b></div><div className="total-chip crit" data-testid="count-critical"><small>{t.critical}</small><b>{counts.crit}</b></div></div>
          </div>
          <div className="category-grid">{(Object.keys(categoryItems) as Category[]).map(category=>{
            const items=allItems.filter(i=>i.category===category), categoryCount=items.filter(i=>checklist[i.id]).length;
            return <div className="category" key={category}><div className="category-header"><strong>{t.categories[category]}</strong><span data-testid={`count-category-${category}`}>{categoryCount} / {items.length}</span></div>
              {items.map(item=><div className="check-item" key={item.id}><label htmlFor={`status-${item.id}`}>{isAr?item.arabic:item.label}</label><div className="status-control" id={`status-${item.id}`} role="group" aria-label={`${isAr?item.arabic:item.label} — ${t.okay}, ${t.attention}, ${t.critical}`}>
                {statuses.map((status,index)=><button key={status} type="button" className={`${checklist[item.id]===status?'active ':''}${status}`} onClick={()=>setItemStatus(item.id,status)} aria-pressed={checklist[item.id]===status} aria-label={`${isAr?item.arabic:item.label}: ${[t.okay,t.attention,t.critical][index]}`} data-testid={`button-inspection-${item.id}-${status}`}>{[t.okay,t.attention,t.critical][index]}</button>)}
              </div></div>)}
            </div>;
          })}</div>
          <div className="form-actions"><button type="button" className="btn btn-quiet" onClick={()=>setChecklist({})} data-testid="button-reset-inspection">{t.reset}</button></div>
        </div>
      </section>

      <section className="section" id="insurance">
        <div className="section-heading"><div><div className="section-index">04 / {t.navInsurance.toUpperCase()}</div><h2>{t.insuranceTitle}</h2></div><p className="section-intro">{t.insuranceIntro}</p></div>
        <div className="insurance-grid">
          <form className="panel" onSubmit={submitQuote} noValidate>
            <div className="panel-label">{t.contactInfo}</div>
            <div className="form-grid">
              <InputField label={t.fullName} name="quote-name" value={quoteName} onChange={v=>{setQuoteName(v);clearQuoteRequest()}} placeholder={isAr?'الاسم واللقب':'Nom et prénom'} testId="input-quote-name" autoComplete="name" required/>
              <InputField label={t.phone} name="quote-phone" value={quotePhone} onChange={v=>{setQuotePhone(v);clearQuoteRequest()}} placeholder="05 55 12 34 56" type="tel" testId="input-quote-phone" dir="ltr" autoComplete="tel" required/>
              <div className="field">
                <label htmlFor="quote-wilaya">{t.wilaya} (01–58)</label>
                <select className="input" id="quote-wilaya" value={quoteWilaya} onChange={e=>{setQuoteWilaya(e.target.value);clearQuoteRequest()}} data-testid="select-quote-wilaya" required>
                  <option value="">{t.choose}</option>
                  {wilayas.map((name,index)=>{const code=String(index+1).padStart(2,'0');return <option key={code} value={code}>{code} · {displayWilaya(name)}</option>})}
                </select>
              </div>
              <div className="field">
                <label htmlFor="quote-agency">{t.agency}</label>
                <select className="input" id="quote-agency" value={selectedInsurer} onChange={e=>{setSelectedInsurer(e.target.value as Insurer|'');clearQuoteRequest()}} data-testid="select-quote-agency" required>
                  <option value="">{t.selectAgency}</option>
                  {insurers.map(name=><option key={name} value={name}>{name}</option>)}
                </select>
                <span className="helper">{t.agencyHint}</span>
              </div>
              <div className="field full">
                <label htmlFor="cover">{t.cover}</label>
                <select className="input" id="cover" value={cover} onChange={e=>{setCover(e.target.value as QuoteCoverage);clearQuoteRequest()}} data-testid="select-cover">
                  <option value="thirdSimple">{t.thirdSimple}</option>
                  <option value="thirdCollision">{t.thirdCollision}</option>
                  <option value="comprehensive">{t.comprehensive}</option>
                </select>
              </div>
              <div className="field full">
                <h3 style={{fontSize:14,margin:'3px 0 0'}}>{t.vehicleDetails}</h3>
                <span className="helper">{t.quoteVehicleHint}</span>
              </div>
              <InputField label={t.make} name="quote-make" value={quoteMake} onChange={v=>{setQuoteMake(v);clearQuoteRequest()}} placeholder={isAr?'العلامة':'Marque'} testId="input-quote-make" required/>
              <InputField label={t.model} name="quote-model" value={quoteModel} onChange={v=>{setQuoteModel(v);clearQuoteRequest()}} placeholder={isAr?'الطراز':'Modèle'} testId="input-quote-model" required/>
              <InputField label={t.modelYearLabel} name="quote-year" value={quoteYear} onChange={v=>{setQuoteYear(v);clearQuoteRequest()}} type="number" min={1886} max={new Date().getFullYear()+1} placeholder="2020" testId="input-quote-year" required/>
              <InputField label={t.vinOptional} name="quote-vin" value={quoteVin} onChange={v=>{setQuoteVin(v.toUpperCase());clearQuoteRequest()}} placeholder="17 caractères" testId="input-quote-vin" dir="ltr" maxLength={17}/>
            </div>
            {quoteError&&<p className="error-text" role="alert" data-testid="error-quote">{quoteError}</p>}
            <div className="form-actions"><button className="btn btn-primary" type="submit" data-testid="button-request-quote"><ShieldCheck size={15}/>{t.requestOffers}</button></div>
          </form>
          <div className="panel" aria-live="polite" data-testid="preview-quote">
            <div className="panel-label">{t.quoteResults}</div>
            <div className="result-title"><ShieldCheck size={16}/><span>{selectedInsurer||t.selectAgency} · {coverageLabel(cover)}</span></div>
            <div className="spec-grid">
              <div className="spec-cell"><span>{t.fullName}</span><strong>{quoteName||t.notProvided}</strong></div>
              <div className="spec-cell"><span>{t.phone}</span><strong dir="ltr">{quotePhone||t.notProvided}</strong></div>
              <div className="spec-cell"><span>{t.wilaya}</span><strong>{quoteWilaya?insuranceWilayaLabel(quoteWilaya):t.notProvided}</strong></div>
              <div className="spec-cell"><span>{t.make}</span><strong>{quoteMake||t.notProvided}</strong></div>
              <div className="spec-cell"><span>{t.model}</span><strong>{quoteModel||t.notProvided}</strong></div>
              <div className="spec-cell"><span>{t.modelYearLabel}</span><strong>{quoteYear||t.notProvided}</strong></div>
              {quoteVin&&<div className="spec-cell" style={{gridColumn:'1/-1'}}><span>{t.vinLabel}</span><strong dir="ltr">{quoteVin}</strong></div>}
            </div>
            <div className="notice" style={{marginTop:17}}><Info size={15}/><span>{t.quoteNotice}</span></div>
          </div>
        </div>
      </section>

      <section className="section" id="report">
        <div className="section-heading"><div><div className="section-index">05 / {t.navReport.toUpperCase()}</div><h2>{t.reportTitle}</h2></div><p className="section-intro">{t.reportBody}</p></div>
        {!payment?.unlocked?<div className="unlock-banner"><div className="unlock-copy"><strong><LockKeyhole size={15} style={{verticalAlign:'middle',marginInlineEnd:7}}/>{t.reportTitle}</strong><span>{t.reportBody}</span></div><button type="button" className="btn btn-primary" onClick={openModal} data-testid="button-open-payment">{t.unlock}<ArrowUpRight size={14}/></button></div>:
        <div className="report-unlocked" aria-live="polite" data-testid="status-report-unlocked"><div className="result-title"><BadgeCheck size={18}/>{t.unlocked}</div><p>{t.unlockedBody}</p><h3><FileText size={16} style={{verticalAlign:'middle',marginInlineEnd:8}}/>{t.reportSummary}</h3><p>{t.reportSummaryBody}</p><div className="spec-grid"><div className="spec-cell"><span>{t.inspected}</span><strong>{inspectedCount} / {totalPoints}</strong></div><div className="spec-cell"><span>{t.critical}</span><strong>{counts.crit}</strong></div><div className="spec-cell"><span>{t.attention}</span><strong>{counts.attn}</strong></div><div className="spec-cell"><span>{t.estimation}</span><strong>{valuation?`${formatDzd(valuation.market)} DA`:'—'}</strong></div><div className="spec-cell"><span>{t.vehicle}</span><strong>{quoteVehicle||vehicle?.data?.model||'—'}</strong></div><div className="spec-cell"><span>{t.wilaya}</span><strong>{displayWilaya(quoteWilaya||vehicle?.wilaya||'—')}</strong></div></div><div className="notice" style={{marginTop:15}}><Info size={14}/><span>{t.paymentDone}</span></div></div>}
      </section>
      <footer className="footer"><div className="footer-inner"><div><strong>Siyarati DZ</strong> · {t.footerMade}</div><div>{t.footerDemo}</div></div></footer>
    </div>
    {modalOpen&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <div className="modal-head"><div><h3 id="payment-title">{t.modalTitle}</h3><p>{t.modalSubtitle}</p></div><button className="icon-button" type="button" aria-label={t.close} onClick={()=>setModalOpen(false)} data-testid="button-close-payment"><X size={16}/></button></div>
      <div className="panel-label">{isAr?'اختر طريقة':'MODE DE DÉMONSTRATION'}</div>
      <div className="method-grid">{[['baridi',t.methods.baridi],['edahabia',t.methods.edahabia],['flexy',t.methods.flexy]].map(([id,label])=><button key={id} type="button" onClick={()=>setPaymentMethod(id)} className={`method-button${paymentMethod===id?' selected':''}`} aria-pressed={paymentMethod===id} data-testid={`button-payment-method-${id}`}><span>{id==='baridi'?'B':id==='edahabia'?'E':'F'}</span><strong>{label}</strong></button>)}</div>
      {paymentMethod==='baridi'&&<><div className="helper">{t.ripTitle}</div><div className="rip-box" data-testid="text-demo-rip"><span>{t.fakeRip}</span><button className="copy-button" type="button" onClick={copyRip} data-testid="button-copy-rip"><Copy size={13}/>{copied?t.copied:t.copy}</button></div></>}
      <div className="notice warn"><AlertTriangle size={15}/><span>{t.payNotice}</span></div>
      <div className="modal-footer"><button type="button" className="btn btn-quiet" onClick={()=>setModalOpen(false)} data-testid="button-cancel-payment">{t.cancel}</button><button type="button" className="btn btn-primary" onClick={completePayment} data-testid="button-simulate-payment"><Check size={15}/>{t.simulatePay}</button></div>
    </div></div>}
  </main>;
}

export default App;
