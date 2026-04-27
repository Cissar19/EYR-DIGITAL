"""
scrape_mineduc.py
-----------------
Extrae todos los Objetivos de Aprendizaje (OA) desde curriculumnacional.cl
y los guarda en data/curriculum.json, listo para subir a Firestore.

Uso:
    pip install requests beautifulsoup4
    python scripts/scrape_mineduc.py
"""

import requests
import json
import time
import re
from bs4 import BeautifulSoup
from pathlib import Path

BASE_URL = "https://www.curriculumnacional.cl"
OUTPUT_FILE = Path(__file__).parent / "data" / "curriculum.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; EYR-Digital/1.0; Educational research)"
}

# Mapa de cursos y niveles disponibles en el sitio
NIVELES = [
    {
        "nivel_id": "1o-6o-basico",
        "nivel_nombre": "Educación Básica 1° a 6°",
        "cursos": [
            {"slug": "1-basico", "nombre": "1° Básico"},
            {"slug": "2-basico", "nombre": "2° Básico"},
            {"slug": "3-basico", "nombre": "3° Básico"},
            {"slug": "4-basico", "nombre": "4° Básico"},
            {"slug": "5-basico", "nombre": "5° Básico"},
            {"slug": "6-basico", "nombre": "6° Básico"},
        ],
    },
    {
        "nivel_id": "7o-basico-2o-medio",
        "nivel_nombre": "Educación Básica 7° y 8°",
        "cursos": [
            {"slug": "7-basico", "nombre": "7° Básico"},
            {"slug": "8-basico", "nombre": "8° Básico"},
        ],
    },
]


def get_soup(url: str) -> BeautifulSoup | None:
    """Descarga una página y retorna BeautifulSoup. Reintenta 3 veces."""
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except Exception as e:
            print(f"  ⚠ Intento {attempt+1}/3 fallido para {url}: {e}")
            time.sleep(3)
    return None


def get_asignaturas(nivel_id: str, curso_slug: str) -> list[dict]:
    """Obtiene las asignaturas disponibles para un curso."""
    url = f"{BASE_URL}/curriculum/{nivel_id}/curso/{curso_slug}"
    soup = get_soup(url)
    if not soup:
        return []

    asignaturas = []
    main = soup.find("main") or soup.find(id="main-content") or soup
    links = main.find_all("a", href=True)

    for link in links:
        href = link.get("href", "")
        # Las URLs de asignaturas siguen el patrón /curriculum/{nivel}/{asignatura}/{curso}
        pattern = rf"/curriculum/{nivel_id}/([^/]+)/{curso_slug}$"
        match = re.search(pattern, href)
        if match:
            asignatura_slug = match.group(1)
            # Excluir la navegación genérica
            if asignatura_slug not in ["curso", "asignatura"]:
                asignaturas.append({
                    "slug": asignatura_slug,
                    "nombre": link.get_text(strip=True),
                    "url": f"{BASE_URL}{href}",
                })

    return asignaturas


