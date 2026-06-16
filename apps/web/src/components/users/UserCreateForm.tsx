import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { InlineError } from "@/components/common/InlineError";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  createUserSchema,
  type CreateUserFormData,
  UserRole,
  type UserRoleType,
} from "@/lib/schemas";
import { generatePassword } from "@/lib/utils/password-generator";
import { CREATE_USER_MUTATION } from "@/graphql/mutations/user.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import type {
  CreateUserMutationResult,
  User as UserType,
} from "@/types/auth.types";
import { generateEmail } from "@/lib/utils/email-generator";

interface UserCreateFormProps {
  initialFirstName?: string;
  initialLastName?: string;
  initialRole?: UserRoleType;
  onUserCreated?: (user: UserType) => void;
}

export default function UserCreateForm({
  initialFirstName,
  initialLastName,
  initialRole,
  onUserCreated,
}: UserCreateFormProps) {
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [createUser, { loading: mutationLoading }] =
    useMutationWithToast<CreateUserMutationResult>(CREATE_USER_MUTATION);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: initialFirstName ?? "",
      lastName: initialLastName ?? "",
      role: initialRole,
    },
  });

  const firstName = useWatch({ control, name: "firstName" });
  const lastName = useWatch({ control, name: "lastName" });

  const generatedEmail =
    firstName && lastName ? generateEmail(firstName, lastName) : "";

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      const password = generatePassword();
      const createUserInput = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: generatedEmail,
        password: password,
        role: data.role,
      };

      const result = await createUser({
        variables: { createUserInput },
      });

      if (result.data?.createUser && onUserCreated) {
        onUserCreated(result.data.createUser);
      }

      setSuccessMessage(
        `User created successfully! Email: ${generatedEmail}\nPassword has been sent to the user's email.`
      );

      reset();

    } catch (error) {
      console.error("Error creating user:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create user. Please try again."
      );
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create New User</CardTitle>
        <CardDescription>
          Fill in the user details. Email and password will be auto-generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register("firstName")}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register("lastName")}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-slate-500">(auto-generated)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={generatedEmail}
              disabled
              className="bg-slate-50"
              placeholder="Enter first and last name to generate email"
            />
            <p className="text-xs text-slate-500">
              Email will be automatically generated based on the user's name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.USER}>User</SelectItem>
                    <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                    <SelectItem value={UserRole.FINANCE}>Finance</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
            <p className="text-xs text-slate-500">
              Role determines the user's access level in the system
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> A secure password will be automatically generated and sent to the user's email address.
              The user will be required to change it on first login.
            </p>
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800 whitespace-pre-line">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <InlineError className="p-4 text-red-800" icon={false}>
              {errorMessage}
            </InlineError>
          )}

          <Button type="submit" className="w-full" disabled={mutationLoading}>
            {mutationLoading ? "Creating User..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
