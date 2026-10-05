import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeCheck, Calculator, CarFront, Check, ChevronRight, ClipboardCheck, Copy, FileText, Info, LockKeyhole, ShieldCheck, X } from 'lucide-react';

type Lang = 'fr' | 'ar';
type Status = 'ok' | 'attn' | 'crit';
type Category = 'engine' | 'body' | 'electronics' | 'documents';
type Vehicle = { vin: string; series: string; year: string; wilaya: string; make: string; model: string; trim: string; engine: string; equipment: string[] };
type Valuation = { year: number; mileage: number; condition: string; low: number; market: number; high: number };
type QuoteRequest = { name: string; phone: string; wilaya: string; vehicle: string; cover: string; insurers: string[] };
type PaymentDemo = { method: string; rip: string; unlocked: boolean };

const text = {
  fr: {
    navVehicle: 'Identifier', navValue: 'Estimer', navCheck: 'Inspection', navInsurance: 'Assurance', navReport: 'Rapport',
    demo: 'DÉMO LOCALE', brandSubtitle: 'AUTO, EN CLAIR', heroTag: 'ACHAT AUTO, EN TOUTE CLARTÉ', heroTitle: <>Achetez mieux.<br/><em>Roulez serein.</em></>,
    heroBody: 'Les bons réflexes avant de signer. Identifiez, estimez et inspectez votre prochain véhicule avec des repères pensés pour le marché algérien.',
    start: 'Commencer l’inspection', estimate: 'Estimer un prix', health: 'ÉTAT DU CONTRÔLE', carLabel: 'Votre prochain véhicule', carMeta: 'Inspection personnelle · Algérie', score: 'À vérifier',
    idTitle: 'Identifier le véhicule', idIntro: 'VIN ou immatriculation : rassemblez les informations utiles avant votre visite.',
    vin: 'Numéro VIN (17 caractères)', series: 'Série d’immatriculation', year: 'Année', wilaya: 'Wilaya', seriesPlaceholder: 'Ex. 123 · 456 · 78', vinPlaceholder: 'Ex. VF1RFB00… (17 caractères)', choose: 'Sélectionner',
    vinOrRegistration: 'Saisissez un VIN valide ou renseignez les trois champs d’immatriculation.', notProvided: 'Non renseigné',
    decode: 'Afficher la fiche indicative', localDemo: 'Les caractéristiques affichées sont des exemples locaux de démonstration. Il ne s’agit pas d’un décodeur VIN validé ni d’une vérification officielle.',
    sheet: 'Fiche véhicule indicative', engine: 'Motorisation', trim: 'Finition d’origine', equipment: 'Équipements standards', country: 'Origine', fuel: 'Carburant', gearbox: 'Transmission', fuelTransmission: 'Diesel · Manuelle', equipmentValues: 'ABS · Airbags frontaux · Direction assistée · Vitres électriques avant', sample: 'Exemple de démonstration',
    valuationTitle: 'Une fourchette, pas une promesse', valuationIntro: 'Un repère rapide en dinars, basé sur l’année, le kilométrage et l’état déclaré.',
    calcTitle: 'Paramètres d’estimation', mileage: 'Kilométrage (km)', condition: 'État général', excellent: 'Très bon', good: 'Bon', fair: 'À prévoir', calculate: 'Calculer l’estimation', estimation: 'Estimation indicative', market: 'Valeur centrale', low: 'Fourchette basse', high: 'Fourchette haute', rangeDisclaimer: 'Repère de démonstration uniquement · le marché réel varie selon la version, l’historique et la région.',
    inspectionTitle: 'Votre inspection en 50 points', inspectionIntro: 'Faites le tour du véhicule. Chaque point passe de conforme à attention ou critique.',
    allOk: 'Aucun point renseigné', inspected: 'points vérifiés', okay: 'Conforme', attention: 'Attention', critical: 'Critique', reset: 'Tout réinitialiser',
    categories: { engine: 'Moteur & mécanique', body: 'Carrosserie & châssis', electronics: 'Électricité & confort', documents: 'Documents & historique' },
    insuranceTitle: 'Comparer les pistes d’assurance', insuranceIntro: 'Préparez une demande indicative. Aucun assureur n’est contacté par cette démonstration.',
    contactInfo: 'Vos informations', fullName: 'Nom complet', phone: 'Téléphone', vehicle: 'Véhicule', cover: 'Formule souhaitée', thirdParty: 'Tiers', comprehensive: 'Tous risques', providers: 'Assureurs à inclure', requestOffers: 'Afficher les offres simulées', insurerHint: 'Choisissez au moins un assureur.', quoteResults: 'Offres indicatives simulées', annual: 'par an, à titre indicatif', quoteNotice: 'Simulation locale uniquement. Aucune compagnie d’assurance n’a été contactée et ces montants ne sont pas des devis.',
    reportTitle: 'Le rapport complet, à portée de main', reportBody: 'Débloquez la synthèse d’inspection, les points à négocier et votre fiche véhicule sur cette page.', unlock: 'Débloquer le rapport', unlocked: 'Rapport de démonstration débloqué', unlockedBody: 'Votre synthèse locale est prête. Les données restent sur cette page et ne constituent pas une expertise certifiée.',
    reportSummary: 'Votre synthèse', reportSummaryBody: 'Examinez les éléments signalés pendant la visite, demandez les factures d’entretien et faites contrôler le véhicule par un professionnel indépendant avant achat.',
    footerDemo: 'Siyarati DZ est une démonstration locale. Aucune donnée n’est transmise.', footerMade: 'Des repères utiles, sans fausse promesse.',
    modalTitle: 'Débloquer votre rapport', modalSubtitle: 'Choisissez une méthode de démonstration. Aucun paiement ne sera effectué.',
    methods: { baridi: 'BaridiMob', edahabia: 'Edahabia', flexy: 'Flexy' }, ripTitle: 'RIP fictif de démonstration', copy: 'Copier', copied: 'Copié', fakeRip: '000-000-000000000000-DEMO',
    payNotice: 'Démo uniquement : aucune donnée de carte, compte ou paiement n’est collectée. Rien ne sera débité. Ce RIP est explicitement fictif.',
    simulatePay: 'Simuler le déblocage', cancel: 'Annuler', paymentDone: 'Déblocage simulé. Aucun paiement réel n’a eu lieu.',
    invalidVin: 'Le VIN doit contenir exactement 17 caractères alphanumériques (sans I, O ni Q).', invalidRegistration: 'Saisissez la série, l’année et la wilaya.', invalidValuation: 'Vérifiez l’année et le kilométrage.', invalidPhone: 'Saisissez un numéro de téléphone algérien valide.', invalidQuote: 'Complétez vos coordonnées, le véhicule et choisissez au moins un assureur.',
    vinLabel: 'VIN', plateLabel: 'Immatriculation', yearLabel: 'Année-modèle', months: 'Mois', simulated: 'SIMULÉ', close: 'Fermer', vehiclePlaceholder: 'Ex. Renault Clio 4 1.5 dCi',
  },
  ar: {
    navVehicle: 'بيانات السيارة', navValue: 'التقييم', navCheck: 'الفحص', navInsurance: 'التأمين', navReport: 'التقرير',
    demo: 'عرض تجريبي محلي', brandSubtitle: 'معلومات السيارة بثقة', heroTag: 'شراء السيارات بكل وضوح', heroTitle: <>اشترِ بذكاء.<br/><em>وقُد باطمئنان.</em></>,
    heroBody: 'خطوات عملية قبل التوقيع. تعرّف على سيارتك القادمة، وقدّر سعرها وافحصها بمؤشرات تناسب السوق الجزائري.',
    start: 'ابدأ الفحص', estimate: 'قدّر السعر', health: 'حالة الفحص', carLabel: 'سيارتك القادمة', carMeta: 'فحص شخصي · الجزائر', score: 'تحتاج إلى التحقق',
    idTitle: 'التعرّف على السيارة', idIntro: 'رقم الهيكل أو التسجيل: اجمع المعلومات المهمة قبل المعاينة.',
    vin: 'رقم الهيكل VIN (17 خانة)', series: 'سلسلة التسجيل', year: 'السنة', wilaya: 'الولاية', seriesPlaceholder: 'مثال: 123 · 456 · 78', vinPlaceholder: 'مثال: VF1RFB00… (17 خانة)', choose: 'اختر',
    vinOrRegistration: 'أدخل رقم هيكل صحيحاً أو أكمل حقول التسجيل الثلاثة.', notProvided: 'غير محدد',
    decode: 'عرض بطاقة السيارة التقديرية', localDemo: 'المواصفات المعروضة أمثلة محلية تجريبية. هذه ليست خدمة موثّقة لفك رقم الهيكل ولا تحققاً رسمياً.',
    sheet: 'بطاقة سيارة تقديرية', engine: 'المحرك', trim: 'الفئة الأصلية', equipment: 'التجهيزات القياسية', country: 'المنشأ', fuel: 'الوقود', gearbox: 'ناقل الحركة', fuelTransmission: 'ديزل · يدوي', equipmentValues: 'نظام ABS · وسائد هوائية أمامية · توجيه مؤازر · نوافذ أمامية كهربائية', sample: 'مثال تجريبي',
    valuationTitle: 'نطاق سعري لا وعد بالبيع', valuationIntro: 'مؤشر سريع بالدينار حسب السنة والمسافة المقطوعة والحالة المعلنة.',
    calcTitle: 'معايير التقييم', mileage: 'المسافة المقطوعة (كم)', condition: 'الحالة العامة', excellent: 'جيدة جداً', good: 'جيدة', fair: 'تحتاج إلى صيانة', calculate: 'احسب التقدير', estimation: 'تقدير إرشادي', market: 'القيمة المتوسطة', low: 'الحد الأدنى', high: 'الحد الأعلى', rangeDisclaimer: 'مؤشر تجريبي فقط · يختلف السوق الفعلي حسب النسخة والسجل والمنطقة.',
    inspectionTitle: 'قائمة فحص من 50 نقطة', inspectionIntro: 'افحص السيارة نقطةً نقطة. اختر سليم أو انتباه أو حرج لكل بند.',
    allOk: 'لم تسجل أي نقطة', inspected: 'نقطة مفحوصة', okay: 'سليم', attention: 'انتباه', critical: 'حرج', reset: 'إعادة ضبط الكل',
    categories: { engine: 'المحرك والميكانيك', body: 'الهيكل والطلاء', electronics: 'الكهرباء والراحة', documents: 'الوثائق والسجل' },
    insuranceTitle: 'مقارنة خيارات التأمين', insuranceIntro: 'جهّز طلباً تقديرياً. هذا العرض لا يتواصل مع أي شركة تأمين.',
    contactInfo: 'بياناتك', fullName: 'الاسم الكامل', phone: 'رقم الهاتف', vehicle: 'السيارة', cover: 'التغطية المطلوبة', thirdParty: 'ضد الغير', comprehensive: 'شامل', providers: 'الشركات المراد تضمينها', requestOffers: 'عرض الأسعار المحاكاة', insurerHint: 'اختر شركة تأمين واحدة على الأقل.', quoteResults: 'عروض تقديرية محاكاة', annual: 'سنوياً، على سبيل التقدير', quoteNotice: 'محاكاة محلية فقط. لم يتم التواصل مع أي شركة تأمين وهذه المبالغ ليست عروض أسعار.',
    reportTitle: 'تقرير شامل بين يديك', reportBody: 'افتح ملخص الفحص والنقاط التي تستحق التفاوض وبطاقة السيارة على هذه الصفحة.', unlock: 'فتح التقرير', unlocked: 'تم فتح التقرير التجريبي', unlockedBody: 'ملخصك المحلي جاهز. تبقى البيانات على هذه الصفحة ولا تُعدّ خبرة معتمدة.',
    reportSummary: 'ملخصك', reportSummaryBody: 'راجع النقاط المسجلة خلال الزيارة، واطلب فواتير الصيانة، واستعن بفني مستقل لفحص السيارة قبل الشراء.',
    footerDemo: 'سيارتي DZ عرض تجريبي محلي. لا يتم إرسال أي بيانات.', footerMade: 'مؤشرات مفيدة بلا وعود زائفة.',
    modalTitle: 'فتح تقريرك', modalSubtitle: 'اختر طريقة تجريبية. لن يتم أي دفع.',
    methods: { baridi: 'بريدي موب', edahabia: 'الذهبية', flexy: 'فليكسي' }, ripTitle: 'RIP تجريبي غير حقيقي', copy: 'نسخ', copied: 'تم النسخ', fakeRip: '000-000-000000000000-DEMO',
    payNotice: 'للتجربة فقط: لا نجمع بيانات بطاقة أو حساب أو دفع. لن يتم خصم أي مبلغ. رقم RIP خيالي بوضوح.',
    simulatePay: 'محاكاة فتح التقرير', cancel: 'إلغاء', paymentDone: 'تمت محاكاة الفتح. لم يحدث أي دفع فعلي.',
    invalidVin: 'يجب أن يتكون رقم الهيكل من 17 خانة حرفية ورقمية (من دون I أو O أو Q).', invalidRegistration: 'أدخل السلسلة والسنة والولاية.', invalidValuation: 'تحقق من السنة والمسافة المقطوعة.', invalidPhone: 'أدخل رقم هاتف جزائرياً صحيحاً.', invalidQuote: 'أكمل بياناتك والسيارة واختر شركة واحدة على الأقل.',
    vinLabel: 'رقم الهيكل', plateLabel: 'التسجيل', yearLabel: 'سنة الطراز', months: 'شهر', simulated: 'محاكاة', close: 'إغلاق', vehiclePlaceholder: 'مثال: Renault Clio 4 1.5 dCi',
  },
} as const;

