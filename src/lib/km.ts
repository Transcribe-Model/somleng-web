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
  ttsNav: "អត្ថបទទៅសំឡេង",
  dashboardNav: "ផ្ទាំងគ្រប់គ្រង",
  dashboardTitle: "ផ្ទាំងគ្រប់គ្រង",
  dashboardSubtitle: "ជ្រើសរើសឧបករណ៍ដើម្បីចាប់ផ្តើម",
  dashboardOpen: "បើក",
  dashboardOverview: "ទិដ្ឋភាពទូទៅ",
  dashboardMenu: "ម៉ឺនុយ",
  transcribeCardDesc: "បញ្ចូលសំឡេង ហើយបម្លែងទៅជាអត្ថបទខ្មែរ ឬអង់គ្លេស",
  ttsCardDesc: "វាយអត្ថបទ ហើយស្តាប់ ឬទាញយកជា MP3",
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

  ttsTitle: "អត្ថបទទៅសំឡេង",
  ttsSubtitle: "វាយ ឬបិទភ្ជាប់អត្ថបទ ហើយស្តាប់សំឡេងភាសាខ្មែរ ឬអង់គ្លេស",
  ttsPlaceholder: "វាយ ឬបិទភ្ជាប់អត្ថបទនៅទីនេះ...",
  ttsSpeak: "និយាយ",
  ttsSpeaking: "កំពុងបង្កើតសំឡេង...",
  ttsDownload: "ទាញយក MP3",
  ttsResult: "សំឡេងដែលបានបង្កើត",
  ttsFailed: "ការបង្កើតសំឡេងមិនបានសម្រេច",
  ttsCharCount: (current: number, max: number) => `${current} / ${max}`,
  ttsOverLimit: (max: number) => `អត្ថបទមិនអាចលើស ${max} តួអក្សរ`,

  ttsModeLabel: "របៀបសំឡេង",
  ttsModeDefault: "សំឡេងលំនាំដើម",
  ttsModeClone: "ចម្លងសំឡេងរបស់ខ្ញុំ",
  ttsCloneHint:
    "ថត ឬបញ្ចូលសំឡេងខ្លី (ប្រហែល ៣–១០ វិនាទី) ក្នុងបន្ទប់ស្ងាត់ ដើម្បីចម្លងសំឡេងរបស់អ្នក",
  ttsCloneUpload: "បញ្ចូលឯកសារសំឡេងយោង",
  ttsCloneChangeFile: "ផ្លាស់ប្តូរឯកសារ",
  ttsCloneRecord: "ថតសំឡេង",
  ttsCloneRecording: "កំពុងថត...",
  ttsCloneStop: "បញ្ឈប់ការថត",
  ttsCloneClear: "លុបសំឡេងយោង",
  ttsCloneConsent:
    "ខ្ញុំជាម្ចាស់សំឡេងនេះ ហើយអនុញ្ញាតឱ្យប្រើសំឡេងនេះដើម្បីចម្លងសំឡេងសិប្បនិម្មិត",
  ttsCloneNeedReference: "សូមថត ឬបញ្ចូលសំឡេងយោងមុនពេលនិយាយ",
  ttsCloneNeedConsent: "សូមយល់ព្រមការអនុញ្ញាតមុនពេលចម្លងសំឡេង",
  ttsCloneMicDenied: "មិនអាចប្រើមីក្រូហ្វូនបានទេ។ សូមអនុញ្ញាតការចូលប្រើ ឬបញ្ចូលឯកសារជំនួស",
  ttsCloneUnsupportedMic: "កម្មវិធីរុករករបស់អ្នកមិនគាំទ្រការថតសំឡេង",
  ttsCloning: "កំពុងចម្លងសំឡេង សូមរង់ចាំ...",
  ttsCloneFailed: "ការចម្លងសំឡេងមិនបានសម្រេច",
  ttsClonePreview: "សំឡេងយោង",
} as const;

