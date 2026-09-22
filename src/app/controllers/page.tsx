import Link from "next/link";

import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";
import { requireSession } from "@/lib/session";

export default async function ControllersPage() {
  const { user } = await requireSession();

  return (
    <PageShell
      title="Controllers"
      description={`Signed in as ${user.email}. Opening this page refreshes every controller's reading.`}
      actions={
        <Link href="/controllers/new" className={buttonClass()}>
          + Add controller
        </Link>
      }
    >
      <EmptyState
        title="No controllers yet"
        body="Add a moisture meter controller to start tracking a plant. Placeholder: the controller grid renders here."
        action={
          <Link
            href="/controllers/new"
            className={buttonClass({ variant: "secondary" })}
          >
            Add your first controller
          </Link>
        }
      />
    </PageShell>
  );
}
