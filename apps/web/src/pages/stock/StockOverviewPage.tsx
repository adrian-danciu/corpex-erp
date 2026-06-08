import { useQuery } from "@apollo/client/react";
import { AlertCircle, Boxes, PackageSearch, Warehouse } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GET_LOW_STOCK_PRODUCTS_QUERY,
  GET_STOCK_OVERVIEW_QUERY,
} from "@/graphql/mutations/stock.mutations";
import type {
  LowStockProductsQueryResult,
  StockOverviewQueryResult,
} from "@/types/stock.types";
import { InTransitWidget } from "@/components/stock/InTransitWidget";

export default function StockOverviewPage() {
  const { data: overviewData, loading: overviewLoading, error: overviewError } =
    useQuery<StockOverviewQueryResult>(GET_STOCK_OVERVIEW_QUERY);

  const { data: lowStockData, loading: lowStockLoading, error: lowStockError } =
    useQuery<LowStockProductsQueryResult>(GET_LOW_STOCK_PRODUCTS_QUERY);

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

      <div className="grid gap-4 lg:grid-cols-2">
        <InTransitWidget />
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-500">No products below minimum stock.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="font-medium text-red-600">{product.currentStock}</TableCell>
                      <TableCell>{product.minimumStock}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
