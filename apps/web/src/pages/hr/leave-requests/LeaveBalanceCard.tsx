import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MyEmployeeProfile } from "@/types/hr.types";

interface LeaveBalanceCardProps {
  employeeProfile: MyEmployeeProfile;
}

export function LeaveBalanceCard({ employeeProfile }: LeaveBalanceCardProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900">Leave Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-blue-700">Remaining Days</p>
            <p className="text-3xl font-bold text-blue-900">
              {employeeProfile.remainingLeave}
            </p>
          </div>
          <div className="text-blue-700">/</div>
          <div>
            <p className="text-sm text-blue-700">Annual Allowance</p>
            <p className="text-3xl font-bold text-blue-900">
              {employeeProfile.annualLeaveDays}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
