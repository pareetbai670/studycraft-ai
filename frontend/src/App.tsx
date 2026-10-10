import { useEffect, useState } from "react";
import {
  AlertTriangle,
  GraduationCap,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { GenerateConfig, GenerateResponse } from "@/lib/types";
import { fetchConfig, generateAsset, type AppConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { InputSection } from "@/components/InputSection";
import { AssetTypeSelector } from "@/components/AssetTypeSelector";
import { ConfigPanel } from "@/components/ConfigPanel";
import { AssetView } from "@/components/AssetView";
import { SAMPLE_TEXT } from "@/lib/sample";

const DEFAULT_CONFIG: GenerateConfig = {
  asset_type: "quiz",
  difficulty: "intermediate",
  question_style: "mixed",
  academic_level: "undergraduate",
  count: 8,
  force_mock: false,
};

export default function App() {
  const [content, setContent] = useState("");
  const [config, setConfig] = useState<GenerateConfig>(DEFAULT_CONFIG);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig()
      .then(setAppConfig)
      .catch(() =>
        setAppConfig({
          provider: "unknown",
          model: "unknown",
          min_items: 5,
          max_items: 20,
        }),
      );
  }, []);

  const minItems = appConfig?.min_items ?? 5;
  const maxItems = appConfig?.max_items ?? 20;
  const serverIsMock = appConfig?.provider === "mock";

  function patchConfig(patch: Partial<GenerateConfig>) {
    setConfig((c) => ({ ...c, ...patch }));
  }

  async function handleGenerate() {
    if (!content.trim()) {
      setError("Please add some study material first.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await generateAsset(content, config);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b bg-card/60 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary p-2 text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight">StudyCraft AI</h1>
              <p className="text-xs text-muted-foreground">
                Learning assets from your notes, powered by local LLMs
              </p>
            </div>
          </div>
          {appConfig && (
            <Badge
              variant={serverIsMock ? "warning" : "secondary"}
              className="gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {appConfig.provider} · {appConfig.model}
            </Badge>
          )}
        </div>
      </header>

      <main className="container grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <InputSection content={content} onChange={setContent} />

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              1. Choose an asset type
            </Label>
            <AssetTypeSelector
              value={config.asset_type}
              onChange={(asset_type) => patchConfig({ asset_type })}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          {result && (
            <div className="animate-fade-in">
              <AssetView result={result} />
            </div>
          )}
        </div>

        <aside className="no-print space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-2">
            <Label className="text-base font-semibold">2. Configure</Label>
            <ConfigPanel
              config={config}
              onChange={patchConfig}
              minItems={minItems}
              maxItems={maxItems}
            />
          </div>

          {!serverIsMock && (
            <label className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
              <input
                type="checkbox"
                checked={config.force_mock}
                onChange={(e) => patchConfig({ force_mock: e.target.checked })}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              Use offline mock generator
            </label>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" /> Generate
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => setContent(SAMPLE_TEXT)}
            className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Load sample study material
          </button>
        </aside>
      </main>

      <footer className="no-print border-t py-6 text-center text-xs text-muted-foreground">
        StudyCraft AI · MIT Licensed · Built for Hacktoberfest · Powered by
        open-weight models
      </footer>
    </div>
  );
}
