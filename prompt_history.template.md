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

### Session 3 Error 1: IDOR

**Prompt:** 

Me gustó más la opción A entonces iremos por ese camino, primero vamos a empezar con los fixes y despues al final el feature, me gustaría que checaras el código por que leeí en los archivos que había un errror IDOR y creo que se refiere al archivo
orders-dal.ts que opinas.

**What the model returned:**

Resumen:

Es correcto: orders-dal.ts contiene bug de IDOR real (getById(id) sin filtrar por merchant).

**What I accepted, rejected, or refined:**

Estuve de acuerdo con Claude que existia un error IDOR y confirmé en donde se encontraba el probléma y que archivos necesito modificar.

### Session 4 Error 2: Métricas

**Prompt:** 

Encontré que revenue se calcula sumando toda la columna de cantidad, pero no discrimina por tipo de operación es decir si es un rembolso se sigue sumando a las ganancias en vez de restarlo, sabes si este error se repite en alguna otra métrica calculada?

**What the model returned:**

Resumen

En src/routes/metrics.ts:

avg_order_value_cents (endpoint /api/metrics/summary) — hace AVG(total_amount) sobre todas las filas, incluyendo refunds. Un refund no es "una venta chica", es plata saliendo — así que el promedio queda artificialmente bajo cuando hay refunds.
top-customers (endpoint /api/metrics/top-customers) — hace SUM(total_amount) sin distinguir tipo, así que un cliente que compró y luego pidió un refund aparece como si hubiera gastado más, no neto cero o menos.

**What I accepted, rejected, or refined:**

Al revisar el cálculo de las otras 2 métricas estuve completamente de acuerdo en que también habría que corregirlas

### Session 5 Error 3: email código html malicioso

**Prompt:** 

Necesito que me ayudes a encontrar un error de seguridad que notes en el código y las alternativas de como se puede solucionar

*What the model returned:**

Resumen:

Confirmado, aquí está el bug de seguridad:

if (!body.customer_email || typeof body.total_amount !== 'number') {
  res.status(400).json({ error: 'invalid_body' });
  return;
}

Esto solo chequea que customer_email exista (no sea undefined/vacío) — no valida que tenga forma de email. Cualquiera puede mandar:

{ "customer_email": "<img src=x onerror=alert(document.cookie)>", "total_amount": 100 }

y se guarda tal cual en SQLite. El problema real no es solo "falta un regex" — es que ese valor luego se renderiza en public/app.js con innerHTML sin escapar:

tr.innerHTML = `<td>${o.customer_email}</td>`

Eso convierte "falta de validación de entrada" en XSS almacenado que se ejecuta cada vez que un operador abra el dashboard. Es la combinación write-sin-validar + render-sin-escapar lo que lo hace explotable.

Alternativas para solucionarlo:

Regex 

Libreria de reconocimiento de emails

Yo recommiendo que utilices la librería RFC 5322 (la especificación real de qué es un email válido) es brutalmente compleja. Permite comentarios entre paréntesis, caracteres escapados, direcciones con comillas ("john doe"@example.com), IPs literales como dominio (user@[192.168.1.1]), y más. Un regex de 200 caracteres escrito a mano cubre el 90% de los casos comunes y falla silenciosamente en el resto — o rechazando emails válidos (falsos positivos que frustran usuarios reales) o aceptando cosas que no deberían pasar.

Para inyección de HTML: por qué una librería > escribir tu propio escape

Escapar HTML a mano es un campo minado con décadas de bypasses documentados. No basta con reemplazar < y > — hay vectores vía atributos sin comillas (onmouseover=alert(1)), vía javascript: en un href, vía entidades HTML codificadas, vía srcdoc, vía contextos CSS (expression() en IE viejo), etc. Cada contexto de inserción (texto plano, atributo, URL, CSS, JS) necesita una regla de escape distinta — no existe "un escape universal".

**What I accepted, rejected, or refined:**

Decidí utilizar regex en vez de una libreria por que me parece mucho más simple de implementar y soluciona el problema de inyección de html malicioso

### Session 6 Feature A: exportar excel

**Prompt:** 

Ahora vamos a implementar el feature A quiero que agregues un boton que al picarlo te descargue la información de los últimos 30 días y que contenga todos los datos del cliente y que muestre la cantidad de la orden en dolares en vez de centavos

*What the model returned:**

Resumen: 

Básicamente aquí me regresó los códigos para implementarlos en los archivos app.js, index.html y finalmente cree una ruta para un archivo: src/lib/csv.ts

**What I accepted, rejected, or refined:**

Validé el funcionamiento del código antes de seguir, de hecho cada arreglo lo validaba con un programa de python que subí a este repositorio se encuentra en la carpeta llamada verificator.

### Session 7 Documentación

**Prompt:**

Con base al contexto de proyecto necesito que me ayudes a crear la documentación tanto del archivo arquitecture.md como del archivo api.md en donde tienes que agregar los endpoints que implementé y también debes completar la documentación en general por que se encuentra desactualizada.

*What the model returned:**

Resumen: Me regresó la documentación que se encuentra en la carpeta docs

**What I accepted, rejected, or refined:**

Leeí la documentación para asegurarme de que tenía sentido los cambios agregados y en general estuvé de acuerdo.

## What Claude (or your AI tool) got wrong

> **Mandatory.** Three or more specific examples of AI output you rejected, corrected, or had to re-prompt. If you cannot fill this section, that itself is the signal — either nothing was reviewed, or the review left no trace. Either way, the score reflects it.
>
> For each example, fill all five fields. Vague answers ("it was wrong about the types") score lower than specific ones ("Claude proposed a `getById(id)` signature that doesn't carry the merchant context; I rejected it because the IDOR fix has to live in the DAL — see commit `abc1234`").

