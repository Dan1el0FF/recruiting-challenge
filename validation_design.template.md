# Validation design — Daniel Sánchez Huerta

## Authorship declaration

Escribí ese diseño de validación sin utilizar IA. La única ayuda es revisión ortográfica.



---

## The question

Anyone with a competent AI tool can fix the symptoms in this codebase. What separates an architect is *building the validation layer that catches the class of bug next time* — so the same mistake cannot quietly reach production again.

For each issue class you addressed, name the gate you built (or would build with more time) that prevents the class — not just the instance. "Added a regression test" is the floor; what's the gate?

Forms a gate can take, in rough order of robustness:

- A regression test pointing at the specific bug (floor — always add this, never the whole answer)
- A property-based or fuzz test that asserts an invariant the bug violated
- A golden test / contract test at the API boundary
- A CI rule, lint rule, or pre-merge script that fails on the pattern
- A type-system constraint that makes the bug uncompilable
- An architecture rule or import-restriction that makes the bad shape impossible
- An eval suite that grades AI output against the class of failure

## What to fill in

For each issue *class* you addressed (not each instance — group by class):

### Class 1 — <name the class, e.g. "Multi-tenant authorization (IDOR)">

- **Instances I fixed:** <list, e.g. "Bug B in GET /api/orders/:id">
- **The gate I built (or would build):** <specific name and shape>
- **What this gate would catch that a regression test would miss:** <the next instance, the next refactor, the next team member>
- **Where to see the gate in the diff** (file path / commit / line range) — *if you actually built it*:
- **If you did not build it,** name the reason (scope, time, dependency, "this is the right call but needs a wider conversation"):

### Class 2 — <name the class>

…

### Class 3 — <name the class>

…

---

## Anti-patterns we score against

- "Added regression tests" with no class-level gate proposed for any class. The instance is patched; the class is not.
- A gate proposed for every class but none actually built in the diff, with no honest accounting of why.
- Generic prose ("I would invest in observability and CI quality") with no named tool, rule, or invariant.
- A 30-line wall of suggestions that reads like an AI-generated checklist. We expect 1–3 *real* gates designed deliberately, not 10 generic ones.
