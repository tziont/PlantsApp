import Link from "next/link";

import SignOutButton from "@/components/auth/SignOutButton";
import { buttonClass } from "@/components/ui/Button";

import styles from "./SiteHeader.module.scss";

/**
 * App bar. Rendered by the signed-in layout with the current user, and by the
 * public pages without one -- it never reads the session itself, so it stays a
 * presentational component (SPEC section 18).
 */
export default function SiteHeader({ email }: { email?: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href={email ? "/controllers" : "/"} className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            🌿
          </span>
          <span className={styles.brandName}>
            Plant Watering<span className={styles.brandSuffix}> Control</span>
          </span>
        </Link>

        <div className={styles.actions}>
          {email ? (
            <>
              <span className={styles.identity} title={email}>
                {email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth"
                className={buttonClass({ variant: "ghost", size: "sm" })}
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=signup"
                className={buttonClass({ size: "sm" })}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
