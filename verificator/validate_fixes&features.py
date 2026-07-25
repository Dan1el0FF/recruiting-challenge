#Este programa es externo del funcionamiento de la app y es demostración de como validé los errores y features agregados a la app web local

import requests

#VALIDACION DEL PROBLEMA 1

BASE = "http://localhost:3000"

def Validation1():
    # 1. Crea una orden como Acme
    r = requests.post(
        f"{BASE}/api/orders",
        headers={"X-Merchant-Id": "m_acme"},
        json={"customer_email": "test@acme.com", "total_amount": 1000, "type": "sale"},
    )
    order = r.json()["order"]
    order_id = order["id"]
    print("Orden creada por Acme:", order_id)

    # 2. Bistro intenta leer esa orden y no debe devolver nada
    r2 = requests.get(
        f"{BASE}/api/orders/{order_id}",
        headers={"X-Merchant-Id": "m_bistro"},
    )
    print("Status:", r2.status_code)
    print("Body:", r2.json())


    # 3. Acme intenta leer la orden y debe devolverla correctamente

    r2 = requests.get(
        f"{BASE}/api/orders/{order_id}",
        headers={"X-Merchant-Id": "m_acme"},
    )
    print("Status:", r2.status_code)
    print("Body:", r2.json())


def Validation2():
    merchant = "m_acme"
    headers = {"X-Merchant-Id": merchant}
    from_date, to_date = "2000-01-01", "2100-01-01"
    customer = "revtest2@acme.com"

    # --- ANTES ---
    revenue_before = requests.get(f"{BASE}/api/revenue?from={from_date}&to={to_date}", headers=headers).json()["revenue_cents"]
    summary_before = requests.get(f"{BASE}/api/metrics/summary", headers=headers).json()
    top_before = requests.get(f"{BASE}/api/metrics/top-customers?limit=50", headers=headers).json()["customers"]
    top_spent_before = next((c["total_spent"] for c in top_before if c["customer_email"] == customer), 0)

    # --- Crea venta $100 y refund $30, mismo cliente ---
    requests.post(f"{BASE}/api/orders", headers=headers,
                  json={"customer_email": customer, "total_amount": 10000, "type": "sale"})
    requests.post(f"{BASE}/api/orders", headers=headers,
                  json={"customer_email": customer, "total_amount": 3000, "type": "refund"})

    # --- DESPUÉS ---
    revenue_after = requests.get(f"{BASE}/api/revenue?from={from_date}&to={to_date}", headers=headers).json()["revenue_cents"]
    summary_after = requests.get(f"{BASE}/api/metrics/summary", headers=headers).json()
    top_after = requests.get(f"{BASE}/api/metrics/top-customers?limit=50", headers=headers).json()["customers"]
    top_spent_after = next((c["total_spent"] for c in top_after if c["customer_email"] == customer), 0)

    print("=== REVENUE ===")
    diff_revenue = revenue_after - revenue_before
    print(f"Antes: {revenue_before}, Después: {revenue_after}, Diferencia: {diff_revenue}")
    print("Esperado: 7000 ->", "CORRECTO" if diff_revenue == 7000 else "FALLÓ")

    print("\n=== AVG ORDER VALUE ===")
    print(f"Antes: {summary_before['avg_order_value_cents']}, Después: {summary_after['avg_order_value_cents']}")
    print("(el promedio debe subir o cambiar solo por la VENTA, el refund no debe afectarlo)")

    print("\n=== TOP CUSTOMERS ===")
    diff_top = top_spent_after - top_spent_before
    print(f"total_spent antes: {top_spent_before}, después: {top_spent_after}, Diferencia: {diff_top}")
    print("Esperado: 7000 ->", "CORRECTO" if diff_top == 7000 else "FALLÓ")


def Validation3():
    merchant = "m_acme"
    headers = {"X-Merchant-Id": merchant}

    print("=== Intento 1: email VÁLIDO ===")
    r1 = requests.post(
        f"{BASE}/api/orders",
        headers=headers,
        json={"customer_email": "cliente_real@example.com", "total_amount": 5000, "type": "sale"},
    )
    print("Status:", r1.status_code)
    print("Body:", r1.json())
    print("Esperado: 201 (creada) ->", "CORRECTO" if r1.status_code == 201 else "FALLÓ")

    print("\n=== Intento 2: payload malicioso (XSS) ===")
    r2 = requests.post(
        f"{BASE}/api/orders",
        headers=headers,
        json={"customer_email": "<img src=x onerror=\"alert(1)\">", "total_amount": 5000, "type": "sale"},
    )
    print("Status:", r2.status_code)
    print("Body:", r2.json())
    print("Esperado: 400 (rechazada) ->", "CORRECTO" if r2.status_code == 400 else "FALLÓ")

    print("\n=== Intento 3: texto sin forma de email ===")
    r3 = requests.post(
        f"{BASE}/api/orders",
        headers=headers,
        json={"customer_email": "sin_arroba_ni_dominio", "total_amount": 5000, "type": "sale"},
    )
    print("Status:", r3.status_code)
    print("Body:", r3.json())
    print("Esperado: 400 (rechazada) ->", "CORRECTO" if r3.status_code == 400 else "FALLÓ")

def Validation4():
    merchant = "m_acme"
    headers = {"X-Merchant-Id": merchant}
    r = requests.get(f"{BASE}/api/orders/export?from=2000-01-01&to=2100-01-01", headers=headers)
    print("Status:", r.status_code)
    print("Content-Type:", r.headers.get("Content-Type"))
    print("Content-Disposition:", r.headers.get("Content-Disposition"))
    print("\nPrimeras líneas del CSV:")
    print("\n".join(r.text.split("\n")[:5]))

while(1):

    try:
        V = int(input('Escoge un numero del 1 al 4 para validar el funcionamiento:'))
        if V > 4:
            V = 4
        if V < 1:
            V = 1
    except Exception as e:
        print(f"Ocurrió un error: {e}")
        exit()


    if V == 1:
        Validation1()
    elif V == 2:
        Validation2()
    elif V == 3:
        Validation3()
    elif V == 4:
        Validation4()