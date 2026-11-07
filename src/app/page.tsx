"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { km } from "@/lib/km";

const FEATURES = {
  km: [
    {
      title: "ភាសាខ្មែរ",
      desc: "បង្កើតឡើងសម្រាប់សំឡេងខ្មែរ — បម្លែងយ៉ាងត្រឹមត្រូវសម្រាប់អ្នកនិយាយភាសាកំណើត។",
    },
    {
      title: "រហ័ស និងងាយស្រួល",
      desc: "បញ្ចូលឯកសារសំឡេង ហើយទទួលបានលទ្ធផលក្នុងរយៈពេលខ្លីសម្រាប់ឯកសារខ្លី។",
    },
    {
      title: "សំឡេងវែង",
      desc: "គាំទ្រការថតសំឡេងរហូតដល់ ១ ម៉ោង ជាមួយការដំណើរការក្នុងផ្ទៃខាងក្រោយដោយស្វ័យប្រវត្តិ។",
    },
    {
      title: "ទម្រង់ឯកសារច្រើន",
      desc: "ដំណើរការជាមួយ MP3, WAV, M4A, FLAC និងទម្រង់សំឡេងទូទៅផ្សេងៗទៀត។",
    },
    {
      title: "ចម្លងអត្ថបទ",
      desc: "ចម្លងអត្ថបទពេញលេខ ឬមើលផ្នែកតាមពេលវេលាក្នុងមួយចុច។",
    },
    {
      title: "ភាសាពីរ",
      desc: "បម្លែងជាភាសាខ្មែរ ឬអង់គ្លេស — ប្តូរភាសាតាមការបញ្ចូលឯកសារ។",
    },
  ],
  en: [
    {
      title: "Khmer language",
      desc: "Built for Khmer speech — accurate transcription for native speakers and everyday use.",
    },
    {
      title: "Fast and easy",
      desc: "Upload an audio file and get results quickly for short recordings.",
    },
    {
      title: "Long audio",
      desc: "Supports recordings up to 1 hour with automated background processing.",
    },
    {
      title: "Multiple formats",
      desc: "Works with MP3, WAV, M4A, FLAC and other common audio formats.",
    },
    {
      title: "Copy transcript",
      desc: "Copy the full transcript or review timestamped sections with one click.",
    },
    {
      title: "Two languages",
      desc: "Transcribe in Khmer or English — switch language when you upload your file.",
    },
  ],
} as const;

const STEPS = {
  km: [
    {
      step: "០១",
      title: "បញ្ចូលឯកសារ",
      desc: "បញ្ចូលឯកសារសំឡេងពីកុំព្យូទ័ររបស់អ្នក។",
    },
    {
      step: "០២",
      title: "ជ្រើសរើសភាសា",
      desc: "ជ្រើសរើសខ្មែរ ឬអង់គ្លេស ដើម្បីទទួលបានភាពត្រឹមត្រូវល្អបំផុត។",
    },
    {
      step: "០៣",
      title: "ទទួលលទ្ធផល",
      desc: "ទទួលបានលទ្ធផលបម្លែង ហើយចម្លងភ្លាមៗ។",
    },
  ],
  en: [
    {
      step: "01",
      title: "Upload your file",
      desc: "Add an audio recording from your computer.",
    },
    {
      step: "02",
      title: "Choose the language",
      desc: "Select Khmer or English for the best transcription accuracy.",
    },
    {
      step: "03",
      title: "Get the result",
      desc: "Receive the transcript instantly and copy it right away.",
    },
  ],
} as const;

