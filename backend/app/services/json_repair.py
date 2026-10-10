"""Best-effort JSON extraction and repair for sloppy LLM output.

Small local models frequently wrap JSON in markdown fences, add leading prose,
or emit trailing commas. This module tries, in order of increasing aggression,
to recover a valid JSON object from a raw model response.
"""
from __future__ import annotations

import json
import re
from typing import Any


class JSONRepairError(ValueError):
    """Raised when no valid JSON object can be recovered."""


_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def _strip_fences(text: str) -> str:
    match = _FENCE_RE.search(text)
    return match.group(1) if match else text


def _extract_outermost_object(text: str) -> str:
    """Return the substring from the first '{' to its matching '}'.

    Tracks brace depth while respecting string literals and escapes so that
    braces inside strings do not confuse the matcher.
    """
    start = text.find("{")
    if start == -1:
        raise JSONRepairError("No JSON object found in model output.")

    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    # Unbalanced — return from start and let later passes try to fix.
    return text[start:]


def _remove_trailing_commas(text: str) -> str:
    return re.sub(r",(\s*[}\]])", r"\1", text)


def _close_unbalanced(text: str) -> str:
    """Append missing closing brackets/braces for truncated output."""
    opens_curly = text.count("{")
    closes_curly = text.count("}")
    opens_sq = text.count("[")
    closes_sq = text.count("]")
    text = text + "]" * max(0, opens_sq - closes_sq)
    text = text + "}" * max(0, opens_curly - closes_curly)
    return text


def repair_json(raw: str) -> tuple[dict[str, Any], bool]:
    """Attempt to parse `raw` into a dict.

    Returns `(parsed_dict, repaired)` where `repaired` is True if any cleanup
    beyond a plain `json.loads` was required. Raises `JSONRepairError` on total
    failure.
    """
    if not raw or not raw.strip():
        raise JSONRepairError("Empty model output.")

    # Pass 0: optimistic direct parse.
    try:
        return json.loads(raw), False
    except json.JSONDecodeError:
        pass

    candidate = _strip_fences(raw).strip()

    # Pass 1: strip fences then parse.
    try:
        return json.loads(candidate), True
    except json.JSONDecodeError:
        pass

    # Pass 2: isolate the outermost object.
    candidate = _extract_outermost_object(candidate)
    try:
        return json.loads(candidate), True
    except json.JSONDecodeError:
        pass

    # Pass 3: remove trailing commas.
    candidate = _remove_trailing_commas(candidate)
    try:
        return json.loads(candidate), True
    except json.JSONDecodeError:
        pass

    # Pass 4: close unbalanced brackets (truncation) + trailing commas again.
    candidate = _remove_trailing_commas(_close_unbalanced(candidate))
    try:
        return json.loads(candidate), True
    except json.JSONDecodeError as exc:
        raise JSONRepairError(f"Could not repair JSON: {exc}") from exc
