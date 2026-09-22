import Link from "next/link";

import PageShell from "@/components/layout/PageShell";
import Panel from "@/components/ui/Panel";
import { buttonClass } from "@/components/ui/Button";
import { requireSession } from "@/lib/session";

export default async function EditControllerPage({
  params,
}: PageProps<"/controllers/[id]/edit">) {
  await requireSession();
  const { id } = await params;

  return (
    <PageShell
      eyebrow="Controller"
      title="Edit controller"
      description="Rename the controller or change the plant it is associated with."
      actions={
        <Link
          href={`/controllers/${id}`}
          className={buttonClass({ variant: "ghost", size: "sm" })}
        >
          ← Back to controller
        </Link>
      }
    >
      <Panel>
        <p>Placeholder: edit controller {id}.</p>
      </Panel>
    </PageShell>
  );
}
