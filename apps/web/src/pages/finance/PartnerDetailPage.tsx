import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2, CreditCard, AlertCircle } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import PartnerTypeBadge from "@/components/finance/PartnerTypeBadge";
import type { PartnerQueryResult } from "@/types/finance.types";
import { GET_PARTNER_QUERY, GET_PARTNERS_QUERY, DELETE_PARTNER_MUTATION } from "@/graphql/mutations/finance.mutations";
import { formatDate } from "@/lib/formatters";

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, loading, error } = useQuery<PartnerQueryResult>(GET_PARTNER_QUERY, {
    variables: { id },
    skip: !id,
  });

  const [deletePartner, { loading: deleting }] = useMutationWithToast(
    DELETE_PARTNER_MUTATION,
    {
      refetchQueries: [{ query: GET_PARTNERS_QUERY }],
      successMessage: "Partner deleted",
      onCompleted: () => navigate("/finance/partners"),
    },
  );

  const confirmDelete = () => {
    void deletePartner({ variables: { id } }).catch(() => {});
    setDeleteDialogOpen(false);
  };

  if (loading) {
    return <PageLoading message="Loading partner..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load partner</p>
      </div>
    );
  }

  const partner = data?.partner;

  if (!partner) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/finance/partners")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Partners
        </Button>
        <div className="text-center py-12 text-slate-500">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Partner not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/finance/partners")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{partner.name}</h1>
              <PartnerTypeBadge type={partner.partnerType} />
            </div>
            <p className="text-slate-600 mt-1">CUI: {partner.cui}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" className="gap-2" onClick={() => setDeleteDialogOpen(true)} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Company Name</p>
              <p className="font-medium">{partner.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">CUI / CIF</p>
                <p className="font-mono">{partner.cui}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Reg. Com.</p>
                <p className="font-mono">{partner.regCom || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Partner Type</p>
              <div className="mt-1">
                <PartnerTypeBadge type={partner.partnerType} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {partner.contactPerson && (
              <div>
                <p className="text-sm text-slate-500">Contact Person</p>
                <p className="font-medium">{partner.contactPerson}</p>
              </div>
            )}
            {partner.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${partner.email}`} className="text-blue-600 hover:underline">
                  {partner.email}
                </a>
              </div>
            )}
            {partner.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${partner.phone}`} className="text-blue-600 hover:underline">
                  {partner.phone}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p>{partner.address}</p>
                <p className="text-slate-600">{partner.city}, {partner.country}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Bank Name</p>
              <p className="font-medium">{partner.bankName || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">IBAN</p>
              <p className="font-mono text-sm">{partner.bankAccount || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{partner.notes || "No notes added."}</p>
          </CardContent>
        </Card>
      </div>

      {/* Meta Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-6 text-sm text-slate-500">
            <p>Created: {formatDate(partner.createdAt)}</p>
            <p>Last Updated: {formatDate(partner.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete partner?"
        description={`This permanently deletes ${partner.name}. This action cannot be undone.`}
        confirmLabel="Delete partner"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
