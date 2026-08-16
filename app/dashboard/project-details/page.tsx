import { Suspense } from "react";
import ProjectDetailsClient from "./client";
import { Loader2 } from "lucide-react";

export default function ProjectDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <ProjectDetailsClient />
    </Suspense>
  );
}
