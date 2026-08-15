"use client";

import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
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

export default function HomePage() {
  const { language } = useLanguage();
  const isKhmer = language === "km";
  const features = FEATURES[language];
  const steps = STEPS[language];

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-navy-hero px-4 py-10 sm:px-6 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 70% 20%, rgba(184,142,79,0.2), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="khmer-text mb-4 text-sm font-medium text-gold">
            {isKhmer ? km.heroTagline : "Khmer speech transcription"}
          </p>
          <h1 className="khmer-text text-3xl font-bold leading-snug text-white sm:text-4xl md:text-5xl">
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
          <p className="khmer-text mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-light sm:text-lg">
            {isKhmer
              ? "សេវាបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរ — ប្រើបានភ្លាមៗ គាំទ្រឯកសារខ្លី និងសំឡេងវែងរហូតដល់ ១ ម៉ោង។"
              : "Fast Khmer speech-to-text service — ideal for short clips and recordings up to 1 hour long."}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/transcribe"
              className="khmer-text inline-flex w-full items-center justify-center rounded-[6px] bg-cream px-8 py-3.5 text-base font-semibold text-navy transition hover:bg-bg-accent sm:w-auto"
            >
              {isKhmer ? km.getStartedTranscribe : "Start transcription"}
            </Link>
            <a
              href="#features"
              className="khmer-text inline-flex w-full items-center justify-center rounded-[6px] border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              {isKhmer ? km.learnMore : "Learn more"}
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="khmer-text text-2xl font-bold text-navy sm:text-3xl">
              {isKhmer ? "លក្ខណៈពិសេស" : "Features"}
            </h2>
            <p className="khmer-text mt-3 text-text-muted">
              {isKhmer ? km.featuresSubtitle : "Everything you need for accurate Khmer transcription."}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="gov-card p-5">
                <h3 className="khmer-text text-lg font-semibold text-navy">{f.title}</h3>
                <p className="khmer-text mt-3 text-sm leading-relaxed text-text-muted">
                  {f.desc}
                </p>
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

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[6px] bg-navy px-6 py-8 text-center sm:px-10">
          <h2 className="khmer-text text-2xl font-bold text-white sm:text-3xl">
            {isKhmer ? "ចាប់ផ្តើមបម្លែងសំឡេងរបស់អ្នកឥឡូវនេះ" : "Start transcribing now"}
          </h2>
          <p className="khmer-text mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
            {isKhmer ? km.ctaSubtitle : "Upload your audio file and get an accurate Khmer transcript in minutes."}
          </p>
          <Link
            href="/transcribe"
            className="khmer-text mt-8 inline-flex items-center justify-center rounded-[6px] bg-gold px-8 py-3.5 text-base font-semibold text-white transition hover:bg-gold-hover"
          >
            {isKhmer ? km.getStartedNow : "Get started"}
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
