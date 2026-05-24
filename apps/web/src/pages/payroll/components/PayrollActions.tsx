import { CheckCircle2, FileSpreadsheet, FileText, Trash2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayrollStatus } from "@/types/payroll.types";
import type { PayrollPeriod } from "@/types/payroll.types";

interface PayrollActionsProps {
  activePeriod: PayrollPeriod;
  approving: boolean;
  deletingPeriod: boolean;
  exporting: string | null;
  lineCount: number;
  markPaid: (options: { variables: { periodId: string } }) => void;
  paying: boolean;
  runExport: (formatType: "pdf" | "xlsx") => Promise<void>;
  setDeleteDraftDialogOpen: (open: boolean) => void;
  approvePayroll: (options: { variables: { periodId: string } }) => void;
}

export function PayrollActions({
  activePeriod,
  approving,
  deletingPeriod,
  exporting,
  lineCount,
  markPaid,
  paying,
  runExport,
  setDeleteDraftDialogOpen,
  approvePayroll,
}: PayrollActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={lineCount === 0 || exporting === "payroll-pdf"}
        onClick={() => void runExport("pdf")}
      >
        <FileText className="mr-2 h-4 w-4" />
        {exporting === "payroll-pdf" ? "Generating..." : "PDF"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={lineCount === 0 || exporting === "payroll-xlsx"}
        onClick={() => void runExport("xlsx")}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
      {activePeriod.status === PayrollStatus.DRAFT && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 hover:text-red-700"
            disabled={deletingPeriod}
            onClick={() => setDeleteDraftDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            {deletingPeriod ? "Deleting..." : "Delete Draft"}
          </Button>
          <Button
            size="sm"
            className="gap-2"
            disabled={approving}
            onClick={() =>
              void approvePayroll({ variables: { periodId: activePeriod.id } })
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
        </>
      )}
      {activePeriod.status === PayrollStatus.APPROVED && (
        <Button
          size="sm"
          className="gap-2"
          disabled={paying}
          onClick={() =>
            void markPaid({ variables: { periodId: activePeriod.id } })
          }
        >
          <WalletCards className="h-4 w-4" />
          Mark Paid
        </Button>
      )}
    </div>
  );
}
