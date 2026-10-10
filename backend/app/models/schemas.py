"""Request/response schemas and the strict JSON contract for generated assets."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# Enums — the controlled vocabulary used by the customization panel.
# --------------------------------------------------------------------------- #
class AssetType(str, Enum):
    worksheet = "worksheet"
    quiz = "quiz"
    flashcards = "flashcards"
    mindmap = "mindmap"
    summary = "summary"


class Difficulty(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"
    expert = "expert"


class QuestionStyle(str, Enum):
    analytical = "analytical"
    theoretical = "theoretical"
    practical = "practical"
    mixed = "mixed"


class AcademicLevel(str, Enum):
    high_school = "high_school"
    undergraduate = "undergraduate"
    postgraduate = "postgraduate"
    general = "general"


# --------------------------------------------------------------------------- #
# Request
# --------------------------------------------------------------------------- #
class GenerateRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Raw study material (text/markdown).")
    asset_type: AssetType
    difficulty: Difficulty = Difficulty.intermediate
    question_style: QuestionStyle = QuestionStyle.mixed
    academic_level: AcademicLevel = AcademicLevel.undergraduate
    count: int = Field(default=10, ge=1, le=20, description="Number of items (5-20 in UI).")
    force_mock: bool = Field(default=False, description="Force mock generator for this request.")


# --------------------------------------------------------------------------- #
# Asset payloads — these describe the exact JSON the LLM must return.
# --------------------------------------------------------------------------- #
class QuizQuestion(BaseModel):
    question: str
    type: str = Field(default="multiple_choice", description="multiple_choice | true_false | short_answer")
    options: List[str] = Field(default_factory=list)
    answer: str
    explanation: str = ""


class Quiz(BaseModel):
    title: str
    type: str = "quiz"
    questions: List[QuizQuestion]


class WorksheetExercise(BaseModel):
    prompt: str
    type: str = Field(default="short_answer", description="fill_blank | short_answer | practice_problem")
    answer: str = ""
    hint: str = ""


class Worksheet(BaseModel):
    title: str
    type: str = "worksheet"
    instructions: str = ""
    exercises: List[WorksheetExercise]


class Flashcard(BaseModel):
    front: str
    back: str
    hint: str = ""


class FlashcardDeck(BaseModel):
    title: str
    type: str = "flashcards"
    cards: List[Flashcard]


class MindMapNode(BaseModel):
    title: str
    children: List["MindMapNode"] = Field(default_factory=list)


class MindMap(BaseModel):
    title: str
    type: str = "mindmap"
    root: MindMapNode


class SummarySection(BaseModel):
    heading: str
    points: List[str] = Field(default_factory=list)


class Summary(BaseModel):
    title: str
    type: str = "summary"
    executive_summary: str
    key_takeaways: List[str] = Field(default_factory=list)
    sections: List[SummarySection] = Field(default_factory=list)


MindMapNode.model_rebuild()

AssetPayload = Union[Quiz, Worksheet, FlashcardDeck, MindMap, Summary]


# --------------------------------------------------------------------------- #
# Response envelope
# --------------------------------------------------------------------------- #
class GenerateMeta(BaseModel):
    provider: str
    model: str
    asset_type: AssetType
    repaired: bool = False
    retries: int = 0
    mock: bool = False


class GenerateResponse(BaseModel):
    meta: GenerateMeta
    asset: AssetPayload


class HealthResponse(BaseModel):
    status: str
    provider: str
    model: str
    provider_reachable: bool
    detail: Optional[str] = None