const wilayas = ['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M’Sila','Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M’Ghair','El Meniaa'];
const wilayaArabic: Record<string,string> = {
  Adrar:'أدرار',Chlef:'الشلف',Laghouat:'الأغواط','Oum El Bouaghi':'أم البواقي',Batna:'باتنة',Béjaïa:'بجاية',Biskra:'بسكرة',Béchar:'بشار',Blida:'البليدة',Bouira:'البويرة',Tamanrasset:'تمنراست',Tébessa:'تبسة',Tlemcen:'تلمسان',Tiaret:'تيارت','Tizi Ouzou':'تيزي وزو',Alger:'الجزائر',Djelfa:'الجلفة',Jijel:'جيجل',Sétif:'سطيف',Saïda:'سعيدة',Skikda:'سكيكدة','Sidi Bel Abbès':'سيدي بلعباس',Annaba:'عنابة',Guelma:'قالمة',Constantine:'قسنطينة',Médéa:'المدية',Mostaganem:'مستغانم','M’Sila':'المسيلة',Mascara:'معسكر',Ouargla:'ورقلة',Oran:'وهران','El Bayadh':'البيض',Illizi:'إليزي','Bordj Bou Arréridj':'برج بوعريريج',Boumerdès:'بومرداس','El Tarf':'الطارف',Tindouf:'تندوف',Tissemsilt:'تيسمسيلت','El Oued':'الوادي',Khenchela:'خنشلة','Souk Ahras':'سوق أهراس',Tipaza:'تيبازة',Mila:'ميلة','Aïn Defla':'عين الدفلى',Naâma:'النعامة','Aïn Témouchent':'عين تموشنت',Ghardaïa:'غرداية',Relizane:'غليزان',Timimoun:'تيميمون','Bordj Badji Mokhtar':'برج باجي مختار','Ouled Djellal':'أولاد جلال','Béni Abbès':'بني عباس','In Salah':'عين صالح','In Guezzam':'عين قزام',Touggourt:'تقرت',Djanet:'جانت','El M’Ghair':'المغير','El Meniaa':'المنيعة'
};
const insurers = ['SAA','CAAT','CIAR','Alliance Assurances','Cash','Trust'];
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

