export default async function EditControllerPage({
  params,
}: PageProps<"/controllers/[id]/edit">) {
  const { id } = await params;

  return <p>Placeholder: Edit controller {id}.</p>;
}
