import type { FormEvent } from "react";
import { Loader2, Plus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PayrollGenerateCardProps {
  embedded?: boolean;
  generating: boolean;
  handleGenerate: (event: FormEvent<HTMLFormElement>) => void;
  month: number;
  notes: string;
  setMonth: (month: number) => void;
  setNotes: (notes: string) => void;
  setYear: (year: number) => void;
  year: number;
}

export function PayrollGenerateCard({
  embedded = false,
  generating,
  handleGenerate,
  month,
  notes,
  setMonth,
  setNotes,
  setYear,
  year,
}: PayrollGenerateCardProps) {
  const content = (
    <div className="min-w-0 space-y-4">
      <div>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Generate Payroll
        </CardTitle>
        <CardDescription className="mt-2">
          Creates a draft payroll for employees with salaries.
        </CardDescription>
      </div>
      <form className="space-y-4" onSubmit={handleGenerate}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payroll-month">Month</Label>
            <Input
              id="payroll-month"
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payroll-year">Year</Label>
            <Input
              id="payroll-year"
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payroll-notes">Notes</Label>
          <Textarea
            id="payroll-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Optional payroll context"
          />
        </div>
        <Button type="submit" className="w-full gap-2" disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <WalletCards className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Generate Draft"}
        </Button>
      </form>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <CardContent className="pt-6">{content}</CardContent>
    </Card>
  );
}
