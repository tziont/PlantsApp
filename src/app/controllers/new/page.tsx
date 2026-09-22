import Link from "next/link";

import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import { buttonClass } from "@/components/ui/Button";
import { requireSession } from "@/lib/session";

export default async function NewControllerPage() {
  await requireSession();

  return (
    <PageShell
      eyebrow="Controllers"
      title="Add a controller"
      description="Give the controller a name and, optionally, the plant it is monitoring."
      actions={
        <Link
          href="/controllers"
          className={buttonClass({ variant: "ghost", size: "sm" })}
        >
          ← Back to controllers
        </Link>
      }
    >
      <Panel>
        <p>Placeholder: create controller form.</p>
      </Panel>
    </PageShell>
  );
}
