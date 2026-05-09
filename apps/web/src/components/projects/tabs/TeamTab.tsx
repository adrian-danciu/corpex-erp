import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Plus, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GET_PROJECT_MEMBERS_QUERY,
  GET_PROJECT_QUERY,
} from "@/graphql/mutations/project.queries";
import {
  ADD_PROJECT_MEMBER_MUTATION,
  REMOVE_PROJECT_MEMBER_MUTATION,
  UPDATE_PROJECT_MEMBER_ROLE_MUTATION,
} from "@/graphql/mutations/project.mutations";
import { GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import {
  ProjectMemberRole,
  type Project,
  type ProjectMember,
} from "@/types/project.types";
import type { Employee } from "@/types/hr.types";
import type { PaginatedResult } from "@/types/pagination.types";

interface Props {
  project: Project;
  isProjectManager: boolean;
  onChange: () => void;
}

export function TeamTab({ project, isProjectManager, onChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string>("");
  const [pendingRole, setPendingRole] = useState<ProjectMemberRole>(
    ProjectMemberRole.MEMBER,
  );
  const [errorMessage, setErrorMessage] = useState("");

  const { data: membersData, refetch } = useQuery<{
    projectMembers: ProjectMember[];
  }>(GET_PROJECT_MEMBERS_QUERY, {
    variables: { projectId: project.id },
    fetchPolicy: "cache-and-network",
  });

  const { data: employeesData } = useQuery<{
    employees: PaginatedResult<Employee>;
  }>(GET_EMPLOYEES_QUERY, {
    variables: { pagination: { skip: 0, take: 200 } },
  });

  const [addMember, { loading: adding }] = useMutation(
    ADD_PROJECT_MEMBER_MUTATION,
    {
      refetchQueries: [
        { query: GET_PROJECT_MEMBERS_QUERY, variables: { projectId: project.id } },
        { query: GET_PROJECT_QUERY, variables: { projectId: project.id } },
      ],
      onCompleted: () => {
        setAddOpen(false);
        setPendingUserId("");
        setPendingRole(ProjectMemberRole.MEMBER);
        onChange();
      },
      onError: (e) => setErrorMessage(e.message),
    },
  );

  const [removeMember] = useMutation(REMOVE_PROJECT_MEMBER_MUTATION, {
    refetchQueries: [
      { query: GET_PROJECT_MEMBERS_QUERY, variables: { projectId: project.id } },
      { query: GET_PROJECT_QUERY, variables: { projectId: project.id } },
    ],
    onError: (e) => setErrorMessage(e.message),
  });

  const [updateRole] = useMutation(UPDATE_PROJECT_MEMBER_ROLE_MUTATION, {
    refetchQueries: [
      { query: GET_PROJECT_MEMBERS_QUERY, variables: { projectId: project.id } },
    ],
    onError: (e) => setErrorMessage(e.message),
  });

  const members = membersData?.projectMembers.filter((m) => !m.leftAt) ?? [];
  const memberUserIds = new Set(members.map((m) => m.userId));
  const candidates =
    employeesData?.employees.items
      .filter((e): e is Employee & { user: NonNullable<Employee["user"]> } =>
        Boolean(e.user),
      )
      .filter((e) => !memberUserIds.has(e.user.id)) ?? [];

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          {errorMessage}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Team members</CardTitle>
          {isProjectManager && (
            <Button
              size="sm"
              onClick={() => {
                setErrorMessage("");
                setAddOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">No members yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-slate-900">
                      {m.user
                        ? `${m.user.firstName} ${m.user.lastName}`
                        : m.userId}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {m.user?.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {isProjectManager ? (
                        <Select
                          value={m.role}
                          onValueChange={(role) =>
                            updateRole({
                              variables: {
                                input: {
                                  projectId: project.id,
                                  memberId: m.id,
                                  role,
                                },
                              },
                            }).then(() => refetch())
                          }
                        >
                          <SelectTrigger className="w-44 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value={ProjectMemberRole.PROJECT_MANAGER}
                            >
                              Project manager
                            </SelectItem>
                            <SelectItem value={ProjectMemberRole.MEMBER}>
                              Member
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-slate-700">{m.role}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {isProjectManager && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeMember({
                              variables: {
                                input: {
                                  projectId: project.id,
                                  memberId: m.id,
                                },
                              },
                            })
                          }
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User</Label>
              <Select value={pendingUserId} onValueChange={setPendingUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick an employee with an account" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      No eligible employees
                    </div>
                  ) : (
                    candidates.map((e) => (
                      <SelectItem key={e.user.id} value={e.user.id}>
                        {e.firstName} {e.lastName} — {e.user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={pendingRole}
                onValueChange={(v) =>
                  setPendingRole(v as ProjectMemberRole)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectMemberRole.MEMBER}>
                    Member
                  </SelectItem>
                  <SelectItem value={ProjectMemberRole.PROJECT_MANAGER}>
                    Project manager
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!pendingUserId || adding}
                onClick={() =>
                  addMember({
                    variables: {
                      input: {
                        projectId: project.id,
                        userId: pendingUserId,
                        role: pendingRole,
                      },
                    },
                  })
                }
              >
                {adding ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
