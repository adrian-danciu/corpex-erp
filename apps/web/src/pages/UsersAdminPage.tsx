import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserCreateForm from "@/components/users/UserCreateForm";
import { GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import type { User } from "@/types/auth.types";
import type { Employee, EmployeesQueryResult } from "@/types/hr.types";

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

function getEmployeeDisplayName(employee: Employee) {
  return (
    [employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
    (employee.user &&
      [employee.user.firstName, employee.user.lastName].filter(Boolean).join(" ")) ||
    "Unknown"
  );
}

export default function UsersAdminPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data, loading, error, refetch } = useQuery<EmployeesQueryResult>(
    GET_EMPLOYEES_QUERY,
    {
      variables: { pagination: { skip: 0, take: 100 } },
      fetchPolicy: "cache-and-network",
    },
  );

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withoutAccount.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{getEmployeeDisplayName(employee)}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        Generate account
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withAccount.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{getEmployeeDisplayName(employee)}</TableCell>
                    <TableCell>{employee.user?.email}</TableCell>
                    <TableCell>{employee.user?.role}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
