import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, Phone, Mail, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PartnerTypeBadge from "@/components/finance/PartnerTypeBadge";
import { PartnerType } from "@/types/finance.types";
import type { Partner } from "@/types/finance.types";
import { GET_PARTNERS_QUERY } from "@/graphql/mutations/finance.mutations";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { PaginatedResult } from "@/types/pagination.types";

export default function PartnersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const { page, pageSize, skip, take, setPage } = usePagination();

  const { data, loading, error } = useQuery<{ partners: PaginatedResult<Partner> }>(
    GET_PARTNERS_QUERY,
    {
      variables: {
        pagination: { skip, take },
      },
      fetchPolicy: "cache-and-network",
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load partners</p>
      </div>
    );
  }

  const partners = data?.partners.items || [];
  const totalItems = data?.partners.meta.total || 0;

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.cui.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "ALL" || partner.partnerType === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Partners</h1>
          <p className="text-slate-600 mt-1">Manage clients and suppliers</p>
        </div>
        <Button onClick={() => navigate("/finance/partners/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.filter((p) => p.partnerType === PartnerType.CLIENT || p.partnerType === PartnerType.BOTH).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners.filter((p) => p.partnerType === PartnerType.SUPPLIER || p.partnerType === PartnerType.BOTH).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, CUI, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {["ALL", "CLIENT", "SUPPLIER", "BOTH"].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type === "ALL" ? "All" : type === "BOTH" ? "Both" : type.charAt(0) + type.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredPartners.length} Partner{filteredPartners.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPartners.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No partners found</p>
              <p className="text-sm mt-1">
                {searchQuery || filterType !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first partner"}
              </p>
              {!searchQuery && filterType === "ALL" && (
                <Button onClick={() => navigate("/finance/partners/new")} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Partner
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-slate-600">
                    <th className="pb-3">Company</th>
                    <th className="pb-3">CUI</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">City</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      className="border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/finance/partners/${partner.id}`)}
                    >
                      <td className="py-4">
                        <p className="font-medium text-slate-900">{partner.name}</p>
                        {partner.contactPerson && (
                          <p className="text-xs text-slate-500">{partner.contactPerson}</p>
                        )}
                      </td>
                      <td className="py-4 text-slate-700 font-mono text-xs">{partner.cui}</td>
                      <td className="py-4">
                        <PartnerTypeBadge type={partner.partnerType} />
                      </td>
                      <td className="py-4 text-slate-700">{partner.city}</td>
                      <td className="py-4">
                        <div className="space-y-1">
                          {partner.phone && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{partner.phone}</span>
                            </div>
                          )}
                          {partner.email && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs">{partner.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/finance/partners/${partner.id}`);
                          }}
                        >
                          View
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

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
