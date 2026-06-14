import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { getDictionary, getLocale } from "@/i18n";

export default async function HomePage() {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main className="min-h-screen">
      <header className="container flex items-center justify-between py-6">
        <span className="text-xl font-semibold text-primary">{t.common.appName}</span>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle current={locale} />
          <Button asChild variant="ghost">
            <Link href="/login">{t.common.login}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{t.common.startTrial}</Link>
          </Button>
        </div>
      </header>

      <section className="container py-16 text-center md:py-24">
        <p className="mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary-dark">
          {t.landing.badge}
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          {t.landing.headline}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-text-muted">
          {t.landing.subhead}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/signup">{t.landing.ctaPrimary}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/login">{t.landing.ctaSecondary}</Link>
          </Button>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-3">
        {t.landing.features.map((f) => (
          <Card key={f.title}>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
