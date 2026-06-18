import { notFound, redirect } from "next/navigation";

export default async function ProjectChatRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: newFlag } = await searchParams;

  if (!id.trim()) {
    notFound();
  }

  const suffix = newFlag ? "&new=1" : "";
  redirect(`/chat?projectId=${encodeURIComponent(id.trim())}${suffix}`);
}