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

### Class 1 Multi-tenant authorization (IDOR)

- **Instances I fixed:** security bug in the endpoint GET /api/orders/:id">
- **The gate I built (or would build):** Pide el merchant_id al usar el endpoint GET /api/orders/:id para saber si la información le corresponde al comerciante  o no
- **What this gate would catch that a regression test would miss:** <the next instance, the next refactor, the next team member>
  "El test de regresión que sí escribí solo protege getById. No detectaría la próxima instancia si mañana alguien agrega getByStatus(status) o getByCustomerEmail(email) a orders-dal.ts sin pedir merchantId, el test viejo sigue pasando porque apunta a una función específica, no verifica que toda función del DAL tenga el filtro.
  
- **If you did not build it,** name the reason (scope, time, dependency, "this is the right call but needs a wider conversation"): No lo contruí manualmente por que realmente no tengo conocimientos de typescript, sin embargo si entiendo la estructura ya que he visto otras apps locales hechas completamente en python y html.

### Class 2 — Recalculo de Métricas
**Instances I fixed: Al calcular diferentes metricas como: revenue, top customers, avg order value ya excluye las ordenes de tipo refund o las resta de manera adecuada para obtener un resultado correcto
- **The gate I built (or would build): En el caso de revenue resto los refunds a las ventas para obtener revenue y en el caso de top customers o avg order value excluyo refunds del cálculo.
- **What this gate would catch that a regression test would miss:** La próxima instancia: ya sabemos que el mismo bug existía en 3 lugares distintos (sumAmountByMerchant, avg_order_value, top-customers) — y de hecho tuve que escribir la corrección tres veces por separado. Si mañana se agrega una cuarta métrica (por ejemplo "revenue por semana" o "ticket promedio por tipo de cliente"), nada me garantiza que quien la escriba se acuerde de excluir/restar los refunds
…

### Class 3 — Validación de entrada de emails
**Instances I fixed:** Valida que al hacer un post de una orden el email tenga el formato correcto
- **The gate I built (or would build): Un regex (EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/) aplicado en el punto de entrada del POST /api/orders, que rechaza con 400 { error: 'invalid_body' } cualquier customer_email que no tenga forma de email
- **What this gate would catch that a regression test would miss:** si mañana se agrega otro campo de texto libre al schema (por ejemplo, una nota del pedido, un nombre de cliente, un comentario), nada obliga a que ese campo nuevo pase por el mismo regex — el patrón de "validar en el borde de entrada" no está centralizado, cada campo nuevo depende de que alguien se acuerde de aplicarlo otra vez.
…
---

## Anti-patterns we score against

- "Added regression tests" with no class-level gate proposed for any class. The instance is patched; the class is not.
- A gate proposed for every class but none actually built in the diff, with no honest accounting of why.
- Generic prose ("I would invest in observability and CI quality") with no named tool, rule, or invariant.
- A 30-line wall of suggestions that reads like an AI-generated checklist. We expect 1–3 *real* gates designed deliberately, not 10 generic ones.
