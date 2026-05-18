import { useQuery } from "@apollo/client/react";
import { ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";
import { GET_EMPLOYEE_DOCUMENTS_QUERY } from "@/graphql/mutations/employeeDocuments.mutations";
import type { EmployeeDocument } from "@/types/hr.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getApiBaseUrl } from "@/lib/api-url";

interface Props {
  employeeId: string;
}

function formatDocumentType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function EmployeeDocumentsPanel({ employeeId }: Props) {
  const { data, loading } = useQuery<{ employeeDocuments: EmployeeDocument[] }>(
    GET_EMPLOYEE_DOCUMENTS_QUERY,
    {
      variables: { filter: { employeeId } },
    },
  );

  const documents = data?.employeeDocuments ?? [];
  const apiBaseUrl = getApiBaseUrl();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner className="size-5 text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employee documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 5).map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{document.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDocumentType(document.type)}
                    {document.expiryDate
                      ? ` · Expires ${format(new Date(document.expiryDate), "dd MMM yyyy")}`
                      : ` · Uploaded ${format(new Date(document.createdAt), "dd MMM yyyy")}`}
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <a
                    href={`${apiBaseUrl}${document.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open document"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
