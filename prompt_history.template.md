# Prompt history — Daniel Sánchez Huerta

> Raw, unedited transcript. False starts and bad prompts are signal, not embarrassment.
>
> This is the one artifact where AI content is *expected* — it's the conversation transcript itself. **Do not curate, summarize, or rewrite it.** A polished prompt history with no false starts is treated as evidence of curation, which lowers your AI-discipline score.

## Tool(s) used

- [ ] Claude Code
- [X] Claude.ai
- [ ] Cursor
- [ ] Copilot
- [ ] ChatGPT
- [ ] Aider
- [ ] Other:

## How much of the work was AI-assisted

- [X] Most of it
- [ ] About half
- [ ] Less than half — used it for specific tasks
- [ ] None at all

---

## Sessions

For each session, paste the raw transcript or the prompts you sent, in order. Don't trim.

### Session 1 Organización de trabajo

**Prompt:**

Lee el siguiente siguiente repositorio https://github.com/Dan1el0FF/recruiting-challenge y ayudame a definir como comenzar a trabajar en el para poder completarlo en 6 horas.

**What the model returned:**

Resumen:

Bloque 1 — Exploración (45 min)

Bloque 2 — Diagnóstico y priorización (30 min)

Bloque 3 — Arreglos + feature con IA (3–3.5 h)

Bloque 4 — Documentación técnica (30 min)

Bloque 5 — Los 4 documentos humanos, SIN IA (1–1.25 h)

Bloque 6 — Prompt history y envío (15 min)

**What I accepted, rejected, or refined:**

Me gustó la organización de los bloques de trabajo como empezar la parte de explorar el probléma (bloque 1), pero no me gustó dejar la parte de responder los documentos humanos casi hasta el final, prefiero irlo contestando en paralelo mientras voy solucionando los problémas.
---

### Session 2 Seleccionar el mejor feature a implementar

**Prompt:**

Dame más detalles sobre que feature me conviene utilizar y creame una tabla de ventajas contra desventajas de cada uno.
…

**What the model returned:**

Resumen:

Mi recomendación: Feature C — Order search with filters

Razón principal: el criterio de evaluación dice explícitamente "Quality > quantity" y "Working longer doesn't help; working faster doesn't hurt" — pero también dice que van a probar en la entrevista técnica si puedes explicar y defender cada decisión. Con Webhooks, el riesgo real no es que "no se vea bien" sino que te quedes sin poder decir con confianza en el signoff "esto lo probé y funciona" para las partes que más importan (reintentos, idempotencia). Eso te deja con más ❌ de los que quieres, y forzado a escribir sobre cosas que no llegaste a validar.
---

**What I accepted, rejected, or refined:**

Me llamó más la antención la feature A en vez de la C por que sentí que era lo más simple y con mayor valor para implementar en la app. 

### Session 3 

**Prompt:** 

**What the model returned:**

Resumen:

**What I accepted, rejected, or refined:**



## What Claude (or your AI tool) got wrong

> **Mandatory.** Three or more specific examples of AI output you rejected, corrected, or had to re-prompt. If you cannot fill this section, that itself is the signal — either nothing was reviewed, or the review left no trace. Either way, the score reflects it.
>
> For each example, fill all five fields. Vague answers ("it was wrong about the types") score lower than specific ones ("Claude proposed a `getById(id)` signature that doesn't carry the merchant context; I rejected it because the IDOR fix has to live in the DAL — see commit `abc1234`").

### Example 1

- **The prompt:**


- **What Claude returned:**
- **What was wrong with it** (technically, not just stylistically):
- **How I caught it** (what tipped you off — code reading, test failure, behavior in the browser, prior experience):
- **What I did instead** (and where to see it in the diff, if applicable):

### Example 2

- **The prompt:**
- **What Claude returned:**
- **What was wrong with it:**
- **How I caught it:**
- **What I did instead:**

### Example 3

- **The prompt:**
- **What Claude returned:**
- **What was wrong with it:**
- **How I caught it:**
- **What I did instead:**