### Example 1

- **The prompt:**

Dame más detalles sobre que feature me conviene utilizar y creame una tabla de ventajas contra desventajas de cada uno.

- **What Claude returned:**

Resumen:

Mi recomendación: Feature C — Order search with filters

Razón principal: el criterio de evaluación dice explícitamente "Quality > quantity" y "Working longer doesn't help; working faster doesn't hurt" — pero también dice que van a probar en la entrevista técnica si puedes explicar y defender cada decisión. Con Webhooks, el riesgo real no es que "no se vea bien" sino que te quedes sin poder decir con confianza en el signoff "esto lo probé y funciona" para las partes que más importan (reintentos, idempotencia). Eso te deja con más ❌ de los que quieres, y forzado a escribir sobre cosas que no llegaste a validar.
  
- **What was wrong with it** (technically, not just stylistically):

Pienso que la mejor opción es la A y no la C por que se adecua correctamente para el tiempo que tengo para resolverlo y también por que considero que es la opción que aporta mayor valor al cliente al poder exportar los datos en csv permite generar análisis de datos más detallados.

- **How I caught it** (what tipped you off — code reading, test failure, behavior in the browser, prior experience):

Simplemente al ver los pros y los contras que me dio Claude pude análizar que la mejor opción no era realmente la C

- **What I did instead** (and where to see it in the diff, if applicable):
  
Lo que hice fue optar directamente por la opción A

### Example 2

- **The prompt:**

Lee el siguiente siguiente repositorio https://github.com/Dan1el0FF/recruiting-challenge y ayudame a definir como comenzar a trabajar en el para poder completarlo en 6 horas.

- **What Claude returned:**

Resumen:

Bloque 1 — Exploración (45 min)

Bloque 2 — Diagnóstico y priorización (30 min)

Bloque 3 — Arreglos + feature con IA (3–3.5 h)

Bloque 4 — Documentación técnica (30 min)

Bloque 5 — Los 4 documentos humanos, SIN IA (1–1.25 h)

Bloque 6 — Prompt history y envío (15 min)

- **What was wrong with it:**

No me convenció el plan de trabajo completamente por que había tareas que se pueden realizar en paralelo como rellenar la documentación o incluso los templates.

- **How I caught it:**
- 
Simplemente al verlo pensé que no era la manera más óptima de realizar la estructura de trabajo para terminar en un rango de 6-7 horas además hay que considerar que al hacer los commits deben tener cierto orden y no puedo subirlo todo en un solo commit de golpe.

- **What I did instead:**

Decidí trabajar en paralelo y al terminar de solucionar un problema me ponia a llenar los documentos y despues hacer commit para proseguir con el siguiente probléma.

### Example 3

- **The prompt:**

Necesito que me ayudes a encontrar un error de seguridad que notes en el código y las alternativas de como se puede solucionar

- **What Claude returned:**

Resumen:

Confirmado, aquí está el bug de seguridad:

if (!body.customer_email || typeof body.total_amount !== 'number') {
  res.status(400).json({ error: 'invalid_body' });
  return;
}

Esto solo chequea que customer_email exista (no sea undefined/vacío) — no valida que tenga forma de email. Cualquiera puede mandar:

{ "customer_email": "<img src=x onerror=alert(document.cookie)>", "total_amount": 100 }

y se guarda tal cual en SQLite. El problema real no es solo "falta un regex" — es que ese valor luego se renderiza en public/app.js con innerHTML sin escapar:

tr.innerHTML = `<td>${o.customer_email}</td>`

Eso convierte "falta de validación de entrada" en XSS almacenado que se ejecuta cada vez que un operador abra el dashboard. Es la combinación write-sin-validar + render-sin-escapar lo que lo hace explotable.

Alternativas para solucionarlo:

Regex 

Libreria de reconocimiento de emails

Yo recommiendo que utilices la librería RFC 5322 (la especificación real de qué es un email válido) es brutalmente compleja. Permite comentarios entre paréntesis, caracteres escapados, direcciones con comillas ("john doe"@example.com), IPs literales como dominio (user@[192.168.1.1]), y más. Un regex de 200 caracteres escrito a mano cubre el 90% de los casos comunes y falla silenciosamente en el resto — o rechazando emails válidos (falsos positivos que frustran usuarios reales) o aceptando cosas que no deberían pasar.

Para inyección de HTML: por qué una librería > escribir tu propio escape

Escapar HTML a mano es un campo minado con décadas de bypasses documentados. No basta con reemplazar < y > — hay vectores vía atributos sin comillas (onmouseover=alert(1)), vía javascript: en un href, vía entidades HTML codificadas, vía srcdoc, vía contextos CSS (expression() en IE viejo), etc. Cada contexto de inserción (texto plano, atributo, URL, CSS, JS) necesita una regla de escape distinta — no existe "un escape universal".

- **What was wrong with it:**

  La alternativa que me recomendó sobre utilizar una libreria para reconocer y filtrar los correos se me hacia innecesario ya que utilizando regex se puede solucionar fácilmente el probléma de inyección de código html malicioso e incluso es bastante simple de implementar.
   
- **How I caught it:**
Al comparar los requisitos de cada soluciones y también reconocer sus limitantes fue cuando me di cuenta que usar Regex era una solución mucho más viable.
- **What I did instead:**
Cree el filtro al recibir un correo electrónico utilizando reglas regex.
