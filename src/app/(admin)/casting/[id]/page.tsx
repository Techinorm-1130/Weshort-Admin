import PersonEditor from "@/components/casting/PersonEditor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonEditor id={id} />;
}
