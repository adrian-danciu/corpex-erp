import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { GET_PROJECT_QUERY } from "@/graphql/mutations/project.queries";
import type { ProjectQueryResult } from "@/types/project.types";
import { ProjectMemberRole } from "@/types/project.types";
import { useAuthStore } from "@/stores/auth.store";
import { OverviewTab } from "@/components/projects/tabs/OverviewTab";
import { TeamTab } from "@/components/projects/tabs/TeamTab";
import { MaterialsTab } from "@/components/projects/tabs/MaterialsTab";
import { ServicesTab } from "@/components/projects/tabs/ServicesTab";
import { VehiclesTab } from "@/components/projects/tabs/VehiclesTab";
import { TasksTab } from "@/components/projects/tabs/TasksTab";
import { FeedTab } from "@/components/projects/tabs/FeedTab";
import { InvoicesTab } from "@/components/projects/tabs/InvoicesTab";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data, loading, error, refetch } = useQuery<ProjectQueryResult>(
    GET_PROJECT_QUERY,
    {
      variables: { projectId: id },
      fetchPolicy: "cache-and-network",
      skip: !id,
    },
  );

  const project = data?.project;

  const isProjectManager = useMemo(() => {
    if (!user || !project) return false;
    if (user.role === "ADMIN") return true;
    if (user.department === "MANAGEMENT") return true;
    return (
      project.members?.some(
        (m) =>
          m.userId === user.id &&
          m.role === ProjectMemberRole.PROJECT_MANAGER &&
          !m.leftAt,
      ) ?? false
    );
  }, [user, project]);

  if (loading && !project) return <PageLoading message="Loading project..." />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-slate-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-slate-600 mt-1 font-mono text-sm">
            {project.code} · {project.partner?.name ?? "—"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            project={project}
            isProjectManager={isProjectManager}
            onChange={() => refetch()}
          />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab
            project={project}
            isProjectManager={isProjectManager}
            onChange={() => refetch()}
          />
        </TabsContent>
        <TabsContent value="materials">
          <MaterialsTab
            project={project}
            isProjectManager={isProjectManager}
          />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab
            project={project}
            isProjectManager={isProjectManager}
          />
        </TabsContent>
        <TabsContent value="vehicles">
          <VehiclesTab
            project={project}
            isProjectManager={isProjectManager}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab project={project} isProjectManager={isProjectManager} />
        </TabsContent>
        <TabsContent value="feed">
          <FeedTab project={project} />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
