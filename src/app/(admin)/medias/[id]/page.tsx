import MediaEditor from "@/components/media/MediaEditor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaEditor id={id} />;
}