const ABOUT = {
  km: {
    title: "អំពីសម្លេងខ្មែរ",
    subtitle: "សេវាបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរ — សម្រាប់អ្នកប្រើជារៀងរាល់ថ្ងៃ",
    points: [
      "សម្លេងខ្មែរ ត្រូវបានបង្កើតឡើងសម្រាប់សំឡេងភាសាខ្មែរ — ដើម្បីឱ្យអ្នកនិយាយភាសាកំណើតទទួលបានការបម្លែងដែលងាយអាន និងត្រឹមត្រូវ។",
      "យើងផ្តោតលើភាពត្រឹមត្រូវ ល្បឿន និងភាពងាយស្រួល សម្រាប់ឯកសារខ្លី ឬសំឡេងវែងរហូតដល់ ១ ម៉ោង។",
      "មិនចាំបាច់ជាអ្នកបច្ចេកទេសទេ — បញ្ចូលឯកសារ ជ្រើសរើសភាសា ហើយទទួលលទ្ធផលដើម្បីចម្លង ឬរក្សាទុក។",
    ],
  },
  en: {
    title: "About Somleng Khmer",
    subtitle: "Khmer speech-to-text built for everyday users",
    points: [
      "Somleng Khmer is built for Khmer speech — so native speakers get clear, accurate transcripts.",
      "We focus on accuracy, speed, and simplicity for short clips and recordings up to 1 hour.",
      "No technical setup needed — upload a file, choose a language, then copy or save your result.",
    ],
  },
} as const;

const USE_CASES = {
  km: {
    title: "ប្រើសម្រាប់អ្វីខ្លះ",
    subtitle: "សម្រាប់ការងារ ការសិក្សា និងការរក្សាទុកខ្លឹមសារសំឡេងជាអក្សរ",
    items: [
      {
        title: "ប្រជុំ និងការងារ",
        desc: "បម្លែងការថតប្រជុំ ឬសំឡេងការងារទៅជាអត្ថបទ ដើម្បីកត់ត្រា និងចែករំលែកងាយស្រួល។",
      },
      {
        title: "សារព័ត៌មាន និងមេឌៀ",
        desc: "ប្រែសំឡេងសម្ភាសន៍ ឬឯកសារសារព័ត៌មានទៅជាអក្សរ ដើម្បីសរសេរ និងពិនិត្យលឿនជាងមុន។",
      },
      {
        title: "អប់រំ",
        desc: "បម្លែងមេរៀន ឬការបង្រៀនសំឡេងទៅជាអត្ថបទសម្រាប់សិស្ស និងគ្រូ។",
      },
      {
        title: "ភាពងាយស្រួលប្រើ",
        desc: "ជួយអ្នកដែលចង់អានជំនួសការស្តាប់ ឬរក្សាទុកខ្លឹមសារសំឡេងជាអក្សរ។",
      },
    ],
  },
  en: {
    title: "What you can use it for",
    subtitle: "Useful for work, learning, and turning spoken content into text",
    items: [
      {
        title: "Meetings and work",
        desc: "Turn meeting recordings or work audio into text that is easy to keep and share.",
      },
      {
        title: "Journalism and media",
        desc: "Convert interviews or media recordings into text for faster drafting and review.",
      },
      {
        title: "Education",
        desc: "Transcribe lessons or spoken lectures into text for students and teachers.",
      },
      {
        title: "Accessibility",
        desc: "Help people who prefer reading over listening, or need a written record of audio.",
      },
    ],
  },
} as const;

