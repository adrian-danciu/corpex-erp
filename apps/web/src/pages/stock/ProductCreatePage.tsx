import { useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CREATE_PRODUCT_MUTATION } from "@/graphql/mutations/stock.mutations";
import type { Product } from "@/types/stock.types";
import { UNITS, DEFAULT_UNIT } from "@/lib/units";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  minimumStock: number;
  unitPrice: number;
}

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [createProduct, { loading }] = useMutation<{ createProduct: Product }>(
    CREATE_PRODUCT_MUTATION
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      category: "",
      unit: DEFAULT_UNIT,
      minimumStock: 0,
      unitPrice: 0,
    },
  });

  const onSubmit = async (values: ProductFormData) => {
    await createProduct({
      variables: {
        createProductInput: {
          sku: values.sku,
          name: values.name,
          description: values.description || undefined,
          category: values.category || undefined,
          unit: values.unit || "pcs",
          minimumStock: Number(values.minimumStock) || 0,
          unitPrice: Number(values.unitPrice) || 0,
        },
      },
    });

    navigate("/stock/products");
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate("/stock/products")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Button>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  {...register("sku", { required: "SKU is required" })}
                  className={errors.sku ? "border-red-500" : ""}
                />
                {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...register("category")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={watch("unit") || DEFAULT_UNIT}
                  onValueChange={(v) =>
                    setValue("unit", v, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Minimum Stock</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  step="0.01"
                  {...register("minimumStock", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit price ({currency})</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  {...register("unitPrice", { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-500">
                  Reference cost per unit. Used for stock value and project cost rollups.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
