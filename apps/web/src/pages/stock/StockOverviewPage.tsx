import { useQuery } from "@apollo/client/react";
import { AlertCircle, Boxes, PackageSearch, Warehouse } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GET_LOW_STOCK_PRODUCTS_QUERY,
  GET_STOCK_OVERVIEW_QUERY,
} from "@/graphql/mutations/stock.mutations";
import type { Product, StockOverview } from "@/types/stock.types";

export default function StockOverviewPage() {
  const { data: overviewData, loading: overviewLoading, error: overviewError } = useQuery<{
    stockOverview: StockOverview;
  }>(GET_STOCK_OVERVIEW_QUERY);

  const { data: lowStockData, loading: lowStockLoading, error: lowStockError } = useQuery<{
    lowStockProducts: Product[];
  }>(GET_LOW_STOCK_PRODUCTS_QUERY);

  if (overviewLoading || lowStockLoading) {
    return <PageLoading message="Loading stock overview..." />;
  }

  if (overviewError || lowStockError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load stock data</p>
      </div>
    );
  }

  const overview = overviewData?.stockOverview;
  const lowStock = lowStockData?.lowStockProducts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Stock & Warehouse</h1>
        <p className="text-slate-600 mt-1">
          Inventory KPIs and low stock monitoring.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview?.totalProducts ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview?.totalWarehouses ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview?.lowStockProducts ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview?.totalStockUnits ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-500">No products below minimum stock.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">SKU</th>
                    <th className="py-2">Product</th>
                    <th className="py-2">Current</th>
                    <th className="py-2">Minimum</th>
                    <th className="py-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{product.sku}</td>
                      <td className="py-2">{product.name}</td>
                      <td className="py-2 text-red-600 font-medium">{product.currentStock}</td>
                      <td className="py-2">{product.minimumStock}</td>
                      <td className="py-2">{product.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
