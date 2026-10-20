#!/usr/bin/env python3
"""Builds the traceability matrix and checks it for gaps.

Traceability is only worth claiming if something checks it. This reads the
requirements, the test plan, both suites and the defect log, prints the matrix, and
fails when a link is missing -- so a requirement without a case, or a test whose case
id does not exist in the plan, breaks the build rather than going unnoticed.

    python tools/traceability.py            print the matrix
    python tools/traceability.py --check    print it and exit non-zero on any gap
"""
from __future__ import annotations

import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

CASE = re.compile(r"TC-(?:UI|API)-\d{3}")
REQ = re.compile(r"REQ-\d{3}")


def plan_cases() -> set[str]:
    """Every case id the test plan defines."""
    found: set[str] = set()
    for line in (DOCS / "TEST_PLAN.md").read_text().splitlines():
        if line.startswith("| TC-"):
            match = CASE.search(line)
            if match:
                found.add(match.group())
    return found


def expand(text: str, known: set[str]) -> list[str]:
    """Reads a 'Covered by' line: accepts a list, a range, or a mix of both."""
    ids = CASE.findall(text)
    if " to " in text and len(ids) == 2:
        first, last = ids
        prefix = first.rsplit("-", 1)[0]
        lo, hi = int(first.rsplit("-", 1)[1]), int(last.rsplit("-", 1)[1])
        return sorted(c for c in known if c.startswith(prefix) and lo <= int(c.rsplit("-", 1)[1]) <= hi)
    return sorted(set(ids))


def requirement_coverage(known: set[str]) -> dict[str, list[str]]:
    """Requirement -> the cases it names. The requirements document is the authority:
    a test plan section can carry two requirements, which would credit every case in it
    to both."""
    coverage: dict[str, list[str]] = {}
    current = None
    for line in (DOCS / "REQUIREMENTS.md").read_text().splitlines():
        header = re.match(r"### (REQ-\d{3})", line)
        if header:
            current = header.group(1)
            coverage.setdefault(current, [])
        elif current and line.startswith("**Covered by"):
            coverage[current] = expand(line, known)
    return coverage


def suite_cases() -> dict[str, set[str]]:
    """Case id -> the test files that implement it."""
    found: dict[str, set[str]] = defaultdict(set)
    for path in sorted((ROOT / "tests").rglob("*")):
        if path.suffix not in {".js", ".py"} or "node_modules" in path.parts:
            continue
        text = path.read_text()
        for match in CASE.findall(text):
            found[match].add(path.relative_to(ROOT).as_posix())
        # pytest function names carry the id in lower case with underscores
        for match in re.findall(r"def test_tc_(ui|api)_(\d{3})", text):
            found[f"TC-{match[0].upper()}-{match[1]}"].add(path.relative_to(ROOT).as_posix())
    return found


def defects() -> dict[str, set[str]]:
    """Case id -> the defects recorded against it."""
    by_case: dict[str, set[str]] = defaultdict(set)
    current = None
    for line in (DOCS / "DEFECTS.md").read_text().splitlines():
        header = re.match(r"### (DEF-\d{3})", line)
        if header:
            current = header.group(1)
        elif current and line.startswith("**Covered by test"):
            for case in CASE.findall(line):
                by_case[case].add(current)
    return by_case


def describe(cases: list[str]) -> str:
    """A dash only where the ids really are a contiguous run of one prefix."""
    if not cases:
        return "—"
    if len(cases) == 1:
        return cases[0]
    prefixes = {c.rsplit("-", 1)[0] for c in cases}
    numbers = [int(c.rsplit("-", 1)[1]) for c in cases]
    if len(prefixes) == 1 and numbers == list(range(numbers[0], numbers[-1] + 1)):
        return f"{cases[0]}–{cases[-1]}"
    return ", ".join(cases)


def main() -> int:
    plan = plan_cases()
    suites, found_defects = suite_cases(), defects()
    by_req = requirement_coverage(plan)

    print("| Requirement | Cases | Automated | Defects found |")
    print("|---|---|---|---|")
    for req, cases in by_req.items():
        automated = [c for c in cases if c in suites]
        found = sorted({d for c in cases for d in found_defects.get(c, set())})
        span = describe(cases)
        print(f"| {req} | {len(cases)} ({span}) | {len(automated)} | "
              f"{', '.join(found) if found else '—'} |")

    problems: list[str] = []
    for req, cases in by_req.items():
        if not cases:
            problems.append(f"{req} has no test case covering it")
    covered = {c for cases in by_req.values() for c in cases}
    for case in sorted(suites):
        if case not in plan:
            problems.append(f"{case} is implemented in {sorted(suites[case])} but is not in the test plan")
        elif case not in covered:
            problems.append(f"{case} is implemented but no requirement claims it")
    for case, ds in sorted(found_defects.items()):
        if case not in plan:
            problems.append(f"{', '.join(sorted(ds))} points at {case}, which is not in the test plan")

    print(f"\nRequirements: {len(by_req)} · cases in the plan: {len(plan)} · "
          f"cases implemented: {len(suites)} · defects linked to a case: "
          f"{len({d for ds in found_defects.values() for d in ds})}")

    if problems:
        print("\nGaps:")
        for problem in problems:
            print(f"  - {problem}")
        return 1 if "--check" in sys.argv else 0

    print("\nNo gaps: every requirement has a case, and every implemented case is in the plan.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
