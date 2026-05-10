import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import { gql } from "@apollo/client";
import type { Employee } from "@/types/hr.types";
import type { PaginatedResult } from "@/types/pagination.types";
import type { User } from "@/types/auth.types";
import UserCreateForm from "@/components/users/UserCreateForm";
import { PageLoading } from "@/components/ui/page-loading";

const LINK_EMPLOYEE_USER_MUTATION = gql`
  mutation LinkEmployeeUser($linkEmployeeUserInput: LinkEmployeeUserInput!) {
    linkEmployeeToUser(linkEmployeeUserInput: $linkEmployeeUserInput) {
      id
      userId
      user {
        id
        firstName
        lastName
        email
        role
      }
    }
  }
`;

export default function UsersAdminPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data, loading, error, refetch } = useQuery<{
    employees: PaginatedResult<Employee>;
  }>(GET_EMPLOYEES_QUERY, {
    variables: { pagination: { skip: 0, take: 100 } },
    fetchPolicy: "cache-and-network",
  });

  const [linkEmployeeUser] = useMutationWithToast(LINK_EMPLOYEE_USER_MUTATION, {
    successMessage: "Account linked",
  });

  const employees = data?.employees.items ?? [];
  const withoutAccount = employees.filter((e) => !e.userId);
  const withAccount = employees.filter((e) => e.userId);

  const handleUserCreated = async (user: User) => {
    if (!selectedEmployee) return;

    try {
      await linkEmployeeUser({
        variables: {
          linkEmployeeUserInput: {
            employeeId: selectedEmployee.id,
            userId: user.id,
          },
        },
      });
      setSelectedEmployee(null);
      void refetch();
    } catch {
      // toast already shown
    }
  };

  if (loading) {
    return <PageLoading message="Loading users..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading users: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Accounts (IT)</h1>
          <p className="text-slate-600 mt-1">
            Manage application accounts for employees and contractors.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees without accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {withoutAccount.length === 0 ? (
            <p className="text-sm text-slate-500">All employees have accounts.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Name</th>
                    <th className="py-2">Department</th>
                    <th className="py-2">Position</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withoutAccount.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="py-2">
                        {[
                          emp.firstName,
                          emp.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                          (emp.user &&
                            [emp.user.firstName, emp.user.lastName]
                              .filter(Boolean)
                              .join(" ")) ||
                          "Unknown"}
                      </td>
                      <td className="py-2">{emp.department}</td>
                      <td className="py-2">{emp.position}</td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          Generate account
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees with accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {withAccount.length === 0 ? (
            <p className="text-sm text-slate-500">No employees with accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {withAccount.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="py-2">
                        {[
                          emp.firstName,
                          emp.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                          (emp.user &&
                            [emp.user.firstName, emp.user.lastName]
                              .filter(Boolean)
                              .join(" ")) ||
                          "Unknown"}
                      </td>
                      <td className="py-2">{emp.user?.email}</td>
                      <td className="py-2">{emp.user?.role}</td>
                      <td className="py-2">{emp.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEmployee && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              Generate account for {selectedEmployee.firstName} {selectedEmployee.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserCreateForm
              initialFirstName={selectedEmployee.firstName}
              initialLastName={selectedEmployee.lastName}
              onUserCreated={handleUserCreated}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