export const en = {
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm password",
  signIn: "Sign in",
  signOut: "Sign out",
  register: "Register",
  signingIn: "Signing in...",
  creatingAccount: "Creating account...",
  noAccount: "No account yet?",
  hasAccount: "Already have an account?",
  createAccount: "Create account",
  account: "Account",
  menu: "Open menu",

  loginTitle: "Sign in",
  loginSubtitle: "Use your email and password to continue",
  registerTitle: "Create account",
  registerSubtitle: "Create an account to save transcripts and history",
  authWelcome: "Accurate Khmer speech-to-text transcription",
  authTagline: "A reliable speech transcription service for Khmer audio",

  passwordMismatch: "Passwords do not match",
  passwordTooShort: "Password must be at least 6 characters",
  loginFailed: "Sign in failed",
  registerFailed: "Account creation failed",

  authNotConfigured:
    "Authentication is not configured yet. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local and restart npm run dev",
  authWrongKey:
    "You are using the wrong secret/service role key. Use the publishable key (sb_publishable_...) in web/.env.local",
  invalidCredentials: "Email or password is incorrect",
  emailAlreadyRegistered: "This email is already registered",
  emailNotConfirmed: "Please confirm your email before signing in",
  emailRateLimit:
    "Too many emails sent. Please wait 15–60 minutes and try again",

  language: "Language",
  languageKhmer: "Khmer",
  languageEnglish: "English",

  uploadTitle: "Upload audio",
  uploadSubtitle:
    "Upload your audio file — short clips process quickly, long recordings run in the background",
  transcribe: "Transcribe",
  working: "Working...",
  copyText: "Copy text",
  copied: "Copied",

  historyTitle: "Transcription history",
  historySubtitle: "Previous transcriptions — click to listen and review",
  closeHistory: "Close",
  noHistory: "No transcription history yet",
  untitledAudio: "Untitled audio",

  resultTitle: "Transcription result",
  resultSubtitle: "Your transcription result will appear here",
  noResult: "No result yet",
  noResultHint:
    "Upload an audio file on the left and click transcription or open history to view previous results",
  transcribing: "Transcribing audio...",
  loading: "Loading...",
  waitProcessing: "Please wait while your audio is being processed",
  loadingTranscription: "Loading transcription result...",

  transcriptionFailed: "Transcription failed",
  loadFailed: "Could not load transcription result",
  serviceNotReady: (missing: string) =>
    `The service is not ready yet — missing: ${missing}. Check transcribe_service/.env`,
  apiUnreachable:
    "Could not reach the transcription API. Run: cd transcribe_service && python run.py",
  gcpMissing: "Transcription service",
  supabaseMissing: "Database",

  dropAudio: "Drop your audio here",
  browseAudio: "or click to browse — supports MP3, WAV, M4A, FLAC",
  changeFile: "Click to change file",

  originalAudio: "Original audio",
  audioUnsupported: "Your browser does not support audio playback",
  noSpeech: "No speech detected",
  segments: "Segments",
  detectSpeakers: "Detect speakers",
  detectSpeakersHint:
    "Separate speakers 1 / 2 — processed with Khmer language support (may take longer)",
  detectSpeakersUnavailableService:
    "Speaker detection is not ready yet — check HUGGINGFACE_TOKEN and restart the API",
  speakerLabel: (id: string) => `Speaker ${id}`,
  unknownSpeaker: "Speaker",
  speakerTranscript: "Speaker transcript",
  speakerCount: (n: number) => `${n} speakers`,
  transcriptionResult: "Transcription result",

  longAudioHint:
    "Long recordings may take up to 30 minutes or more. You can leave this tab open while it works.",
  progressLabel: (percent: number) => `${percent}%`,
  estimatedRemaining: (time: string) => `Estimated ${time}`,
  calculatingEta: "Calculating time remaining...",
  delete: "Delete",
  deleteTitle: "Delete transcription",
  deleteConfirm:
    "Are you sure you want to delete this transcription? This action cannot be undone.",
  deleteFailed: "Deletion failed",
  deleting: "Deleting...",
  cancel: "Cancel",

  heroTagline: "Khmer speech transcription",
  featuresSubtitle:
    "Everything you need to transcribe Khmer audio with clarity and accuracy",
  stepsSubtitle: "Only 3 simple steps to get your transcript",
  ctaSubtitle:
    "Upload your audio file and get an accurate Khmer transcript in minutes",
  learnMore: "Learn more",
  getStarted: "Get started",
  getStartedTranscribe: "Start transcription",
  getStartedNow: "Get started now",
  startTranscribe: "Start transcription",

  home: "Home",
  transcribeNav: "Transcribe",
  ttsNav: "Text to speech",
  dashboardNav: "Dashboard",
  dashboardTitle: "Dashboard",
  dashboardSubtitle: "Choose a tool to get started",
  dashboardOpen: "Open",
  dashboardOverview: "Overview",
  dashboardMenu: "Menu",
  transcribeCardDesc: "Upload audio and convert it to Khmer or English text",
  ttsCardDesc: "Type text, then listen or download as MP3",
  navFeatures: "Features",
  navHow: "How it works",
  searchAria: "Search",
  pages: "Pages",
  info: "Information",
  languagesInfo: "Languages: Khmer · English",
  durationInfo: "Duration: up to 1 hour",
  footerAbout: "About",
  footerNews: "News",
  footerArticles: "Articles",
  footerContact: "Contact",
  footerTagline:
    "Reliable and fast Khmer speech-to-text service that turns audio into accurate written text.",
  footerEmail: "info@somlengkhmer.com",
  footerPhone: "+855 12 345 678",
  footerPhoneTel: "+85512345678",
  footerAddress: "Phnom Penh, Cambodia",
  footerRights: "All rights reserved",

  ttsTitle: "Text to speech",
  ttsSubtitle: "Type or paste text, then listen in Khmer or English",
  ttsPlaceholder: "Type or paste text here...",
  ttsSpeak: "Speak",
  ttsSpeaking: "Generating audio...",
  ttsDownload: "Download MP3",
  ttsResult: "Generated audio",
  ttsFailed: "Text-to-speech failed",
  ttsCharCount: (current: number, max: number) => `${current} / ${max}`,
  ttsOverLimit: (max: number) => `Text cannot exceed ${max} characters`,

  ttsModeLabel: "Voice mode",
  ttsModeDefault: "Default voice",
  ttsModeClone: "Clone my voice",
  ttsCloneHint:
    "Record or upload a short sample (about 3–10 seconds) in a quiet room to clone your voice",
  ttsCloneUpload: "Upload reference audio",
  ttsCloneChangeFile: "Change file",
  ttsCloneRecord: "Record",
  ttsCloneRecording: "Recording...",
  ttsCloneStop: "Stop recording",
  ttsCloneClear: "Clear reference audio",
  ttsCloneConsent:
    "I own this voice sample and allow it to be used to create a synthetic clone",
  ttsCloneNeedReference: "Please record or upload reference audio before speaking",
  ttsCloneNeedConsent: "Please accept the consent before cloning a voice",
  ttsCloneMicDenied:
    "Microphone access was denied. Allow access or upload a file instead",
  ttsCloneUnsupportedMic: "Your browser does not support audio recording",
  ttsCloning: "Cloning voice, please wait...",
  ttsCloneFailed: "Voice cloning failed",
  ttsClonePreview: "Reference audio",
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
