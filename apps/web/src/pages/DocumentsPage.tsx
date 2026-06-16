import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { format } from "date-fns";
import { ExternalLink, FileText, Filter, Loader2, Trash2, Upload } from "lucide-react";
import { InlineError } from "@/components/common/InlineError";
import {
  GET_EMPLOYEE_DOCUMENTS_QUERY,
  CREATE_EMPLOYEE_DOCUMENT_MUTATION,
  DELETE_EMPLOYEE_DOCUMENT_MUTATION,
} from "@/graphql/mutations/employeeDocuments.mutations";
import { GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { toastError, toastSuccess } from "@/lib/toast";
import { getApiBaseUrl } from "@/lib/api-url";
import { formatBytes } from "@/lib/formatters";
import type {
  EmployeeDocument,
  EmployeeDocumentsQueryResult,
  EmployeeDocumentUploadPayload,
  EmployeesQueryResult,
} from "@/types/hr.types";
import { EmployeeDocumentType } from "@/types/hr.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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

const DOCUMENT_TYPE_LABELS: Record<EmployeeDocumentType, string> = {
  [EmployeeDocumentType.ID_CARD]: "ID card",
  [EmployeeDocumentType.CONTRACT]: "Contract",
  [EmployeeDocumentType.MEDICAL_CERTIFICATE]: "Medical certificate",
  [EmployeeDocumentType.DIPLOMA]: "Diploma",
  [EmployeeDocumentType.TRAINING]: "Training",
  [EmployeeDocumentType.OTHER]: "Other",
};

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
  const [documentToDelete, setDocumentToDelete] = useState<EmployeeDocument | null>(null);

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
  } = useQuery<EmployeeDocumentsQueryResult>(
    GET_EMPLOYEE_DOCUMENTS_QUERY,
    { variables: { filter: documentFilter } },
  );

  const { data: employeesData, loading: employeesLoading } = useQuery<EmployeesQueryResult>(GET_EMPLOYEES_QUERY, {
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

  const uploadFile = async (): Promise<EmployeeDocumentUploadPayload> => {
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

    return response.json() as Promise<EmployeeDocumentUploadPayload>;
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

  const confirmDelete = () => {
    if (!documentToDelete) return;
    void deleteDocument({ variables: { id: documentToDelete.id } });
    setDocumentToDelete(null);
  };

  const busy = uploading || creating;

  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="mt-2 text-slate-500">
          Employee file storage for contracts, identity documents, diplomas, and certificates.
        </p>
      </div>

      <div className="min-w-0 space-y-6">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex min-w-0 items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
            <CardDescription>
              Accepted formats: PDF, JPG, PNG, WEBP. Maximum size: 10 MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form className="min-w-0 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId} disabled={employeesLoading}>
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[calc(100vw-2rem)]">
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
                  <SelectTrigger className="w-full min-w-0">
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
                  className="text-sm"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                {file && (
                  <p className="break-all text-xs text-muted-foreground">
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

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="gap-4 px-4 sm:px-6 lg:flex lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex min-w-0 items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Registry
              </CardTitle>
              <CardDescription>Browse all employee documents stored in the system.</CardDescription>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                <SelectTrigger className="w-full min-w-0 sm:w-[260px]">
                  <SelectValue placeholder="Filter by employee" />
                </SelectTrigger>
                <SelectContent className="max-w-[calc(100vw-2rem)]">
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
          <CardContent className="px-4 sm:px-6">
            {documentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : documentsError ? (
              <InlineError>Failed to load documents.</InlineError>
            ) : documents.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No documents found.</p>
            ) : (
              <Table className="min-w-[760px]">
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
                            onClick={() => setDocumentToDelete(document)}
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
      <ConfirmationDialog
        open={Boolean(documentToDelete)}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        title="Delete document record?"
        description={`This removes ${documentToDelete?.title ?? "this document"} from the employee file list. The uploaded file will remain on disk.`}
        confirmLabel="Delete record"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