def get_objetivos(nivel_id: str, asignatura_slug: str, curso_slug: str) -> list[dict]:
    """Extrae todos los OA de una página asignatura/curso, agrupados por eje."""
    url = f"{BASE_URL}/curriculum/{nivel_id}/{asignatura_slug}/{curso_slug}"
    soup = get_soup(url)
    if not soup:
        return []

    main = soup.find("main") or soup.find(id="main-content") or soup
    ejes = []
    eje_actual = {"nombre": "General", "objetivos": []}

    # Los h3 son los ejes (Números y operaciones, Geometría, etc.)
    # Los h4 con "Objetivo de aprendizaje" contienen el código
    for elem in main.find_all(["h3", "h4", "p", "ul"]):
        tag = elem.name

        # Detectar cambio de eje
        if tag == "h3":
            texto = elem.get_text(strip=True)
            # Ignorar encabezados de sección genéricos
            if any(ignore in texto for ignore in ["Documentos curriculares", "Evaluación", "Recursos", "Explorar"]):
                continue
            if eje_actual["objetivos"]:
                ejes.append(eje_actual)
            eje_actual = {"nombre": texto, "objetivos": []}

        # Detectar OA
        elif tag == "h4":
            texto = elem.get_text(separator=" ", strip=True)
            # El patrón del código OA: "Objetivo de aprendizaje XX00 OA 00"
            codigo_match = re.search(r"([A-Z]{2,4}\d{2}\s+OA\s+\d+)", texto, re.IGNORECASE)
            if not codigo_match:
                continue

            codigo = codigo_match.group(1).strip()
            # Extraer número del OA para construir el slug
            oa_num_match = re.search(r"OA\s+(\d+)", codigo, re.IGNORECASE)
            oa_num = oa_num_match.group(1).zfill(2) if oa_num_match else "00"
            # Slug del OA: ma01-oa-01
            prefix = re.match(r"[A-Z]+\d+", codigo.replace(" ", ""), re.IGNORECASE)
            prefix_lower = prefix.group(0).lower() if prefix else ""
            oa_slug = f"{prefix_lower}-oa-{oa_num}"

            # La descripción viene en el siguiente párrafo o en el mismo h4
            desc_elem = elem.find_next_sibling()
            descripcion = ""
            indicadores = []

            if desc_elem:
                if desc_elem.name in ("p", "div"):
                    descripcion = desc_elem.get_text(separator=" ", strip=True)
                    # Si hay una lista después, son los sub-ítems del OA (indicadores estructurales)
                    ul = desc_elem.find_next_sibling("ul")
                    if ul:
                        indicadores = [li.get_text(separator=" ", strip=True) for li in ul.find_all("li")]
                elif desc_elem.name == "ul":
                    # Algunos OA tienen la desc directamente como lista
                    indicadores = [li.get_text(separator=" ", strip=True) for li in desc_elem.find_all("li")]

            # Link del OA
            oa_link = elem.find("a") or elem.find_next("a", href=re.compile(oa_slug))
            oa_url = ""
            if oa_link:
                oa_url = BASE_URL + oa_link["href"] if oa_link["href"].startswith("/") else oa_link["href"]

            eje_actual["objetivos"].append({
                "codigo": codigo,
                "slug": oa_slug,
                "descripcion": descripcion,
                "indicadores_estructurales": indicadores,  # Sub-ítems del OA (si tiene)
                "url": oa_url,
            })

    # Añadir el último eje
    if eje_actual["objetivos"]:
        ejes.append(eje_actual)

    return ejes


def scrape_all() -> list[dict]:
    """Función principal: recorre todos los niveles, cursos y asignaturas."""
    resultado = []

    for nivel in NIVELES:
        nivel_id = nivel["nivel_id"]
        print(f"\n📚 Nivel: {nivel['nivel_nombre']}")

        for curso in nivel["cursos"]:
            curso_slug = curso["slug"]
            print(f"\n  📖 Curso: {curso['nombre']}")

            asignaturas = get_asignaturas(nivel_id, curso_slug)
            print(f"     Asignaturas encontradas: {len(asignaturas)}")
            time.sleep(1)

            for asig in asignaturas:
                print(f"     → Raspando {asig['nombre']}...", end=" ")
                ejes = get_objetivos(nivel_id, asig["slug"], curso_slug)
                total_oa = sum(len(e["objetivos"]) for e in ejes)
                print(f"{total_oa} OA en {len(ejes)} eje(s)")

                if total_oa > 0:
                    # ID único para Firestore: nivel_curso_asignatura
                    doc_id = f"{nivel_id}__{curso_slug}__{asig['slug']}"
                    resultado.append({
                        "id": doc_id,
                        "nivel_id": nivel_id,
                        "nivel_nombre": nivel["nivel_nombre"],
                        "curso_slug": curso_slug,
                        "curso_nombre": curso["nombre"],
                        "asignatura_slug": asig["slug"],
                        "asignatura_nombre": asig["nombre"],
                        "ejes": ejes,
                        "total_oa": total_oa,
                    })

                time.sleep(1.5)  # Respetar el servidor

    return resultado


def main():
    print("🚀 Iniciando scraping del Currículum Nacional MINEDUC...")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    data = scrape_all()

    total_docs = len(data)
    total_oa = sum(d["total_oa"] for d in data)
    print(f"\n✅ Scraping completado.")
    print(f"   Documentos: {total_docs} | Total OA: {total_oa}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"   Guardado en: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
