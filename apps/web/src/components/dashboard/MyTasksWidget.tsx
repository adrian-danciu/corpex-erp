import { useQuery } from "@apollo/client/react";
import { Link } from "react-router-dom";
import { ListTodo } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GET_MY_PROJECT_TASKS_QUERY } from "@/graphql/mutations/project.queries";
import type {
  MyProjectTasksQueryResult,
  ProjectTask,
} from "@/types/project.types";
import { formatDate } from "@/lib/formatters";

const PRIORITY_BADGE: Record<ProjectTask["priority"], string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

export function MyTasksWidget() {
  const { data, loading } = useQuery<MyProjectTasksQueryResult>(
    GET_MY_PROJECT_TASKS_QUERY,
  );

  const tasks = (data?.myProjectTasks ?? []).slice(0, 5);

  return (
    <Card className="w-full min-w-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tasks assigned to me</CardTitle>
        <ListTodo className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading && <Spinner className="size-5 text-primary" />}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-slate-500">No open tasks. 🎉</p>
        )}
        {!loading && tasks.length > 0 && (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/projects/${t.projectId}`}
                  className="flex items-center justify-between text-sm hover:bg-slate-50 rounded px-2 py-1"
                >
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-slate-900 truncate">
                      {t.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t.status}
                      {t.dueDate
                        ? ` · due ${formatDate(t.dueDate)}`
                        : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "ml-2 rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                      PRIORITY_BADGE[t.priority],
                    )}
                  >
                    {t.priority}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
