import { redirect } from "next/navigation";

// The project page moved to /dashboard/projects/<id>. Kept so links already
// sent or bookmarked as /dashboard/project-details?id=<id> still land on it.
export default async function ProjectDetailsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await searchParams;
  const projectId = Array.isArray(id) ? id[0] : id;
  redirect(
    projectId
      ? `/dashboard/projects/${encodeURIComponent(projectId)}`
      : "/dashboard/projects",
  );
}
