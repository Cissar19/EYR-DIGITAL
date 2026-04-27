"""
upload_firestore.py
--------------------
Sube el curriculum.json generado por scrape_mineduc.py a tu Firestore.

Uso:
    pip install firebase-admin
    python scripts/upload_firestore.py

Requisitos:
  - Crea una Clave de servicio en Firebase Console > Configuración del proyecto
    > Cuentas de servicio > Generar nueva clave privada
  - Guárdala como scripts/serviceAccountKey.json (ya está en .gitignore)
"""

import json
import sys
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("❌ Instala firebase-admin: pip install firebase-admin")
    sys.exit(1)

DATA_FILE = Path(__file__).parent / "data" / "curriculum.json"
KEY_FILE = Path(__file__).parent / "serviceAccountKey.json"
COLLECTION = "curriculum"
BATCH_SIZE = 400  # Firestore acepta hasta 500 ops por batch


def init_firebase():
    if not KEY_FILE.exists():
        print(f"❌ No encontré {KEY_FILE}")
        print("   Descárgala desde Firebase Console → Configuración → Cuentas de servicio")
        sys.exit(1)

    cred = credentials.Certificate(str(KEY_FILE))
    firebase_admin.initialize_app(cred)
    return firestore.client()


def upload(db, data: list[dict]):
    total = len(data)
    print(f"\n📤 Subiendo {total} documentos a Firestore (colección: '{COLLECTION}')...")

    # Subir en batches para respetar límites de Firestore
    for i in range(0, total, BATCH_SIZE):
        batch = db.batch()
        chunk = data[i: i + BATCH_SIZE]

        for doc in chunk:
            doc_id = doc["id"]
            ref = db.collection(COLLECTION).document(doc_id)
            batch.set(ref, doc, merge=True)

        batch.commit()
        done = min(i + BATCH_SIZE, total)
        print(f"  ✅ Subidos {done}/{total}")

    print(f"\n🎉 ¡Listo! {total} documentos en Firestore.")
    print(f'   Consulta en tu app: db.collection("{COLLECTION}").where("curso_slug", "==", "1-basico").get()')


def main():
    if not DATA_FILE.exists():
        print(f"❌ No encontré {DATA_FILE}")
        print("   Primero ejecuta: python scripts/scrape_mineduc.py")
        sys.exit(1)

    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)

    db = init_firebase()
    upload(db, data)


if __name__ == "__main__":
    main()
