import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PartnerForm from "@/components/finance/PartnerForm";
import type { CreatePartnerFormData } from "@/lib/schemas/partner.schema";
import { CREATE_PARTNER_MUTATION, GET_PARTNERS_QUERY } from "@/graphql/mutations/finance.mutations";

export default function PartnerCreatePage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [createPartner, { loading: isLoading }] = useMutation(CREATE_PARTNER_MUTATION, {
    refetchQueries: [{ query: GET_PARTNERS_QUERY }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCompleted: (data: any) => {
      setSuccessMessage(`Partner "${data.createPartner.name}" created successfully!`);
      setErrorMessage("");
      setTimeout(() => navigate("/finance/partners"), 1500);
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const handleSubmit = (data: CreatePartnerFormData) => {
    setErrorMessage("");
    createPartner({
      variables: { createPartnerInput: data },
    });
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

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800 border border-red-200">
          {errorMessage}
        </div>
      )}

      <PartnerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
