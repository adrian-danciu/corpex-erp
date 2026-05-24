import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/ui/page-loading";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { GET_PROJECTS_QUERY } from "@/graphql/mutations/project.queries";
import type { Project } from "@/types/project.types";
import { ProjectStatus } from "@/types/project.types";
import { useAuthStore } from "@/stores/auth.store";
import { canAccess } from "@/lib/permissions";
import { useUrlFilters } from "@/hooks/useUrlFilters";

const ALL_STATUSES = "ALL" as const;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCreate = canAccess(user, "projects", "write");

  const { getFilter, setFilter } = useUrlFilters();
  const search = getFilter("search");
  const rawStatus = getFilter("status", ALL_STATUSES);
  const status = Object.values(ProjectStatus).includes(rawStatus as ProjectStatus)
    ? (rawStatus as ProjectStatus)
    : ALL_STATUSES;
  const onlyMine = getFilter("onlyMine") === "true";

  const { data, loading, error } = useQuery<{ projects: Project[] }>(
    GET_PROJECTS_QUERY,
    {
      variables: {
        filter: {
          status: status === ALL_STATUSES ? undefined : status,
          onlyMine: onlyMine || undefined,
          search: search.trim() || undefined,
        },
      },
      fetchPolicy: "cache-and-network",
    },
  );

  if (loading && !data) return <PageLoading message="Loading projects..." />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  const projects = data?.projects ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">
            Client jobs with materials, vehicles, team and tasks
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/projects/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New project
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            All projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) =>
                setFilter("search", e.target.value, { replace: true })
              }
            />
            <Select
              value={status}
              onValueChange={(v) =>
                setFilter("status", v === ALL_STATUSES ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                {Object.values(ProjectStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Checkbox
                checked={onlyMine}
                onCheckedChange={(checked) =>
                  setFilter("onlyMine", checked === true ? "true" : null)
                }
              />
              My projects only
            </label>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm mt-1">
                {canCreate
                  ? "Get started by creating your first project"
                  : "Check back when projects are created"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-mono text-slate-900">
                      {project.code}
                    </TableCell>
                    <TableCell className="text-slate-900">
                      {project.name}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {project.partner?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="text-right text-slate-700">
                      {project.budget.toLocaleString()} {project.currency}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
