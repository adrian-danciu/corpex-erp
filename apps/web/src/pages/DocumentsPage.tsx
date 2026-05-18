import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { format } from "date-fns";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import {
  GET_EMPLOYEE_DOCUMENTS_QUERY,
  CREATE_EMPLOYEE_DOCUMENT_MUTATION,
  DELETE_EMPLOYEE_DOCUMENT_MUTATION,
} from "@/graphql/mutations/employeeDocuments.mutations";
import { GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { toastError, toastSuccess } from "@/lib/toast";
import { getApiBaseUrl } from "@/lib/api-url";
import type { Employee, EmployeeDocument } from "@/types/hr.types";
import { EmployeeDocumentType } from "@/types/hr.types";
import type { PaginatedResult } from "@/types/pagination.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface UploadedFilePayload {
  url: string;
  filename: string;
  size: number;
  mime: string;
}

const DOCUMENT_TYPE_LABELS: Record<EmployeeDocumentType, string> = {
  [EmployeeDocumentType.ID_CARD]: "ID card",
  [EmployeeDocumentType.CONTRACT]: "Contract",
  [EmployeeDocumentType.MEDICAL_CERTIFICATE]: "Medical certificate",
  [EmployeeDocumentType.DIPLOMA]: "Diploma",
  [EmployeeDocumentType.TRAINING]: "Training",
  [EmployeeDocumentType.OTHER]: "Other",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const apiBaseUrl = getApiBaseUrl();
  const [employeeId, setEmployeeId] = useState("");
  const [filterEmployeeId, setFilterEmployeeId] = useState("ALL");
  const [type, setType] = useState<EmployeeDocumentType>(EmployeeDocumentType.CONTRACT);
  const [title, setTitle] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const documentFilter = useMemo(
    () => ({
      ...(filterEmployeeId !== "ALL" ? { employeeId: filterEmployeeId } : {}),
    }),
    [filterEmployeeId],
  );

  const {
    data: documentsData,
    loading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery<{ employeeDocuments: EmployeeDocument[] }>(
    GET_EMPLOYEE_DOCUMENTS_QUERY,
    { variables: { filter: documentFilter } },
  );

  const { data: employeesData, loading: employeesLoading } = useQuery<{
    employees: PaginatedResult<Employee>;
  }>(GET_EMPLOYEES_QUERY, {
    variables: { pagination: { skip: 0, take: 1000 } },
  });

  const [createDocument, { loading: creating }] = useMutationWithToast(
    CREATE_EMPLOYEE_DOCUMENT_MUTATION,
    {
      successMessage: "Document saved",
      onCompleted: () => {
        setEmployeeId("");
        setType(EmployeeDocumentType.CONTRACT);
        setTitle("");
        setExpiryDate("");
        setNotes("");
        setFile(null);
        void refetchDocuments();
      },
    },
  );

  const [deleteDocument, { loading: deleting }] = useMutationWithToast(
    DELETE_EMPLOYEE_DOCUMENT_MUTATION,
    {
      successMessage: "Document deleted",
      onCompleted: () => void refetchDocuments(),
    },
  );

  const employees = employeesData?.employees.items ?? [];
  const documents = documentsData?.employeeDocuments ?? [];

  const uploadFile = async (): Promise<UploadedFilePayload> => {
    if (!file) throw new Error("Choose a file first");

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${apiBaseUrl}/uploads/employee-documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Upload failed");
    }

    return response.json() as Promise<UploadedFilePayload>;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeId) {
      toastError("Select an employee");
      return;
    }
    if (!title.trim()) {
      toastError("Enter a document title");
      return;
    }
    if (!file) {
      toastError("Choose a file to upload");
      return;
    }

    try {
      setUploading(true);
      const uploaded = await uploadFile();
      await createDocument({
        variables: {
          input: {
            employeeId,
            type,
            title: title.trim(),
            fileName: uploaded.filename,
            fileUrl: uploaded.url,
            mimeType: uploaded.mime,
            size: uploaded.size,
            expiryDate: expiryDate || undefined,
            notes: notes.trim() || undefined,
          },
        },
      });
      toastSuccess("File uploaded");
    } catch (err) {
      toastError((err as Error).message || "Could not upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this document record? The uploaded file will remain on disk.")) {
      return;
    }
    void deleteDocument({ variables: { id } });
  };

  const busy = uploading || creating;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-slate-500">
          Employee file storage for contracts, identity documents, diplomas, and certificates.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>Accepted formats: PDF, JPG, PNG, WEBP. Maximum size: 10 MB.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId} disabled={employeesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} · {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={type} onValueChange={(value) => setType(value as EmployeeDocumentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(EmployeeDocumentType).map((item) => (
                      <SelectItem key={item} value={item}>
                        {DOCUMENT_TYPE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-title">Title</Label>
                <Input
                  id="document-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Signed employment contract"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-file">File</Label>
                <Input
                  id="document-file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {file.name} · {formatBytes(file.size)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-expiry">Expiry Date</Label>
                <Input
                  id="document-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(event) => setExpiryDate(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. HR receives reminders 30 days before this date.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-notes">Notes</Label>
                <Textarea
                  id="document-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional context for HR"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {busy ? "Saving..." : "Upload and Save"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Registry
              </CardTitle>
              <CardDescription>Browse all employee documents stored in the system.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Filter by employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : documentsError ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load documents.</span>
              </div>
            ) : documents.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No documents found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="max-w-[260px]">
                          <p className="truncate font-medium">{document.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {document.fileName} · {formatBytes(document.size)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {document.employee
                          ? `${document.employee.firstName} ${document.employee.lastName}`
                          : "Unknown"}
                      </TableCell>
                      <TableCell>{DOCUMENT_TYPE_LABELS[document.type]}</TableCell>
                      <TableCell>
                        {document.expiryDate
                          ? format(new Date(document.expiryDate), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>{format(new Date(document.createdAt), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(document.id)}
                            disabled={deleting}
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
