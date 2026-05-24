import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { GET_PROJECT_SERVICES_QUERY } from "@/graphql/mutations/project.queries";
import {
  CREATE_PROJECT_SERVICE_MUTATION,
  DELETE_PROJECT_SERVICE_MUTATION,
  UPDATE_PROJECT_SERVICE_MUTATION,
} from "@/graphql/mutations/project.mutations";
import { useCurrency } from "@/hooks/useCurrency";
import {
  ProjectServiceStatus,
  type Project,
  type ProjectService,
} from "@/types/project.types";
import { ServiceDialog } from "./services/ServiceDialog";
import { ServicesTable } from "./services/ServicesTable";

interface Props {
  project: Project;
  isProjectManager: boolean;
}

export function ServicesTab({ project, isProjectManager }: Props) {
  const { formatMoney } = useCurrency();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("service");
  const [unitPrice, setUnitPrice] = useState("");
  const [vatRate, setVatRate] = useState("19");
  const [status, setStatus] = useState<ProjectServiceStatus>(
    ProjectServiceStatus.DELIVERED,
  );
  const [billable, setBillable] = useState("true");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const variables = { projectId: project.id };
  const { data, refetch } = useQuery<{ projectServices: ProjectService[] }>(
    GET_PROJECT_SERVICES_QUERY,
    { variables, fetchPolicy: "cache-and-network" },
  );

  const reset = () => {
    setOpen(false);
    setDescription("");
    setQuantity("1");
    setUnit("service");
    setUnitPrice("");
    setVatRate("19");
    setStatus(ProjectServiceStatus.DELIVERED);
    setBillable("true");
    setNotes("");
    setError("");
  };

  const [createService, { loading: creating }] = useMutationWithToast(
    CREATE_PROJECT_SERVICE_MUTATION,
    {
      successMessage: "Service added",
      onCompleted: () => {
        reset();
        void refetch();
      },
    },
  );

  const [updateService] = useMutationWithToast(
    UPDATE_PROJECT_SERVICE_MUTATION,
    {
      successMessage: "Service updated",
      onCompleted: () => void refetch(),
    },
  );

  const [deleteService] = useMutationWithToast(
    DELETE_PROJECT_SERVICE_MUTATION,
    {
      successMessage: "Service removed",
      onCompleted: () => void refetch(),
    },
  );

  const services = data?.projectServices ?? [];
  const quantityNumber = Number(quantity) || 0;
  const unitPriceNumber = Number(unitPrice) || 0;
  const vatRateNumber = Number(vatRate) || 0;

  const submit = () => {
    setError("");
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (quantityNumber <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (unitPriceNumber < 0) {
      setError("Unit price cannot be negative");
      return;
    }
    createService({
      variables: {
        input: {
          projectId: project.id,
          description: description.trim(),
          quantity: quantityNumber,
          unit,
          unitPrice: unitPriceNumber,
          vatRate: vatRateNumber,
          status,
          billable: billable === "true",
          notes: notes || undefined,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      <ServicesTable
        formatMoney={formatMoney}
        isProjectManager={isProjectManager}
        onAdd={() => {
          setError("");
          setOpen(true);
        }}
        onDelete={(serviceId) =>
          deleteService({
            variables: { input: { projectId: project.id, serviceId } },
          })
        }
        onUpdate={(serviceId, patch) =>
          updateService({
            variables: { input: { projectId: project.id, serviceId, ...patch } },
          })
        }
        project={project}
        services={services}
      />
      <ServiceDialog
        billable={billable}
        creating={creating}
        description={description}
        error={error}
        notes={notes}
        onClose={reset}
        onOpen={() => setOpen(true)}
        onSubmit={submit}
        open={open}
        quantity={quantity}
        setBillable={setBillable}
        setDescription={setDescription}
        setNotes={setNotes}
        setQuantity={setQuantity}
        setStatus={setStatus}
        setUnit={setUnit}
        setUnitPrice={setUnitPrice}
        setVatRate={setVatRate}
        status={status}
        unit={unit}
        unitPrice={unitPrice}
        vatRate={vatRate}
      />
    </div>
  );
}
