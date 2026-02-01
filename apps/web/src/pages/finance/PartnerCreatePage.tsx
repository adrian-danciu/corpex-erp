import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PartnerForm from "@/components/finance/PartnerForm";
import type { CreatePartnerFormData } from "@/lib/schemas/partner.schema";

export default function PartnerCreatePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = (data: CreatePartnerFormData) => {
    setIsLoading(true);
    // TODO: Replace with actual GraphQL mutation
    console.log("Creating partner:", data);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`Partner "${data.name}" created successfully!`);
      setTimeout(() => navigate("/finance/partners"), 1500);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/finance/partners")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Partner</h1>
          <p className="text-slate-600 mt-1">Add a new client or supplier</p>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
          {successMessage}
        </div>
      )}

      <PartnerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
