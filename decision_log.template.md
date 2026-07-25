# Decision Log — Daniel Sánchez Huerta

> **Write this yourself, without AI assistance.** Spell-check is fine. AI-drafted, AI-rewritten, or AI-polished decision logs are an automatic decline — see `SUBMISSION.md` for why.
>
> Two pages max. Specifics over generalities. Confidence and disagreement are part of the score — own both.

## Authorship declaration

I wrote this decision log entirely without AI assistance. The only tool I used on it was spell-check

## Issues addressed

> Defects, security smells, architectural problems, missing pieces, scaling risks — anything you decided was worth your time. For each, fill in **every** sub-field. An empty field is a worse signal than an awkward answer.

- **Issue 1 — EndPoint con falla de seguridad**
  - What was wrong or weak:
  Al leer los archivos me di cuenta que cuando se hace un request get /api/orders/:id solo te pide el id del producto, pero no corrobora si el merchant_id coincide con el merchant_id de quien hace la petición lo que quiere decir que tan solo conociendo la id de la orden puedes obtener información relacionada sobre la compra aunque no seas el cliente.
  - Shape of my improvement:
  Ahora al hacer una petición de datos sobre una orden pide el merchant_id y compara que coincida con el cliente, de lo contrario no te da la información.
  - **Confidence (1–10):** 9
  - **What would falsify this fix** (a specific scenario, input, or behavior that would prove me wrong):
  Por ejemplo, que Acme Supplies pudiera acceder a la información de ordenes de Bistro Verde o viceversa.
  - **I disagreed with Claude on:** (name where you pushed back during this fix — the rejected suggestion, the alternative shape, the over-scoped refactor — or write *"did not disagree"* and be ready to defend that in the interview)
  No estuvé en desacuerdo.
  - Alternatives I considered and rejected:
  En vez de filtrar con SQL por id y merchant_id traer toda la información y despues comparar, pero se descartó por que es ineficiente y más dificil de escalar.

- **Issue 2 — Métricas Calculadas Incorrectamente**
  - What was wrong or weak:
  Al ver como se calculaba el promedio de las ordenes, ganancias y principales clientes me di cuenta que cometían el mismo error de tomar en cuenta las ordenes de tipo rembolso ya que estás no reflejan las ganancias y tampoco el promedio de una orden de venta y finalmente en principales clientes también se sumaban todos los tipos de ordenes entonces por ejemplo, si tenian una orden de $500 y una orden de rembolso de $400, la metrica lo toma como si el cliente tuviera una inversión de $900 en vez de $100.

  - Shape of my improvement:
  Para calcular las ganancias ahora en vez de sumar toda la columna lo que hace es restar todos los rembolsos a todas las ventas y en el caso de top-customers y Avg order value simplemente se excluye del cálculo.
  - **Confidence (1–10):** 7
  - **What would falsify this fix:**
   Podría no funcionar en el caso de cambiar el status de 'complete' a algun otro ya que asume que todos los status son de tipo "complete" y en realidad esto puede afectar como se calcula la métrica, pero podria simplemente añadir otro filtro para que los calculos solo se hagan con ordenes con status "complete".
  - **I disagreed with Claude on:**
  No estuve en desacuerdo.
  - Alternatives I considered and rejected:
  La alternativa que consideré fue filtrar también por tipo de estatus, pero lo rechacé por falta de tiempo.

- **Issue 3 — Validación de formato de correo **
  - What was wrong or weak:
  Antes al hacer un post para crear una orden simplemente se toma la información del correo sin validar si realmente es un correo o si por el contrario tiene otro tipo de información.
  - Shape of my improvement:
  Utilizo regex en la entrada de los datos para definir la forma que debe tener un correo electrónico válido y rechaza los que no siguen ese formato como podría ser un código html malicioso el cual se rechaza antes de guardarse en la base de datos.
  - **Confidence (1–10):** 8
  - **What would falsify this fix:**
  El regex que implementé no es perfecto o aplica para todos los casos así todavia hay posibilidad de falsearlo y subir información que no sea un correo electrónico
  - **I disagreed with Claude on:**
  Claude quería utilizar una libreria para filtrar los correos electrónicos, sin embargo no estuve de acuerdo con ello ya que habia otra forma más simple para solucionarlo utilizando regex.
  - Alternatives I considered and rejected:
  La alternativa que consideré fue utilizar una libreria especializada en detectar correos electrónicos sin embargo no la utilice debido a que me pareció algo innecesario ya que el objetivo principal es que no entre código html malicioso y utilizando el regex arreglamos eso sin tener que meter librerias o cosas extras.

## Feature chosen

- **Feature:**
- **Why this one and not the others:**
- **What I cut to ship it in budget:**
- **Confidence (1–10) that the shape I picked is the right one:**
- **What would change my mind:**

## Things I noticed but did NOT fix

> Class-of-bug instances you saw and chose not to touch. For each, name the *reason* you cut it (scope / time / dependency / "needs a larger conversation").

-

## Docs / code I left alone deliberately

-

## What I'd do with another 6 hours

-

## Where I felt uncertain

> At least three places in this submission where you were not confident. Genuine uncertainty is a strength signal. "Nothing — I was confident everywhere" is itself a red flag and will be probed.

-
-
-