const FAQS = {
  km: {
    title: "សំណួរដែលគេសួរញឹកញាប់",
    subtitle: "ព័ត៌មានសង្ខេបអំពីទម្រង់ឯកសារ ភាសា និងរបៀបប្រើ",
    items: [
      {
        q: "គាំទ្រទម្រង់ឯកសារអ្វីខ្លះ?",
        a: "គាំទ្រ MP3, WAV, M4A, FLAC និងទម្រង់សំឡេងទូទៅផ្សេងៗទៀត។",
      },
      {
        q: "ឯកសារសំឡេងអាចវែងប៉ុណ្ណា?",
        a: "អ្នកអាចបម្លែងសំឡេងរហូតដល់ប្រហែល ១ ម៉ោង។ ឯកសារវែងនឹងដំណើរការក្នុងផ្ទៃខាងក្រោយ។",
      },
      {
        q: "គាំទ្រភាសាអ្វីខ្លះ?",
        a: "គាំទ្រភាសាខ្មែរ និងអង់គ្លេស — ជ្រើសរើសភាសាតាមសំឡេងដែលអ្នកបញ្ចូល។",
      },
      {
        q: "អាចរកឃើញអ្នកនិយាយបានទេ?",
        a: "បាទ/ចាស អ្នកអាចបើកការរកឃើញអ្នកនិយាយ ដើម្បីបែងចែកសន្ទនាតាមអ្នកនិយាយ (អាចចំណាយពេលបន្ថែម)។",
      },
      {
        q: "តើត្រូវមានគណនីទេ?",
        a: "បង្កើតគណនីដើម្បីរក្សាទុកប្រវត្តិបម្លែង ហើយត្រឡប់មកមើល ឬស្តាប់ម្តងទៀតបាន។",
      },
    ],
  },
  en: {
    title: "Frequently asked questions",
    subtitle: "Quick answers about formats, languages, and how to use the service",
    items: [
      {
        q: "Which file formats are supported?",
        a: "MP3, WAV, M4A, FLAC, and other common audio formats.",
      },
      {
        q: "How long can an audio file be?",
        a: "You can transcribe audio up to about 1 hour. Longer files process in the background.",
      },
      {
        q: "Which languages are supported?",
        a: "Khmer and English — choose the language that matches your audio.",
      },
      {
        q: "Can it detect speakers?",
        a: "Yes. You can enable speaker detection to separate the conversation by speaker (it may take longer).",
      },
      {
        q: "Do I need an account?",
        a: "Create an account to save transcription history and come back to review or listen later.",
      },
    ],
  },
} as const;

