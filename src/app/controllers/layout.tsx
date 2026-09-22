import SiteHeader from "@/components/layout/SiteHeader";
import { getSession } from "@/lib/session";

/**
 * Chrome only. The authorization boundary stays in each page's
 * `requireSession()` -- a layout does not re-run on navigation, so it must
 * never be the thing that decides whether a route renders.
 */
export default async function ControllersLayout({
  children,
}: LayoutProps<"/controllers">) {
  const session = await getSession();

  return (
    <>
      <SiteHeader email={session?.user.email} />
      {children}
    </>
  );
}
