import { useApolloClient, useMutation } from "@apollo/client/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { InlineError } from "@/components/common/InlineError";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { LOGIN_MUTATION } from "@/graphql/mutations/auth.mutations";
import {
  MY_NOTIFICATIONS_QUERY,
  MY_UNREAD_COUNT_QUERY,
} from "@/graphql/mutations/notifications.mutations";
import { decodeJwtPayload } from "@/lib/auth-token";
import { useAuthStore } from "@/stores/auth.store";
import type { LoginMutationResult, User } from "@/types/auth.types";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const { login } = useAuthStore();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const [loginMutation, { loading }] = useMutation<LoginMutationResult>(
    LOGIN_MUTATION,
    {
      onCompleted: (data) => {
        const { accessToken, refreshToken, user } = data.login;
        const { department, position } = decodeJwtPayload(accessToken);
        const enrichedUser: User = {
          ...user,
          department: department ?? null,
          position: position ?? null,
        };

        login(accessToken, refreshToken, enrichedUser);
        // Prime the notification queries so the bell + counts are accurate from the first paint.
        void apolloClient.refetchQueries({
          include: [MY_NOTIFICATIONS_QUERY, MY_UNREAD_COUNT_QUERY],
        });
        navigate(enrichedUser.mustChangePassword ? "/change-password" : "/dashboard");
      },
      onError: (error) => {
        console.error("Login error:", error);
        setErrorMessage(error.message || "Invalid email or password");
      },
    },
  );

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);

    try {
      await loginMutation({
        variables: {
          loginInput: {
            email: values.email,
            password: values.password,
          },
        },
      });
    } catch (error) {
      console.error("Login submission error:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <InlineError className="mb-4 p-3 text-red-600" icon={false}>
            {errorMessage}
          </InlineError>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              className={errors.email ? "border-red-500" : ""}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className={errors.password ? "border-red-500" : ""}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-500">
          Need an account? Contact your IT department.
        </div>
      </CardContent>
    </Card>
  );
}
