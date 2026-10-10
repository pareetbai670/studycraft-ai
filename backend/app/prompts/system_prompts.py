"""System prompts that force open-weight LLMs to return strict, valid JSON.

Each asset type has:
  * a JSON schema skeleton (shown to the model as the ONLY allowed output shape)
  * a short description of each field

The shared `BASE_RULES` block hard-constrains the model: JSON only, no prose,
no markdown fences, no trailing commentary. This dramatically improves the
reliability of small local models (Gemma 2, Llama 3.2, Mistral).
"""
from __future__ import annotations

from app.models.schemas import (
    AcademicLevel,
    AssetType,
    Difficulty,
    QuestionStyle,
)

BASE_RULES = """You are StudyCraft AI, an expert instructional designer.
You convert study material into a learning asset.

OUTPUT RULES (follow EXACTLY):
1. Respond with a SINGLE valid JSON object and NOTHING else.
2. Do NOT wrap the JSON in markdown code fences.
3. Do NOT add explanations, greetings, or text before or after the JSON.
4. Use double quotes for all keys and string values.
5. Do NOT include trailing commas.
6. Escape any double quotes that appear inside string values.
7. The JSON MUST match the provided schema exactly — same keys, same nesting.
8. Base every item strictly on the supplied study material; do not invent facts
   that contradict it. If the material is thin, generalize sensibly.
"""

DIFFICULTY_HINTS = {
    Difficulty.beginner: "Keep language simple; test recall and basic understanding.",
    Difficulty.intermediate: "Test comprehension and application of concepts.",
    Difficulty.advanced: "Require analysis, synthesis, and multi-step reasoning.",
    Difficulty.expert: "Demand deep evaluation, edge cases, and nuanced trade-offs.",
}

STYLE_HINTS = {
    QuestionStyle.analytical: "Favor problem-solving, data/scenario interpretation, and critical thinking.",
    QuestionStyle.theoretical: "Favor core concepts, definitions, and underlying principles.",
    QuestionStyle.practical: "Favor real-world application, case studies, and worked examples.",
    QuestionStyle.mixed: "Use a balanced blend of analytical, theoretical, and practical items.",
}

LEVEL_HINTS = {
    AcademicLevel.high_school: "Target a high-school / secondary audience.",
    AcademicLevel.undergraduate: "Target an undergraduate / college audience.",
    AcademicLevel.postgraduate: "Target a postgraduate / professional audience.",
    AcademicLevel.general: "Target a motivated general learner with no assumed background.",
}

# --------------------------------------------------------------------------- #
# Schema skeletons shown to the model.
# --------------------------------------------------------------------------- #
QUIZ_SCHEMA = """{
  "title": "string",
  "type": "quiz",
  "questions": [
    {
      "question": "string",
      "type": "multiple_choice | true_false | short_answer",
      "options": ["string", "..."],   // 4 options for multiple_choice, ["True","False"] for true_false, [] for short_answer
      "answer": "string",             // the correct option text (or the expected short answer)
      "explanation": "string"         // why the answer is correct
    }
  ]
}"""

WORKSHEET_SCHEMA = """{
  "title": "string",
  "type": "worksheet",
  "instructions": "string",
  "exercises": [
    {
      "prompt": "string",             // for fill_blank use ____ to mark the blank
      "type": "fill_blank | short_answer | practice_problem",
      "answer": "string",             // the model answer / solution
      "hint": "string"
    }
  ]
}"""

FLASHCARDS_SCHEMA = """{
  "title": "string",
  "type": "flashcards",
  "cards": [
    { "front": "string", "back": "string", "hint": "string" }
  ]
}"""

MINDMAP_SCHEMA = """{
  "title": "string",
  "type": "mindmap",
  "root": {
    "title": "string",
    "children": [
      { "title": "string", "children": [ { "title": "string", "children": [] } ] }
    ]
  }
}"""

SUMMARY_SCHEMA = """{
  "title": "string",
  "type": "summary",
  "executive_summary": "string",
  "key_takeaways": ["string", "..."],
  "sections": [
    { "heading": "string", "points": ["string", "..."] }
  ]
}"""

SCHEMA_BY_TYPE = {
    AssetType.quiz: QUIZ_SCHEMA,
    AssetType.worksheet: WORKSHEET_SCHEMA,
    AssetType.flashcards: FLASHCARDS_SCHEMA,
    AssetType.mindmap: MINDMAP_SCHEMA,
    AssetType.summary: SUMMARY_SCHEMA,
}

TASK_BY_TYPE = {
    AssetType.quiz: (
        "Create a quiz with exactly {count} questions. Mix question types when the "
        "style allows. Every multiple_choice question needs exactly 4 plausible options "
        "with ONE correct answer."
    ),
    AssetType.worksheet: (
        "Create a worksheet with exactly {count} exercises combining fill-in-the-blank, "
        "short answer, and practice problems. Provide a model answer for each."
    ),
    AssetType.flashcards: (
        "Create exactly {count} flashcards. The front is a concise question or term; "
        "the back is a clear, self-contained answer or definition."
    ),
    AssetType.mindmap: (
        "Create a hierarchical mind map that organizes the material into a tree. "
        "Use 3-6 top-level branches, each with relevant sub-nodes (aim for ~{count} "
        "total nodes). Keep node titles short (2-6 words)."
    ),
    AssetType.summary: (
        "Extract the main points. Provide a 2-4 sentence executive summary, {count} "
        "key takeaways, and 2-4 thematic sections each with bullet points."
    ),
}


def build_system_prompt(asset_type: AssetType) -> str:
    schema = SCHEMA_BY_TYPE[asset_type]
    return f"{BASE_RULES}\nThe JSON object MUST follow this exact schema:\n{schema}"


def build_user_prompt(
    *,
    asset_type: AssetType,
    content: str,
    difficulty: Difficulty,
    question_style: QuestionStyle,
    academic_level: AcademicLevel,
    count: int,
) -> str:
    task = TASK_BY_TYPE[asset_type].format(count=count)
    return (
        f"TASK: {task}\n\n"
        f"CONSTRAINTS:\n"
        f"- Difficulty: {difficulty.value}. {DIFFICULTY_HINTS[difficulty]}\n"
        f"- Question style: {question_style.value}. {STYLE_HINTS[question_style]}\n"
        f"- Audience: {academic_level.value}. {LEVEL_HINTS[academic_level]}\n"
        f"- Item count target: {count}.\n\n"
        f"STUDY MATERIAL:\n\"\"\"\n{content.strip()}\n\"\"\"\n\n"
        f"Return ONLY the JSON object now."
    )
