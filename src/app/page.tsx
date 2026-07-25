import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { km } from "@/lib/km";

const FEATURES = [
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
];

const STEPS = [
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
];

export default function HomePage() {
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
            {km.heroTagline}
          </p>
          <h1 className="khmer-text text-3xl font-bold leading-snug text-white sm:text-4xl md:text-5xl">
            បម្លែង<span className="text-gold">សំឡេង</span>ទៅជា
            <span className="text-gold">អក្សរ</span>
            <br />
            យ៉ាង<span className="text-gold">ត្រឹមត្រូវ</span> និង
            <span className="text-gold">រហ័ស</span>
          </h1>
          <p className="khmer-text mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-light sm:text-lg">
            សេវាបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរ — ប្រើបានភ្លាមៗ
            គាំទ្រឯកសារខ្លី និងសំឡេងវែងរហូតដល់ ១ ម៉ោង។
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/transcribe"
              className="khmer-text inline-flex w-full items-center justify-center rounded-[6px] bg-cream px-8 py-3.5 text-base font-semibold text-navy transition hover:bg-bg-accent sm:w-auto"
            >
              {km.getStartedTranscribe}
            </Link>
            <a
              href="#features"
              className="khmer-text inline-flex w-full items-center justify-center rounded-[6px] border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              {km.learnMore}
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="khmer-text text-2xl font-bold text-navy sm:text-3xl">
              លក្ខណៈពិសេស
            </h2>
            <p className="khmer-text mt-3 text-text-muted">{km.featuresSubtitle}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="gov-card p-5">
                <h3 className="khmer-text text-lg font-semibold text-navy">
                  {f.title}
                </h3>
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
              របៀបដំណើរការ
            </h2>
            <p className="khmer-text mt-3 text-text-muted">{km.stepsSubtitle}</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="relative rounded-[6px] border border-border bg-bg-subtle p-5"
              >
                <span className="khmer-text text-3xl font-bold text-gold/80">
                  {s.step}
                </span>
                <h3 className="khmer-text mt-3 text-lg font-semibold text-navy">
                  {s.title}
                </h3>
                <p className="khmer-text mt-2 text-sm text-text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[6px] bg-navy px-6 py-8 text-center sm:px-10">
          <h2 className="khmer-text text-2xl font-bold text-white sm:text-3xl">
            ចាប់ផ្តើមបម្លែងសំឡេងរបស់អ្នកឥឡូវនេះ
          </h2>
          <p className="khmer-text mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
            {km.ctaSubtitle}
          </p>
          <Link
            href="/transcribe"
            className="khmer-text mt-8 inline-flex items-center justify-center rounded-[6px] bg-gold px-8 py-3.5 text-base font-semibold text-white transition hover:bg-gold-hover"
          >
            {km.getStartedNow}
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
