import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  DELETE_EMPLOYEE_MUTATION,
  GET_EMPLOYEES_QUERY,
  GET_EMPLOYEE_QUERY,
  UPDATE_EMPLOYEE_MUTATION,
} from "@/graphql/mutations/employee.mutations";
import type {
  Employee,
  EmployeeQueryResult,
  EmployeesQueryResult,
  UpdateEmployeeInput,
} from "@/types/hr.types";

function toEmployeeFormValues(
  employee: Employee | null | undefined,
  fallbackId: string,
): UpdateEmployeeInput {
  if (!employee) return { id: fallbackId };

  return {
    id: employee.id,
    phoneNumber: employee.phoneNumber,
    address: employee.address,
    city: employee.city,
    position: employee.position,
    department: employee.department,
    contractType: employee.contractType,
    isContractor: employee.isContractor,
    salary: employee.salary,
    annualLeaveDays: employee.annualLeaveDays,
    remainingLeave: employee.remainingLeave,
    managerId: employee.managerId ?? undefined,
  };
}

export function useEmployeeDetailController() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<EmployeeQueryResult>(
    GET_EMPLOYEE_QUERY,
    {
      variables: { id },
      skip: !id,
    },
  );

  const { data: employeesData } = useQuery<EmployeesQueryResult>(
    GET_EMPLOYEES_QUERY,
    {
      variables: { pagination: { skip: 0, take: 500 } },
    },
  );

  const employee = data?.employee;

  const form = useForm<UpdateEmployeeInput>({
    values: toEmployeeFormValues(employee, id ?? ""),
  });

  const [updateEmployee, { loading: updating }] = useMutationWithToast(
    UPDATE_EMPLOYEE_MUTATION,
    {
      successMessage: "Employee updated",
      onCompleted: () => {
        setEditing(false);
        void refetch();
      },
    },
  );

  const [deleteEmployee, { loading: deleting }] = useMutationWithToast(
    DELETE_EMPLOYEE_MUTATION,
    {
      successMessage: "Employee deleted",
      onCompleted: () => navigate("/hr/employees"),
    },
  );

  const allEmployees = (employeesData?.employees.items ?? []).filter(
    (candidate) => candidate.id !== employee?.id,
  );

  const onSubmit = async (values: UpdateEmployeeInput) => {
    try {
      await updateEmployee({
        variables: {
          updateEmployeeInput: {
            ...values,
            salary: values.salary,
            managerId: values.managerId || undefined,
          },
        },
      });
    } catch {
      // toast already shown
    }
  };

  const confirmDelete = () => {
    void deleteEmployee({ variables: { id } });
    setDeleteDialogOpen(false);
  };

  const cancelEditing = () => {
    setEditing(false);
    form.reset();
  };

  const backToEmployees = () => navigate("/hr/employees");

  return {
    allEmployees,
    backToEmployees,
    cancelEditing,
    confirmDelete,
    deleteDialogOpen,
    deleting,
    editing,
    employee,
    error,
    form,
    loading,
    navigate,
    onSubmit,
    setDeleteDialogOpen,
    setEditing,
    updating,
  };
}

export type EmployeeDetailController = ReturnType<
  typeof useEmployeeDetailController
>;
