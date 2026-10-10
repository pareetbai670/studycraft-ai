import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import type { MindMap, MindMapNode } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
});

interface Props {
  map: MindMap;
}

export function MindMapRenderer({ map }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{map.title}</h2>
      <Tabs defaultValue="diagram">
        <TabsList>
          <TabsTrigger value="diagram">Diagram</TabsTrigger>
          <TabsTrigger value="outline">Outline</TabsTrigger>
        </TabsList>
        <TabsContent value="diagram">
          <Card>
            <CardContent className="overflow-auto p-6">
              <MermaidDiagram map={map} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="outline">
          <Card>
            <CardContent className="p-6">
              <TreeOutline node={map.root} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MermaidDiagram({ map }: { map: MindMap }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const definition = buildMermaid(map);
    const id = `mindmap-${Math.random().toString(36).slice(2)}`;
    mermaid
      .render(id, definition)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [map]);

  if (error) {
    return (
      <div className="text-sm text-muted-foreground">
        Could not render diagram — showing outline instead.
        <TreeOutline node={map.root} />
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className="flex min-h-[200px] justify-center [&_svg]:max-w-full"
    />
  );
}

function buildMermaid(map: MindMap): string {
  const lines: string[] = ["mindmap", `  root((${sanitize(map.root.title)}))`];
  const walk = (node: MindMapNode, depth: number) => {
    node.children?.forEach((child) => {
      lines.push(`${"  ".repeat(depth)}${sanitize(child.title)}`);
      walk(child, depth + 1);
    });
  };
  walk(map.root, 2);
  return lines.join("\n");
}

function sanitize(text: string): string {
  return (
    text
      .replace(/[()[\]{}]/g, "")
      .replace(/[\n\r]/g, " ")
      .trim() || "node"
  );
}

function TreeOutline({
  node,
  depth = 0,
}: {
  node: MindMapNode;
  depth?: number;
}) {
  return (
    <ul
      className={
        depth === 0 ? "space-y-1" : "ml-5 mt-1 space-y-1 border-l pl-4"
      }
    >
      <li>
        <span
          className={
            depth === 0
              ? "font-bold text-primary"
              : depth === 1
                ? "font-semibold"
                : "text-sm text-foreground"
          }
        >
          {node.title}
        </span>
        {node.children?.map((child, i) => (
          <TreeOutline key={i} node={child} depth={depth + 1} />
        ))}
      </li>
    </ul>
  );
}
