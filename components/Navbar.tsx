import Link from "next/link";
import Image from "next/image";
import { LanguageToggle } from "./LanguageToggle";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function Navbar({ lang }: { lang: Lang }) {
  return (
    <header className="container-max pt-5">
      <div className="glass rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="Beam Of Technology"
              width={44}
              height={44}
              className="rounded-xl"
              priority
            />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wide">Beam Of</div>
              <div className="text-lg font-black text-blue-300">Technology</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link className="link text-sm font-bold" href="/">{t(lang, "nav_home")}</Link>
            <Link className="link text-sm font-bold" href="/about">{t(lang, "nav_about")}</Link>
            <Link className="link text-sm font-bold" href="/services">{t(lang, "nav_services")}</Link>
            <Link className="link text-sm font-bold" href="/contact">{t(lang, "nav_contact")}</Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/get-started"
              className="rounded-xl bg-blue-600/80 px-4 py-2 text-sm font-extrabold text-white shadow-glow hover:bg-blue-600"
            >
              {t(lang, "get_started")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
