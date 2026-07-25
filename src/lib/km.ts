import type { JobStatus } from "@/types/transcribe";

export const km = {
  email: "អ៊ីមែល",
  password: "ពាក្យសម្ងាត់",
  confirmPassword: "បញ្ជាក់ពាក្យសម្ងាត់",
  signIn: "ចូល",
  signOut: "ចាកចេញ",
  register: "បង្កើតគណនី",
  signingIn: "កំពុងចូល...",
  creatingAccount: "កំពុងបង្កើតគណនី...",
  noAccount: "មិនទាន់មានគណនី?",
  hasAccount: "មានគណនីរួចហើយ?",
  createAccount: "បង្កើតគណនី",
  account: "គណនី",
  menu: "បើកម៉ឺនុយ",

  loginTitle: "ចូលគណនី",
  loginSubtitle: "ចូលប្រើជាមួយអ៊ីមែល និងពាក្យសម្ងាត់",
  registerTitle: "បង្កើតគណនី",
  registerSubtitle: "បង្កើតគណនីដើម្បីរក្សាទុកការបម្លែង និងស្តាប់ប្រវត្តិសំឡេង",
  authWelcome: "បម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរយ៉ាងត្រឹមត្រូវ",
  authTagline: "សេវាបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរយ៉ាងត្រឹមត្រូវ",

  passwordMismatch: "ពាក្យសម្ងាត់មិនត្រូវគ្នា",
  passwordTooShort: "ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច ៦ តួអក្សរ",
  loginFailed: "ចូលគណនីមិនបានសម្រេច",
  registerFailed: "បង្កើតគណនីមិនបានសម្រេច",

  authNotConfigured:
    "ប្រព័ន្ធចូលគណនីមិនទាន់ត្រូវបានកំណត់រចនាសម្ព័ន្ធត្រឹមត្រូវ។ សូមពិនិត្យ NEXT_PUBLIC_SUPABASE_ANON_KEY ក្នុង web/.env.local ហើយចាប់ផ្តើម npm run dev ម្តងទៀត",
  authWrongKey:
    "បានប្រើ secret/service role key ខុស។ សូមប្រើ publishable key (sb_publishable_...) ក្នុង web/.env.local",
  invalidCredentials: "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ",
  emailAlreadyRegistered: "អ៊ីមែលនេះមានគណនីរួចហើយ",
  emailNotConfirmed: "សូមបញ្ជាក់អ៊ីមែលរបស់អ្នកមុនពេលចូល",
  emailRateLimit:
    "បានផ្ញើអ៊ីមែលច្រើនដងពេក។ សូមរង់ចាំ ១៥–៦០ នាទី ហើយព្យាយាមម្តងទៀត",

  language: "ភាសា",
  languageKhmer: "ខ្មែរ",
  languageEnglish: "អង់គ្លេស",

  uploadTitle: "បញ្ចូលឯកសារសំឡេង",
  uploadSubtitle:
    "បញ្ចូលឯកសារសំឡេងរបស់អ្នក — ឯកសារខ្លីបញ្ចប់ក្នុងរយៈពេលខ្លី ឯកសារវែងនឹងដំណើរការក្នុងផ្ទៃខាងក្រោយ",
  transcribe: "បម្លែងសំឡេង",
  working: "កំពុងដំណើរការ...",
  copyText: "ចម្លងអត្ថបទ",
  copied: "បានចម្លង",

  historyTitle: "ប្រវត្តិបម្លែង",
  historySubtitle: "ការបម្លែងមុនៗ — ចុចដើម្បីមើល និងស្តាប់",
  closeHistory: "បិទ",
  noHistory: "មិនទាន់មានប្រវត្តិបម្លែង",
  untitledAudio: "ឯកសារសំឡេងគ្មានឈ្មោះ",

  resultTitle: "លទ្ធផលបម្លែង",
  resultSubtitle: "លទ្ធផលបម្លែងរបស់អ្នកនឹងបង្ហាញនៅទីនេះ",
  noResult: "មិនទាន់មានលទ្ធផល",
  noResultHint:
    "បញ្ចូលឯកសារសំឡេងខាងឆ្វេង ហើយចុចបម្លែងសំឡេង ឬចុចប្រវត្តិបម្លែងដើម្បីមើលការបម្លែងមុនៗ",
  transcribing: "កំពុងបម្លែងសំឡេង...",
  loading: "កំពុងផ្ទុក...",
  waitProcessing: "សូមរង់ចាំ កំពុងដំណើរការឯកសារសំឡេងរបស់អ្នក",
  loadingTranscription: "កំពុងផ្ទុកលទ្ធផលបម្លែង...",

  transcriptionFailed: "ការបម្លែងមិនបានសម្រេច",
  loadFailed: "ផ្ទុកលទ្ធផលបម្លែងមិនបានសម្រេច",
  serviceNotReady: (missing: string) =>
    `សេវាកម្មមិនទាន់រួចរាល់ — ខ្វះ៖ ${missing}។ ពិនិត្យ transcribe_service/.env`,
  apiUnreachable:
    "មិនអាចភ្ជាប់ទៅ API បម្លែងសំឡេងបានទេ។ ដំណើរការ៖ cd transcribe_service && python run.py",
  gcpMissing: "សេវាបម្លែងសំឡេង",
  supabaseMissing: "មូលដ្ឋានទិន្នន័យ",

  dropAudio: "ទម្លាក់ឯកសារសំឡេងនៅទីនេះ",
  browseAudio: "ឬចុចដើម្បីជ្រើសរើស — គាំទ្រ MP3, WAV, M4A, FLAC",
  changeFile: "ចុចដើម្បីផ្លាស់ប្តូរឯកសារ",

  originalAudio: "សំឡេងដើម",
  audioUnsupported: "កម្មវិធីរុករករបស់អ្នកមិនគាំទ្រការចាក់សំឡេង",
  noSpeech: "មិនបានរកឃើញសំឡេង",
  segments: "ផ្នែកពេលវេលា",
  detectSpeakers: "រកឃើញអ្នកនិយាយ",
  detectSpeakersHint:
    "បែងចែកអ្នកនិយាយ ១ / ២ — ដំណើរការជាមួយភាសាខ្មែរ (អាចចំណាយពេលបន្ថែម)",
  detectSpeakersUnavailableService:
    "សេវារកឃើញអ្នកនិយាយមិនទាន់រួច — ពិនិត្យ HUGGINGFACE_TOKEN និងចាប់ផ្តើម API ថ្មីឡើងវិញ",
  speakerLabel: (id: string) => `អ្នកនិយាយ ${id}`,
  unknownSpeaker: "អ្នកនិយាយ",
  speakerTranscript: "សន្ទនាតាមអ្នកនិយាយ",
  speakerCount: (n: number) => `${n} អ្នកនិយាយ`,
  transcriptionResult: "លទ្ធផលបម្លែង",

  longAudioHint:
    "សំឡេងវែងអាចចំណាយពេល ៣០ នាទីឬច្រើនជាងនេះ។ អ្នកអាចទុកផ្ទាំងនេះបើកទុកបាន",
  progressLabel: (percent: number) => `${percent}%`,
  estimatedRemaining: (time: string) => `ប៉ាន់ប្រមាណ ${time}`,
  calculatingEta: "កំពុងគណនាពេលវេលា...",
  delete: "លុប",
  deleteTitle: "លុបការបម្លែង",
  deleteConfirm:
    "តើអ្នកប្រាកដថាចង់លុបការបម្លែងនេះទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញได้។",
  deleteFailed: "លុបមិនបានសម្រេច",
  deleting: "កំពុងលុប...",
  cancel: "បោះបង់",

  heroTagline: "ការបម្លែងសំឡេងភាសាខ្មែរ",
  featuresSubtitle:
    "អ្វីៗគ្រប់យ៉ាងដើម្បីបម្លែងសំឡេងខ្មែរទៅជាអក្សរយ៉ាងត្រឹមត្រូវ",
  stepsSubtitle: "តែ ៣ ជំហានសាមញ្ញដើម្បីទទួលបានលទ្ធផល",
  ctaSubtitle:
    "បញ្ចូលឯកសារសំឡេងរបស់អ្នក ហើយទទួលបានការបម្លែងភាសាខ្មែរយ៉ាងត្រឹមត្រូវក្នុងរយៈពេលខ្លី",
  learnMore: "ស្វែងយល់បន្ថែម",
  getStarted: "ចាប់ផ្តើម",
  getStartedTranscribe: "ចាប់ផ្តើមបម្លែងសំឡេងឥឡូវនេះ",
  getStartedNow: "ចាប់ផ្តើមឥឡូវនេះ",
  startTranscribe: "ចាប់ផ្តើមបម្លែងសំឡេង",

  home: "ទំព័រដើម",
  transcribeNav: "បម្លែងសំឡេង",
  navFeatures: "លក្ខណៈពិសេស",
  navHow: "របៀបដំណើរការ",
  searchAria: "ស្វែងរក",
  pages: "ទំព័រ",
  info: "ព័ត៌មាន",
  languagesInfo: "ភាសា៖ ខ្មែរ · អង់គ្លេស",
  durationInfo: "រយៈពេល៖ រហូតដល់ ១ ម៉ោង",
  footerAbout: "អំពីយើង",
  footerNews: "ព័ត៌មាន",
  footerArticles: "អត្ថបទ",
  footerContact: "ទំនាក់ទំនង",
  footerTagline: "សេវាបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរយ៉ាងត្រឹមត្រូវ និងរហ័ស។",
  footerEmail: "info@somlengkhmer.com",
  footerPhone: "+855 12 345 678",
  footerPhoneTel: "+85512345678",
  footerAddress: "ភ្នំពេញ, ព្រះរាជាណាចក្រកម្ពុជា",
  footerRights: "រក្សាសិទ្ធិគ្រប់យ៉ាង",
} as const;

export function jobStatusLabel(status: JobStatus): string {
  switch (status) {
    case "queued":
      return "កំពុងរង់ចាំចាប់ផ្តើម...";
    case "processing":
      return "កំពុងដំណើរការឯកសារសំឡេង...";
    case "completed":
      return "បម្លែងសំឡេងបានបញ្ចប់";
    case "failed":
      return "ការបម្លែងមិនបានសម្រេច";
    default:
      return status;
  }
}

export function jobStatusBadge(status: JobStatus): string {
  switch (status) {
    case "queued":
      return "រង់ចាំ";
    case "processing":
      return "កំពុងដំណើរការ";
    case "completed":
      return "បានបញ្ចប់";
    case "failed":
      return "បរាជ័យ";
    default:
      return status;
  }
}

export function formatDateKm(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleString("km-KH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
