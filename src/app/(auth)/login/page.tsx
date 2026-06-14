import Link from "next/link";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { getDictionary, getLocale } from "@/i18n";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <main className="flex min-h-screen flex-col px-4 py-6">
      <div className="flex justify-end">
        <LanguageToggle current={locale} />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <Link href="/" className="text-2xl font-semibold text-primary">
              {t.common.appName}
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t.auth.loginTitle}</CardTitle>
              <CardDescription>{t.auth.loginDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-sm text-text-muted">
            {t.auth.newVendor}{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              {t.auth.startTrialLink}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