export default function HomePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isKhmer = language === "km";
  const features = FEATURES[language];
  const steps = STEPS[language];
  const about = ABOUT[language];
  const useCases = USE_CASES[language];
  const faqs = FAQS[language];

  return (
    <SiteLayout>
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-cream px-4 py-10 sm:px-6 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 70% 20%, rgba(184,142,79,0.12), transparent)",
          }}
        />
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <Image
            src="/logo.png"
            alt="សម្លេងខ្មែរ"
            width={320}
            height={112}
            priority
            className="mx-auto mb-6 h-16 w-auto object-contain sm:mb-8 sm:h-20 md:h-24"
          />
          <p className="khmer-text mb-4 text-sm font-medium text-gold">
            {isKhmer ? km.heroTagline : "Khmer speech transcription"}
          </p>
          <h1 className="khmer-text text-3xl font-bold leading-snug text-navy sm:text-4xl md:text-5xl">
            {isKhmer ? (
              <>
                បម្លែង<span className="text-gold">សំឡេង</span>ទៅជា
                <span className="text-gold">អក្សរ</span>
                <br />
                យ៉ាង<span className="text-gold">ត្រឹមត្រូវ</span> និង
                <span className="text-gold">រហ័ស</span>
              </>
            ) : (
              <>
                Transcribe <span className="text-gold">audio</span> into
                <span className="text-gold"> text</span>
                <br />
                with speed and <span className="text-gold">accuracy</span>
              </>
            )}
          </h1>
          <p className="khmer-text mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            {isKhmer
              ? "សេវាបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរ — ប្រើបានភ្លាមៗ គាំទ្រឯកសារខ្លី និងសំឡេងវែងរហូតដល់ ១ ម៉ោង។"
              : "Fast Khmer speech-to-text service — ideal for short clips and recordings up to 1 hour long."}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="khmer-text inline-flex w-full items-center justify-center rounded-[6px] bg-navy px-8 py-3.5 text-base font-semibold text-white transition hover:bg-navy-dark sm:w-auto"
            >
              {isKhmer ? km.getStartedTranscribe : "Start transcription"}
            </Link>
            <a
              href="#features"
              className="khmer-text inline-flex w-full items-center justify-center rounded-[6px] border border-border-strong px-8 py-3.5 text-base font-semibold text-navy transition hover:bg-bg-accent sm:w-auto"
            >
              {isKhmer ? km.learnMore : "Learn more"}
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="bg-navy px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="khmer-text text-2xl font-bold text-white sm:text-3xl">
              {isKhmer ? "លក្ខណៈពិសេស" : "Features"}
            </h2>
            <p className="khmer-text mt-3 text-white/70">
              {isKhmer ? km.featuresSubtitle : "Everything you need for accurate Khmer transcription."}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[6px] border border-white/10 bg-white/5 p-5"
              >
                <h3 className="khmer-text text-lg font-semibold text-white">{f.title}</h3>
                <p className="khmer-text mt-3 text-sm leading-relaxed text-white/65">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-bg px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="khmer-text text-2xl font-bold text-navy sm:text-3xl">
              {isKhmer ? "របៀបដំណើរការ" : "How it works"}
            </h2>
            <p className="khmer-text mt-3 text-text-muted">
              {isKhmer ? km.stepsSubtitle : "Only 3 simple steps to get your transcript."}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.step}
                className="relative rounded-[6px] border border-border bg-bg-subtle p-5"
              >
                <span className="khmer-text text-3xl font-bold text-gold/80">{s.step}</span>
                <h3 className="khmer-text mt-3 text-lg font-semibold text-navy">{s.title}</h3>
                <p className="khmer-text mt-2 text-sm text-text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-cream px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="khmer-text text-2xl font-bold text-navy sm:text-3xl">{about.title}</h2>
          <p className="khmer-text mt-3 text-text-muted">{about.subtitle}</p>
          <div className="mt-8 space-y-5 text-left">
            {about.points.map((point) => (
              <p
                key={point}
                className="khmer-text text-base leading-relaxed text-text-muted sm:text-lg"
              >
                {point}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="bg-navy px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="khmer-text text-2xl font-bold text-white sm:text-3xl">{useCases.title}</h2>
            <p className="khmer-text mt-3 text-white/70">{useCases.subtitle}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {useCases.items.map((item) => (
              <div
                key={item.title}
                className="rounded-[6px] border border-white/10 bg-white/5 p-5"
              >
                <h3 className="khmer-text text-lg font-semibold text-white">{item.title}</h3>
                <p className="khmer-text mt-3 text-sm leading-relaxed text-white/65">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-bg px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="khmer-text text-2xl font-bold text-navy sm:text-3xl">{faqs.title}</h2>
            <p className="khmer-text mt-3 text-text-muted">{faqs.subtitle}</p>
          </div>

          <div className="mt-8 divide-y divide-border border-y border-border">
            {faqs.items.map((item) => (
              <div key={item.q} className="py-5">
                <h3 className="khmer-text text-base font-semibold text-navy sm:text-lg">{item.q}</h3>
                <p className="khmer-text mt-2 text-sm leading-relaxed text-text-muted sm:text-base">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[6px] bg-navy px-6 py-8 text-center sm:px-10">
          <h2 className="khmer-text text-2xl font-bold text-white sm:text-3xl">
            {isKhmer ? "ចាប់ផ្តើមបម្លែងសំឡេងរបស់អ្នកឥឡូវនេះ" : "Start transcribing now"}
          </h2>
          <p className="khmer-text mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
            {isKhmer
              ? km.ctaSubtitle
              : "Upload your audio file and get an accurate Khmer transcript in minutes."}
          </p>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="khmer-text mt-8 inline-flex items-center justify-center rounded-[6px] bg-gold px-8 py-3.5 text-base font-semibold text-white transition hover:bg-gold-hover"
          >
            {isKhmer ? km.getStartedNow : "Get started"}
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
