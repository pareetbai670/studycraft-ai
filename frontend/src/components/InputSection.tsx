import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { extractFile } from "@/lib/api";

interface Props {
  content: string;
  onChange: (value: string) => void;
}

export function InputSection({ content, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);
    setUploading(true);
    try {
      const result = await extractFile(file);
      onChange(result.content);
      setFileName(
        `${result.filename} (${result.characters.toLocaleString()} chars)`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Study Material
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your notes, textbook excerpts, or Markdown here…"
          className="min-h-[220px] resize-y font-mono text-[13px] leading-relaxed"
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-primary bg-accent" : "border-input"
          }`}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag &amp; drop a file, or{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Supports .txt, .md, and .pdf (max 10 MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md,.markdown,.pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="flex min-h-[24px] items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {uploading && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Extracting text…
              </span>
            )}
            {fileName && !uploading && (
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {fileName}
                <button
                  onClick={() => {
                    setFileName(null);
                    onChange("");
                  }}
                  className="ml-1 rounded-full hover:text-destructive"
                  aria-label="Clear file"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {error && <span className="text-destructive">{error}</span>}
          </div>
          <span className="text-muted-foreground">
            {content.length.toLocaleString()} chars
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
