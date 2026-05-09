import { useQuery } from "@apollo/client/react";
import { Link } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GET_PROJECTS_QUERY } from "@/graphql/mutations/project.queries";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import type { Project } from "@/types/project.types";

export function MyProjectsWidget() {
  const { data, loading } = useQuery<{ projects: Project[] }>(
    GET_PROJECTS_QUERY,
    { variables: { filter: { onlyMine: true } } },
  );

  const mine = (data?.projects ?? []).slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">My projects</CardTitle>
        <FolderKanban className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading && <Spinner className="size-5 text-primary" />}
        {!loading && mine.length === 0 && (
          <p className="text-sm text-slate-500">
            You're not on any active projects.
          </p>
        )}
        {!loading && mine.length > 0 && (
          <ul className="space-y-2">
            {mine.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/projects/${p.id}`}
                  className="flex items-center justify-between text-sm hover:bg-slate-50 rounded px-2 py-1"
                >
                  <span className="flex flex-col">
                    <span className="font-medium text-slate-900">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      {p.code}
                    </span>
                  </span>
                  <ProjectStatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
