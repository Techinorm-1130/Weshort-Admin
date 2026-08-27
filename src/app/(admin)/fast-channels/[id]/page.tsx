import FastEditor from "@/components/fast/FastEditor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FastEditor id={id} />;
}
