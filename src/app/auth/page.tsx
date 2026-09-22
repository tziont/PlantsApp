import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookie } from "better-auth/cookies";

import AuthForm from "@/components/auth/AuthForm";
import SiteHeader from "@/components/layout/SiteHeader";
import { getSession } from "@/lib/session";

import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Sign in - Plant Watering Control",
};

export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  // Signed-in users get bounced straight to the dashboard. The cookie is
  // checked first so an anonymous visitor costs no database round-trip -- the
  // cookie alone is not trusted, hence the real lookup behind it.
  if (getSessionCookie(await headers()) && (await getSession())) {
    redirect("/controllers");
  }

  // `?mode=signup` just preselects a tab; both forms live on this one route.
  const { mode } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main id="main" className={styles.main}>
        <AuthForm initialMode={mode === "signup" ? "signup" : "login"} />
      </main>
    </>
  );
}
