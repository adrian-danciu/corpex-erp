import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Paperclip, Send, X } from "lucide-react";
import { InlineError } from "@/components/common/InlineError";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GET_PROJECT_FEED_QUERY } from "@/graphql/mutations/project.queries";
import {
  CREATE_PROJECT_FEED_POST_MUTATION,
  DELETE_PROJECT_FEED_ENTRY_MUTATION,
} from "@/graphql/mutations/project.mutations";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import {
  ProjectFeedKind,
  type Project,
  type ProjectFeedQueryResult,
} from "@/types/project.types";

interface Props {
  project: Project;
}

const FILTER_OPTIONS = [
  { value: undefined, label: "All" },
  { value: ProjectFeedKind.POST, label: "Posts" },
  { value: ProjectFeedKind.AUTO, label: "Activity" },
] as const;

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(
    /\/graphql\/?$/,
    "",
  ) ?? "http://localhost:3000";

export function FeedTab({ project }: Props) {
  const { user, accessToken } = useAuthStore();
  const [filter, setFilter] = useState<ProjectFeedKind | undefined>(undefined);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const { data, refetch } = useQuery<ProjectFeedQueryResult>(
    GET_PROJECT_FEED_QUERY,
    {
    variables: { projectId: project.id, kind: filter },
    fetchPolicy: "cache-and-network",
  });

  const [createPost, { loading: posting }] = useMutationWithToast(
    CREATE_PROJECT_FEED_POST_MUTATION,
    {
      successMessage: "Posted",
      onCompleted: () => {
        setContent("");
        setFile(null);
        void refetch();
      },
    },
  );

  const [deletePost] = useMutationWithToast(DELETE_PROJECT_FEED_ENTRY_MUTATION, {
    successMessage: "Post deleted",
    onCompleted: () => void refetch(),
  });

  const submitPost = async () => {
    setError("");
    if (!content.trim()) {
      setError("Post cannot be empty");
      return;
    }

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large (max 10MB)");
        return;
      }
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        const resp = await fetch(`${API_BASE}/uploads/project-feed`, {
          method: "POST",
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
          body: formData,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || "Upload failed");
        }
        const json = (await resp.json()) as {
          url: string;
          filename: string;
        };
        attachmentUrl = `${API_BASE}${json.url}`;
        attachmentName = json.filename;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        return;
      } finally {
        setUploading(false);
      }
    }

    createPost({
      variables: {
        input: {
          projectId: project.id,
          content: content.trim(),
          attachmentUrl,
          attachmentName,
        },
      },
    });
  };

  const entries = data?.projectFeed ?? [];

  return (
    <div className="space-y-4">
      {error && (
        <InlineError className="p-3 text-red-800" icon={false}>
          {error}
        </InlineError>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update..."
            rows={3}
          />
          <div className="flex items-center justify-between">
            <Label
              htmlFor="project-feed-attachment"
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-normal text-slate-600"
            >
              <Paperclip className="h-4 w-4" />
              <Input
                id="project-feed-attachment"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? file.name : "Attach (image / PDF, max 10MB)"}
            </Label>
            <div className="flex items-center gap-2">
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                  className="h-7 w-7 text-slate-400 hover:text-red-600"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={submitPost}
                disabled={posting || uploading}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {uploading ? "Uploading..." : posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity feed</CardTitle>
          <div className="flex gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.label}
                size="sm"
                variant={filter === opt.value ? "default" : "secondary"}
                onClick={() => setFilter(opt.value)}
                className="h-7 px-3 text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500">No entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => {
                const isAuto = entry.kind === ProjectFeedKind.AUTO;
                const isOwnPost =
                  entry.kind === ProjectFeedKind.POST &&
                  entry.authorId === user?.id;
                return (
                  <li
                    key={entry.id}
                    className={cn(
                      "rounded-lg border p-3",
                      isAuto
                        ? "bg-slate-50 border-slate-200"
                        : "bg-white border-slate-200",
                    )}
                  >
                    <div className="flex items-start justify-between text-xs text-slate-500 mb-1">
                      <span>
                        {isAuto
                          ? "System"
                          : entry.author
                            ? `${entry.author.firstName} ${entry.author.lastName}`
                            : "—"}
                        {" · "}
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                      {(isOwnPost || user?.role === "ADMIN") && !isAuto && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deletePost({
                              variables: {
                                input: { feedEntryId: entry.id },
                              },
                            })
                          }
                          className="h-6 w-6 text-slate-400 hover:text-red-600"
                          aria-label="Delete post"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-slate-900 whitespace-pre-wrap">
                      {entry.content}
                    </div>
                    {entry.attachmentUrl && (
                      <a
                        href={entry.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        {entry.attachmentName ?? "Attachment"}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
