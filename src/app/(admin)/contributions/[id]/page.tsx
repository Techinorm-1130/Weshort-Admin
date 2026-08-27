import ContributionEditor from "@/components/contribution/ContributionEditor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContributionEditor id={id} />;
}
