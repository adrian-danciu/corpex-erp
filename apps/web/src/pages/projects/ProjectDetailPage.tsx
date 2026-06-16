import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const PROJECT_TABS = [
  { value: "overview", label: "Overview" },
  { value: "team", label: "Team" },
  { value: "materials", label: "Materials" },
  { value: "services", label: "Services" },
  { value: "vehicles", label: "Vehicles" },
  { value: "tasks", label: "Tasks" },
  { value: "feed", label: "Feed" },
  { value: "invoices", label: "Invoices" },
] as const;

type ProjectTabValue = (typeof PROJECT_TABS)[number]["value"];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ProjectTabValue>("overview");

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

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ProjectTabValue)}
        className="space-y-4"
      >
        <div className="md:hidden">
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ProjectTabValue)}
          >
            <SelectTrigger aria-label="Project section" className="w-full">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TABS.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsList className="hidden md:grid md:grid-cols-8">
          {PROJECT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
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