function InputField({ label, name, value, onChange, placeholder, type = 'text', min, max, testId, dir }: { label:string;name:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;min?:number;max?:number;testId:string;dir?:string }) {
  return <div className="field"><label htmlFor={name}>{label}</label><input className="input" id={name} name={name} type={type} min={min} max={max} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} data-testid={testId} dir={dir}/></div>;
}

function App() {
  const [lang,setLang] = useState<Lang>('fr');
  const [vin,setVin] = useState(''); const [series,setSeries] = useState(''); const [carYear,setCarYear] = useState(''); const [carWilaya,setCarWilaya] = useState('');
  const [vehicle,setVehicle] = useState<Vehicle|null>(null); const [vehicleError,setVehicleError] = useState('');
  const [valYear,setValYear] = useState('2019'); const [mileage,setMileage] = useState('85000'); const [condition,setCondition] = useState('good'); const [valuation,setValuation] = useState<Valuation|null>(null); const [valuationError,setValuationError] = useState('');
  const [checklist,setChecklist] = useState<Record<string,Status>>({});
  const [quoteName,setQuoteName] = useState(''); const [quotePhone,setQuotePhone] = useState(''); const [quoteWilaya,setQuoteWilaya] = useState(''); const [quoteVehicle,setQuoteVehicle] = useState(''); const [cover,setCover] = useState('third'); const [selectedInsurers,setSelectedInsurers] = useState<string[]>([]); const [quoteError,setQuoteError] = useState(''); const [quoteRequest,setQuoteRequest] = useState<QuoteRequest|null>(null);
  const [modalOpen,setModalOpen] = useState(false); const [paymentMethod,setPaymentMethod] = useState('baridi'); const [copied,setCopied] = useState(false); const [payment,setPayment] = useState<PaymentDemo|null>(null);
  const t = text[lang], isAr = lang === 'ar';
  const counts = useMemo(()=>statuses.reduce((out,status)=>{out[status]=Object.values(checklist).filter(s=>s===status).length;return out;},{ok:0,attn:0,crit:0} as Record<Status,number>),[checklist]);
  const allItems = useMemo(()=>Object.entries(categoryItems).flatMap(([category,items])=>items.map((label,index)=>({id:`${category}-${index+1}`,category:category as Category,label,arabic:categoryArabic[category as Category][index]}))),[]);
  const totalPoints = allItems.length;
  const inspectedCount = Object.keys(checklist).length;
  const score = Math.round((counts.ok + counts.attn*.55 + counts.crit*.1) / totalPoints * 100);
  const formatDzd = (v:number) => `${Math.round(v/1000).toLocaleString('fr-FR')} 000`;
  const displayWilaya = (name:string) => isAr ? (wilayaArabic[name]||name) : name;
  function identifyVehicle(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setVehicleError('');
    const normalized=vin.trim().toUpperCase();
    if(normalized && !/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized)){setVehicleError(t.invalidVin);return;}
    const hasRegistration=Boolean(series.trim()&&carYear&&carWilaya);
    if(!normalized&&!hasRegistration){setVehicleError(t.invalidRegistration);return;}
    const registrationYear=Number(carYear);
    if(hasRegistration&&(!Number.isInteger(registrationYear)||registrationYear<1960||registrationYear>new Date().getFullYear())){setVehicleError(t.invalidRegistration);return;}
    setVehicle({vin:normalized,series:series.trim(),year:carYear,wilaya:carWilaya,make:'Renault',model:'Clio',trim:'Expression',engine:'1.5 dCi · 85 ch',equipment:['ABS','Airbags frontaux','Direction assistée','Vitres électriques avant']});
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
    const validPhone=/^(?:\+213|0)(?:5|6|7)\d{8}$/.test(quotePhone.replace(/[ .-]/g,''));
    if(!quoteName.trim()||!validPhone||!quoteWilaya||!quoteVehicle.trim()||selectedInsurers.length===0){setQuoteError(validPhone||!quotePhone?t.invalidQuote:t.invalidPhone);return;}
    setQuoteRequest({name:quoteName,phone:quotePhone,wilaya:quoteWilaya,vehicle:quoteVehicle,cover,insurers:selectedInsurers});
  }
  function toggleInsurer(name:string) { setSelectedInsurers(prev=>prev.includes(name)?prev.filter(x=>x!==name):[...prev,name]);setQuoteRequest(null); }
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
              <div className="field full"><label htmlFor="vin">{t.vin}</label><input className="input" id="vin" value={vin} onChange={e=>{setVin(e.target.value.toUpperCase());setVehicle(null)}} placeholder={t.vinPlaceholder} maxLength={17} autoCapitalize="characters" data-testid="input-vin"/></div>
              <InputField label={t.series} name="series" value={series} onChange={v=>{setSeries(v);setVehicle(null)}} placeholder={t.seriesPlaceholder} testId="input-registration-series"/>
              <InputField label={t.year} name="registration-year" value={carYear} onChange={v=>{setCarYear(v);setVehicle(null)}} type="number" min={1960} max={new Date().getFullYear()} testId="input-registration-year"/>
              <div className="field full"><label htmlFor="car-wilaya">{t.wilaya}</label><select className="input" id="car-wilaya" value={carWilaya} onChange={e=>{setCarWilaya(e.target.value);setVehicle(null)}} data-testid="select-registration-wilaya"><option value="">{t.choose}</option>{wilayas.map(w=><option key={w} value={w}>{displayWilaya(w)}</option>)}</select></div>
            </div>
            {vehicleError&&<p className="error-text" role="alert" data-testid="error-vehicle">{vehicleError}</p>}
            <div className="form-actions"><button type="submit" className="btn btn-primary" data-testid="button-identify-vehicle"><CarFront size={15}/>{t.decode}<ChevronRight size={14}/></button></div>
          </form>
          {vehicle&&<div className="result-box" aria-live="polite" data-testid="result-vehicle-sheet"><div className="result-title"><BadgeCheck size={16}/>{vehicle.make} {vehicle.model} · {t.sheet} · {t.sample}</div><div className="spec-grid">
            <div className="spec-cell"><span>{t.engine}</span><strong>{vehicle.engine}</strong></div><div className="spec-cell"><span>{t.trim}</span><strong>{vehicle.trim}</strong></div><div className="spec-cell"><span>{t.yearLabel}</span><strong>{vehicle.year||t.notProvided}</strong></div>
            <div className="spec-cell"><span>{t.plateLabel}</span><strong>{vehicle.series||t.notProvided}</strong></div><div className="spec-cell"><span>{t.wilaya}</span><strong>{vehicle.wilaya?displayWilaya(vehicle.wilaya):t.notProvided}</strong></div><div className="spec-cell"><span>{t.fuel} / {t.gearbox}</span><strong>{t.fuelTransmission}</strong></div>
            <div className="spec-cell" style={{gridColumn:'1/-1'}}><span>{t.equipment}</span><strong>{t.equipmentValues}</strong></div>
          </div></div>}
        </div><div className="panel" style={{display:'flex',flexDirection:'column',justifyContent:'space-between',gap:18}}>
          <div><div className="panel-label">{isAr?'كيف تقرأ بياناتك':'À SAVOIR AVANT DE DÉCODER'}</div><h3 style={{fontSize:20,margin:'0 0 10px',letterSpacing:'-.5px'}}>{isAr?'رقم الهيكل ليس كل القصة':'Un numéro ne raconte pas tout.'}</h3><p className="section-intro" style={{maxWidth:400}}>{isAr?'استخدم رقم الهيكل للمقارنة مع الوثائق، وافحص السيارة ميدانياً.':'Comparez toujours le VIN aux documents du véhicule et vérifiez les éléments sur place.'}</p></div>
          <div className="notice"><Info size={15}/><span>{t.localDemo}</span></div>
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
        <div className="insurance-grid"><form className="panel" onSubmit={submitQuote} noValidate><div className="panel-label">{t.contactInfo}</div><div className="form-grid">
          <InputField label={t.fullName} name="quote-name" value={quoteName} onChange={v=>{setQuoteName(v);setQuoteRequest(null)}} placeholder={isAr?'الاسم واللقب':'Nom et prénom'} testId="input-quote-name"/>
          <InputField label={t.phone} name="quote-phone" value={quotePhone} onChange={v=>{setQuotePhone(v);setQuoteRequest(null)}} placeholder="05 55 12 34 56" type="tel" testId="input-quote-phone" dir="ltr"/>
          <div className="field"><label htmlFor="quote-wilaya">{t.wilaya}</label><select className="input" id="quote-wilaya" value={quoteWilaya} onChange={e=>{setQuoteWilaya(e.target.value);setQuoteRequest(null)}} data-testid="select-quote-wilaya"><option value="">{t.choose}</option>{wilayas.map(w=><option key={w} value={w}>{displayWilaya(w)}</option>)}</select></div>
          <InputField label={t.vehicle} name="quote-vehicle" value={quoteVehicle} onChange={v=>{setQuoteVehicle(v);setQuoteRequest(null)}} placeholder={t.vehiclePlaceholder} testId="input-quote-vehicle"/>
          <div className="field full"><label htmlFor="cover">{t.cover}</label><select className="input" id="cover" value={cover} onChange={e=>{setCover(e.target.value);setQuoteRequest(null)}} data-testid="select-cover"><option value="third">{t.thirdParty}</option><option value="comprehensive">{t.comprehensive}</option></select></div>
          <div className="field full"><label>{t.providers}</label><div className="insurers">{insurers.map(name=><label className="insurer-option" key={name}><input type="checkbox" checked={selectedInsurers.includes(name)} onChange={()=>toggleInsurer(name)} data-testid={`checkbox-insurer-${name.toLowerCase().replaceAll(' ','-')}`}/><span>{name}</span></label>)}</div><span className="helper">{t.insurerHint}</span></div>
        </div>{quoteError&&<p className="error-text" role="alert" data-testid="error-quote">{quoteError}</p>}<div className="form-actions"><button className="btn btn-primary" type="submit" data-testid="button-request-quote"><ShieldCheck size={15}/>{t.requestOffers}</button></div></form>
          <div className="panel"><div className="panel-label">{t.quoteResults} · {t.simulated}</div>
            {quoteRequest?<><div className="result-title"><Check size={15}/>{quoteRequest.name} · {quoteRequest.vehicle}</div>{quoteRequest.insurers.map((name,index)=>{const base=quoteRequest.cover==='comprehensive'?68000:24500;const price=base+(index*7350)+(quoteRequest.wilaya==='Alger'?4900:0);return <div className="offer-card" key={name} data-testid={`offer-${name.toLowerCase().replaceAll(' ','-')}`}><div className="offer-line"><span>{name}</span><strong>{price.toLocaleString('fr-FR')} DA</strong></div><div className="offer-line"><span>{quoteRequest.cover==='comprehensive'?t.comprehensive:t.thirdParty} · {t.wilaya}</span><span>{displayWilaya(quoteRequest.wilaya)}</span></div><div className="helper">{t.annual}</div></div>})}</>:<><p className="section-intro" style={{maxWidth:'none'}}>{isAr?'أكمل الطلب لعرض أسعار محاكاة تساعدك على تكوين فكرة أولية.':'Complétez le formulaire pour découvrir des montants simulés et préparer vos questions.'}</p><div className="notice warn" style={{marginTop:17}}><AlertTriangle size={14}/><span>{t.quoteNotice}</span></div></>}
          </div>
        </div>
      </section>

      <section className="section" id="report">
        <div className="section-heading"><div><div className="section-index">05 / {t.navReport.toUpperCase()}</div><h2>{t.reportTitle}</h2></div><p className="section-intro">{t.reportBody}</p></div>
        {!payment?.unlocked?<div className="unlock-banner"><div className="unlock-copy"><strong><LockKeyhole size={15} style={{verticalAlign:'middle',marginInlineEnd:7}}/>{t.reportTitle}</strong><span>{t.reportBody}</span></div><button type="button" className="btn btn-primary" onClick={openModal} data-testid="button-open-payment">{t.unlock}<ArrowUpRight size={14}/></button></div>:
        <div className="report-unlocked" aria-live="polite" data-testid="status-report-unlocked"><div className="result-title"><BadgeCheck size={18}/>{t.unlocked}</div><p>{t.unlockedBody}</p><h3><FileText size={16} style={{verticalAlign:'middle',marginInlineEnd:8}}/>{t.reportSummary}</h3><p>{t.reportSummaryBody}</p><div className="spec-grid"><div className="spec-cell"><span>{t.inspected}</span><strong>{inspectedCount} / {totalPoints}</strong></div><div className="spec-cell"><span>{t.critical}</span><strong>{counts.crit}</strong></div><div className="spec-cell"><span>{t.attention}</span><strong>{counts.attn}</strong></div><div className="spec-cell"><span>{t.estimation}</span><strong>{valuation?`${formatDzd(valuation.market)} DA`:'—'}</strong></div><div className="spec-cell"><span>{t.vehicle}</span><strong>{quoteVehicle||vehicle?.model||'—'}</strong></div><div className="spec-cell"><span>{t.wilaya}</span><strong>{displayWilaya(quoteWilaya||vehicle?.wilaya||'—')}</strong></div></div><div className="notice" style={{marginTop:15}}><Info size={14}/><span>{t.paymentDone}</span></div></div>}
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
