export default async function ControllerDetailPage({
  params,
}: PageProps<"/controllers/[id]">) {
  const { id } = await params;

  return <p>Placeholder: Controller details for {id}.</p>;
}
