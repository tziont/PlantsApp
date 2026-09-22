import Link from "next/link";

import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import { buttonClass } from "@/components/ui/Button";
import { requireSession } from "@/lib/session";

export default async function ControllerDetailPage({
  params,
}: PageProps<"/controllers/[id]">) {
  await requireSession();
  const { id } = await params;

  return (
    <PageShell
      eyebrow="Controller"
      title="Controller details"
      description="Current reading, plant information and moisture history."
      actions={
        <>
          <Link
            href="/controllers"
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            ← Back
          </Link>
          <Link
            href={`/controllers/${id}/edit`}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            Edit
          </Link>
        </>
      }
    >
      <Panel>
        <p>Placeholder: controller details for {id}.</p>
      </Panel>
    </PageShell>
  );
}
