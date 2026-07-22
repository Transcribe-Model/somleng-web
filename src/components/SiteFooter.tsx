import Link from "next/link";
import { km } from "@/lib/km";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="khmer-text text-sm leading-relaxed text-white/75">
              {km.footerAbout}
            </p>
          </div>

          <div>
            <h3 className="khmer-text text-sm font-semibold text-white">{km.pages}</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>
                <Link href="/" className="transition hover:text-gold">
                  ទំព័រដើម
                </Link>
              </li>
              <li>
                <Link href="/transcribe" className="transition hover:text-gold">
                  បម្លែងសំឡេង
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="khmer-text text-sm font-semibold text-white">{km.info}</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>{km.languagesInfo}</li>
              <li>{km.durationInfo}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} សម្លេងខ្មែរ
        </div>
      </div>
    </footer>
  );
}
