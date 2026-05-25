import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PartnerForm from "@/components/finance/PartnerForm";
import type { CreatePartnerFormData } from "@/lib/schemas/partner.schema";
import {
  CREATE_PARTNER_MUTATION,
  GET_PARTNERS_QUERY,
} from "@/graphql/mutations/finance.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import type { CreatePartnerMutationResult } from "@/types/finance.types";

export default function PartnerCreatePage() {
  const navigate = useNavigate();

  const [createPartner, { loading: isLoading }] =
    useMutationWithToast<CreatePartnerMutationResult>(CREATE_PARTNER_MUTATION, {
      refetchQueries: [{ query: GET_PARTNERS_QUERY }],
      successMessage: (data) => `Partner "${data.createPartner.name}" created`,
      onCompleted: () => navigate("/finance/partners"),
    });

  const handleSubmit = (data: CreatePartnerFormData) => {
    void createPartner({ variables: { createPartnerInput: data } }).catch(() => {
      // error toast handled by hook; stay on the form
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/finance/partners")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Partner</h1>
          <p className="text-slate-600 mt-1">Add a new client or supplier</p>
        </div>
      </div>

      <PartnerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
