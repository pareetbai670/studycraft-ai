import { CheckCircle2 } from "lucide-react";
import type { Summary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  summary: Summary;
}

export function SummaryRenderer({ summary }: Props) {
  return (
    <div id="print-area" className="space-y-6">
      <h2 className="text-2xl font-bold">{summary.title}</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-foreground/90">
            {summary.executive_summary}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Takeaways</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.key_takeaways.map((k, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm leading-relaxed">{k}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {summary.sections.map((section, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5">
              {section.points.map((p, j) => (
                <li key={j} className="text-sm leading-relaxed">
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
