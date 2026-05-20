import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GET_PROJECT_COST_ROLLUP_QUERY,
  GET_PROJECT_QUERY,
} from "@/graphql/mutations/project.queries";
import { TRANSITION_PROJECT_STATUS_MUTATION } from "@/graphql/mutations/project.mutations";
import {
  ProjectStatus,
  type Project,
  type ProjectCostRollup,
} from "@/types/project.types";

const STATUS_OPTIONS_BY_CURRENT: Record<ProjectStatus, ProjectStatus[]> = {
  PLANNING: [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED],
  ACTIVE: [
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],
  ON_HOLD: [
    ProjectStatus.ACTIVE,
    ProjectStatus.COMPLETED,
    ProjectStatus.CANCELLED,
  ],
  COMPLETED: [],
  CANCELLED: [],
};

interface Props {
  project: Project;
  isProjectManager: boolean;
  onChange: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function OverviewTab({ project, isProjectManager, onChange }: Props) {
  const { data: rollupData } = useQuery<{
    projectCostRollup: ProjectCostRollup;
  }>(GET_PROJECT_COST_ROLLUP_QUERY, {
    variables: { projectId: project.id },
    fetchPolicy: "cache-and-network",
  });

  const [transitionStatus, { loading: transitioning }] = useMutationWithToast(
    TRANSITION_PROJECT_STATUS_MUTATION,
    {
      refetchQueries: [
        { query: GET_PROJECT_QUERY, variables: { projectId: project.id } },
      ],
      successMessage: "Project status updated",
      onCompleted: () => onChange(),
    },
  );

  const rollup = rollupData?.projectCostRollup;
  const allowedNext = STATUS_OPTIONS_BY_CURRENT[project.status];
  const utilizationPct =
    project.budget > 0 && rollup
      ? Math.min(
          100,
          Math.round((rollup.totalActual / project.budget) * 100),
        )
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Code</dt>
              <dd className="text-slate-900 font-mono">{project.code}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Client</dt>
              <dd className="text-slate-900">
                {project.partner?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Planned start</dt>
              <dd className="text-slate-900">
                {formatDate(project.plannedStartDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Planned end</dt>
              <dd className="text-slate-900">
                {formatDate(project.plannedEndDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Actual start</dt>
              <dd className="text-slate-900">
                {formatDate(project.actualStartDate)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Actual end</dt>
              <dd className="text-slate-900">
                {formatDate(project.actualEndDate)}
              </dd>
            </div>
            {project.description && (
              <div className="md:col-span-2">
                <dt className="text-slate-500">Description</dt>
                <dd className="text-slate-900 whitespace-pre-wrap">
                  {project.description}
                </dd>
              </div>
            )}
            {project.notes && (
              <div className="md:col-span-2">
                <dt className="text-slate-500">Notes</dt>
                <dd className="text-slate-900 whitespace-pre-wrap">
                  {project.notes}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-slate-600">Current</div>
          <div className="text-2xl font-semibold">{project.status}</div>
          {isProjectManager && allowedNext.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-sm text-slate-600">Move to</div>
              <Select
                onValueChange={(next) =>
                  transitionStatus({
                    variables: {
                      input: {
                        projectId: project.id,
                        status: next,
                      },
                    },
                  })
                }
              >
                <SelectTrigger disabled={transitioning}>
                  <SelectValue placeholder="Pick a new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedNext.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Budget vs actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Budget</div>
              <div className="text-xl font-semibold text-slate-900">
                {project.budget.toLocaleString()} {project.currency}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Materials</div>
              <div className="text-xl font-semibold text-slate-900">
                {(rollup?.materialsCost ?? 0).toLocaleString()}{" "}
                {project.currency}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Services</div>
              <div className="text-xl font-semibold text-slate-900">
                {(rollup?.servicesCost ?? 0).toLocaleString()}{" "}
                {project.currency}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Vehicles</div>
              <div className="text-xl font-semibold text-slate-900">
                {(rollup?.vehicleCost ?? 0).toLocaleString()} {project.currency}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Total actual</div>
              <div className="text-xl font-semibold text-slate-900">
                {(rollup?.totalActual ?? 0).toLocaleString()} {project.currency}
              </div>
            </div>
          </div>
          {project.budget > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{utilizationPct}% utilized</span>
                <span>
                  Remaining: {(rollup?.remaining ?? 0).toLocaleString()}{" "}
                  {project.currency}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={
                    utilizationPct < 80
                      ? "h-full bg-green-500"
                      : utilizationPct < 100
                        ? "h-full bg-yellow-500"
                        : "h-full bg-red-500"
                  }
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
