import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2, CreditCard } from "lucide-react";
import PartnerTypeBadge from "@/components/finance/PartnerTypeBadge";
import { PartnerType } from "@/types/finance.types";
import type { Partner } from "@/types/finance.types";

// Mock data — will be replaced with API call
const mockPartners: Record<string, Partner> = {
  "1": {
    id: "1", name: "SC Alpha Distribution SRL", cui: "RO12345678", regCom: "J40/1234/2018",
    address: "Str. Industriei 45", city: "Bucharest", country: "Romania",
    email: "office@alpha.ro", phone: "+40 21 123 4567", contactPerson: "Ion Popescu",
    partnerType: PartnerType.CLIENT, bankName: "BCR", bankAccount: "RO49RNCB0090099999999999",
    notes: "Preferred client for bulk orders. Payment terms: 30 days.", createdAt: "2026-01-10T10:00:00Z", updatedAt: "2026-01-10T10:00:00Z",
  },
  "2": {
    id: "2", name: "SC Beta Logistics SA", cui: "RO87654321", regCom: "J40/5678/2015",
    address: "Bd. Expozitiei 12", city: "Cluj-Napoca", country: "Romania",
    email: "contact@beta.ro", phone: "+40 264 567 890", contactPerson: "Maria Ionescu",
    partnerType: PartnerType.SUPPLIER, bankName: "BRD", bankAccount: "RO49BRDE0090099999999999",
    notes: null, createdAt: "2026-01-05T10:00:00Z", updatedAt: "2026-01-05T10:00:00Z",
  },
  "3": {
    id: "3", name: "SC Gamma Services SRL", cui: "RO11223344", regCom: "J12/3456/2020",
    address: "Str. Mihai Viteazul 8", city: "Timisoara", country: "Romania",
    email: "info@gamma.ro", phone: "+40 256 789 012", contactPerson: "Andrei Vasile",
    partnerType: PartnerType.BOTH, bankName: "ING", bankAccount: "RO49INGB0090099999999999",
    notes: null, createdAt: "2025-12-20T10:00:00Z", updatedAt: "2025-12-20T10:00:00Z",
  },
  "4": {
    id: "4", name: "SC Delta Manufacturing SRL", cui: "RO55667788", regCom: "J40/9876/2019",
    address: "Calea Vitan 200", city: "Bucharest", country: "Romania",
    email: "sales@delta.ro", phone: "+40 21 987 6543", contactPerson: "Elena Stanescu",
    partnerType: PartnerType.SUPPLIER, bankName: "Raiffeisen", bankAccount: "RO49RZBR0090099999999999",
    notes: null, createdAt: "2025-11-15T10:00:00Z", updatedAt: "2025-11-15T10:00:00Z",
  },
};

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // TODO: Replace with useQuery(GET_PARTNER_QUERY, { variables: { id } })
  const partner = id ? mockPartners[id] : null;

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
          <Button variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
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
            <p>Created: {new Date(partner.createdAt).toLocaleDateString("ro-RO")}</p>
            <p>Last Updated: {new Date(partner.updatedAt).toLocaleDateString("ro-RO")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
