"""Offline Mock Generator Mode.

Produces valid, schema-conformant JSON for every asset type without any model
weights or network calls. It lightly adapts to the submitted material by pulling
candidate keywords/sentences, so demos feel responsive. This guarantees the app
is fully testable and demonstrable instantly.
"""
from __future__ import annotations

import re

from app.models.schemas import AssetType, GenerateRequest


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if len(p.strip()) > 15] or [text.strip()[:200] or "the topic"]


def _keywords(text: str, limit: int = 12) -> list[str]:
    stop = {
        "the", "and", "for", "with", "that", "this", "from", "have", "are", "was",
        "were", "which", "their", "they", "them", "then", "than", "into", "about",
        "will", "would", "could", "should", "there", "these", "those", "such",
        "also", "more", "most", "some", "when", "what", "your", "you",
    }
    words = re.findall(r"[A-Za-z][A-Za-z\-]{3,}", text)
    seen: dict[str, int] = {}
    for w in words:
        lw = w.lower()
        if lw in stop:
            continue
        seen[w] = seen.get(w, 0) + 1
    ranked = sorted(seen.items(), key=lambda kv: (-kv[1], kv[0]))
    return [w for w, _ in ranked[:limit]] or ["Concept"]


def _title(text: str) -> str:
    kws = _keywords(text, 3)
    return "Study Set: " + ", ".join(kws[:3]).title()


def generate_mock(req: GenerateRequest) -> dict:
    text = req.content
    kws = _keywords(text, max(req.count, 8))
    sents = _sentences(text)
    n = req.count

    if req.asset_type == AssetType.quiz:
        questions = []
        for i in range(n):
            kw = kws[i % len(kws)]
            if i % 3 == 1:
                questions.append({
                    "question": f"True or False: '{kw}' is a key concept discussed in the material.",
                    "type": "true_false",
                    "options": ["True", "False"],
                    "answer": "True",
                    "explanation": f"The material references '{kw}' as a relevant concept.",
                })
            elif i % 3 == 2:
                questions.append({
                    "question": f"In one sentence, explain the significance of '{kw}'.",
                    "type": "short_answer",
                    "options": [],
                    "answer": f"'{kw}' is important because it appears as a central idea in the notes.",
                    "explanation": "Short-answer items check recall and understanding.",
                })
            else:
                distractors = [k for k in kws if k != kw][:3] or ["Option A", "Option B", "Option C"]
                options = [f"It relates to {kw}", *[f"It is unrelated to {d}" for d in distractors]]
                questions.append({
                    "question": f"Which statement best describes the role of '{kw}' in the material?",
                    "type": "multiple_choice",
                    "options": options,
                    "answer": options[0],
                    "explanation": f"'{kw}' is directly discussed in the source material.",
                })
        return {"title": _title(text), "type": "quiz", "questions": questions}

    if req.asset_type == AssetType.worksheet:
        exercises = []
        for i in range(n):
            kw = kws[i % len(kws)]
            if i % 3 == 0:
                exercises.append({
                    "prompt": f"The core idea of {kw} can be defined as ____.",
                    "type": "fill_blank",
                    "answer": f"a key concept involving {kw}",
                    "hint": f"Review where {kw} is introduced.",
                })
            elif i % 3 == 1:
                exercises.append({
                    "prompt": f"Briefly describe how {kw} applies to a real scenario.",
                    "type": "short_answer",
                    "answer": f"{kw} applies whenever the underlying conditions it describes are present.",
                    "hint": "Think of a concrete example.",
                })
            else:
                exercises.append({
                    "prompt": f"Work through a problem that uses {kw} together with {kws[(i+1) % len(kws)]}.",
                    "type": "practice_problem",
                    "answer": "Combine both concepts step by step to reach the solution.",
                    "hint": "Break the problem into smaller parts.",
                })
        return {
            "title": _title(text),
            "type": "worksheet",
            "instructions": "Complete each exercise. Check your answers against the provided solutions.",
            "exercises": exercises,
        }

    if req.asset_type == AssetType.flashcards:
        cards = []
        for i in range(n):
            kw = kws[i % len(kws)]
            back = sents[i % len(sents)]
            cards.append({
                "front": f"What is '{kw}'?",
                "back": back if len(back) < 240 else back[:237] + "...",
                "hint": f"Starts with '{kw[0].upper()}'.",
            })
        return {"title": _title(text), "type": "flashcards", "cards": cards}

    if req.asset_type == AssetType.mindmap:
        branch_count = min(max(3, n // 3), 6)
        branches = []
        per = max(1, (len(kws) - branch_count) // branch_count)
        idx = branch_count
        for b in range(branch_count):
            children = []
            for _ in range(per):
                if idx < len(kws):
                    children.append({"title": kws[idx].title(), "children": []})
                    idx += 1
            branches.append({"title": kws[b % len(kws)].title(), "children": children})
        return {
            "title": _title(text),
            "type": "mindmap",
            "root": {"title": _keywords(text, 1)[0].title(), "children": branches},
        }

    # summary
    takeaways = [f"{kw.title()} is a central idea in the material." for kw in kws[:n]]
    half = max(1, len(sents) // 2)
    return {
        "title": _title(text),
        "type": "summary",
        "executive_summary": " ".join(sents[:2])[:600],
        "key_takeaways": takeaways,
        "sections": [
            {"heading": "Core Concepts", "points": [s[:160] for s in sents[:half][:5]]},
            {"heading": "Supporting Details", "points": [s[:160] for s in sents[half:][:5]] or ["See source material."]},
        ],
    }
