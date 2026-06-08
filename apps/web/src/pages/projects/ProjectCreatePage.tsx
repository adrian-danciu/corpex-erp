import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createProjectSchema,
  type CreateProjectFormData,
} from "@/lib/schemas/project.schema";
import { CREATE_PROJECT_MUTATION } from "@/graphql/mutations/project.mutations";
import { GET_PROJECTS_QUERY } from "@/graphql/mutations/project.queries";
import { GET_PARTNERS_QUERY } from "@/graphql/mutations/finance.mutations";
import type { PartnersQueryResult } from "@/types/finance.types";
import type { CreateProjectMutationResult } from "@/types/project.types";
import { useCurrency } from "@/hooks/useCurrency";

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const { currency: defaultCurrency } = useCurrency();

  const { data: partnersData, loading: partnersLoading } =
    useQuery<PartnersQueryResult>(GET_PARTNERS_QUERY, {
    variables: { pagination: { skip: 0, take: 200 } },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      currency: defaultCurrency,
    },
  });

  const partnerId = useWatch({ control, name: "partnerId" });

  const [createProject, { loading: isCreating }] =
    useMutationWithToast<CreateProjectMutationResult>(CREATE_PROJECT_MUTATION, {
      refetchQueries: [{ query: GET_PROJECTS_QUERY }],
      successMessage: (data) => `Project "${data.createProject.name}" created`,
      onCompleted: (data) => {
        if (data?.createProject?.id) {
          navigate(`/projects/${data.createProject.id}`);
        }
      },
    });

  const onSubmit = async (formData: CreateProjectFormData) => {
    try {
      await createProject({
        variables: {
          input: {
            code: formData.code,
            name: formData.name,
            description: formData.description || undefined,
            partnerId: formData.partnerId,
            budget: formData.budget,
            currency: "EUR",
            plannedStartDate: formData.plannedStartDate
              ? new Date(formData.plannedStartDate)
              : undefined,
            plannedEndDate: formData.plannedEndDate
              ? new Date(formData.plannedEndDate)
              : undefined,
            notes: formData.notes || undefined,
          },
        },
      });
    } catch {
      // toast already shown
    }
  };

  const partners = partnersData?.partners.items ?? [];

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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New project</h1>
          <p className="text-slate-600 mt-1">
            Create a client-delivery project
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Project code *</Label>
                <Input
                  id="code"
                  placeholder="PRJ-001"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="partnerId">Client *</Label>
              <Select
                value={partnerId ?? ""}
                onValueChange={(value) => setValue("partnerId", value)}
                disabled={partnersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.cui})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.partnerId && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.partnerId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  {...register("budget", { valueAsNumber: true })}
                />
                {errors.budget && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.budget.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value="EUR" disabled />
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plannedStartDate">Planned start</Label>
                <Input
                  id="plannedStartDate"
                  type="date"
                  {...register("plannedStartDate")}
                />
              </div>
              <div>
                <Label htmlFor="plannedEndDate">Planned end</Label>
                <Input
                  id="plannedEndDate"
                  type="date"
                  {...register("plannedEndDate")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/projects")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
