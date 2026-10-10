import type { Asset } from "./types";

/** Trigger the browser print dialog, scoped to #print-area via print CSS. */
export function printArea(): void {
  window.print();
}

/** Convert any asset into a readable Markdown document and download it. */
export function exportMarkdown(asset: Asset): void {
  const md = assetToMarkdown(asset);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(asset.title)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "studycraft-asset"
  );
}

export function assetToMarkdown(asset: Asset): string {
  const lines: string[] = [`# ${asset.title}`, ""];

  switch (asset.type) {
    case "quiz":
      asset.questions.forEach((q, i) => {
        lines.push(`### ${i + 1}. ${q.question}`);
        if (q.options.length) q.options.forEach((o) => lines.push(`- ${o}`));
        lines.push("", `**Answer:** ${q.answer}`);
        if (q.explanation) lines.push(`**Explanation:** ${q.explanation}`);
        lines.push("");
      });
      break;
    case "worksheet":
      if (asset.instructions) lines.push(`> ${asset.instructions}`, "");
      asset.exercises.forEach((e, i) => {
        lines.push(`### ${i + 1}. ${e.prompt}`, `*(${e.type})*`);
        if (e.hint) lines.push(`_Hint: ${e.hint}_`);
        lines.push("", `**Answer:** ${e.answer}`, "");
      });
      break;
    case "flashcards":
      asset.cards.forEach((c, i) => {
        lines.push(
          `### Card ${i + 1}`,
          `**Front:** ${c.front}`,
          `**Back:** ${c.back}`,
        );
        if (c.hint) lines.push(`_Hint: ${c.hint}_`);
        lines.push("");
      });
      break;
    case "mindmap":
      lines.push(...mindmapLines(asset.root, 0));
      break;
    case "summary":
      lines.push(
        "## Executive Summary",
        asset.executive_summary,
        "",
        "## Key Takeaways",
      );
      asset.key_takeaways.forEach((k) => lines.push(`- ${k}`));
      lines.push("");
      asset.sections.forEach((s) => {
        lines.push(`## ${s.heading}`);
        s.points.forEach((p) => lines.push(`- ${p}`));
        lines.push("");
      });
      break;
  }
  return lines.join("\n");
}

function mindmapLines(
  node: { title: string; children: any[] },
  depth: number,
): string[] {
  const out: string[] = [`${"  ".repeat(depth)}- ${node.title}`];
  node.children?.forEach((c) => out.push(...mindmapLines(c, depth + 1)));
  return out;
}
