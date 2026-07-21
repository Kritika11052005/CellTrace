"""CellTrace Database Seeding Script"""
import os
os.environ["PRISMA_PY_DEBUG_GENERATOR"] = "1"
import asyncio
import csv
import logging
from pathlib import Path
from app.prisma import Prisma
from app.auth.jwt import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("celltrace.seed")

CSV_PATH = Path(__file__).resolve().parent.parent / "Data" / "cell_features_v4.csv"

async def main():
    db = Prisma()
    await db.connect()
    logger.info("Database connected ✓")

    # 1. Create Default Operator User
    operator_email = "operator@celltrace.com"
    user = await db.user.find_unique(where={"email": operator_email})
    if not user:
        password_raw = "password123"
        hashed = hash_password(password_raw)
        user = await db.user.create(
            data={
                "email": operator_email,
                "password_hash": hashed,
                "role": "operator",
            }
        )
        logger.info(f"Operator user created ✓ (Email: {operator_email}, Password: {password_raw})")
    else:
        logger.info(f"Operator user already exists ✓")

    # 2. Parse CSV and seed battery entries only (no fake predictions)
    if CSV_PATH.exists():
        logger.info(f"Parsing battery data from {CSV_PATH}")
        with open(CSV_PATH, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        # Select a diverse subset of cells (e.g., LFP, LCO, NMC, etc.)
        selected_cells = []
        
        # Grab first 10 rows for LCO/calce and others
        for row in rows[:15]:
            selected_cells.append(row)
        
        # Also grab some LFP (mit/snl) cells from later in the file
        for row in rows[15:]:
            source = row.get("source", "").lower()
            cathode = row.get("cathode", "").upper()
            if len(selected_cells) < 30:
                selected_cells.append(row)

        logger.info(f"Seeding {len(selected_cells)} batteries…")
        for cell in selected_cells:
            cell_id = cell["cell_id"]
            cathode = cell.get("cathode", "LFP").upper()
            source = cell.get("source", "mit").upper()
            total_cycles = int(cell.get("total_cycles", "500"))

            # SOH maps
            has_knee = cell.get("has_knee_point", "False").lower() == "true"
            
            # Map cathode to chemistry description
            chem_map = {"LCO": "Lithium Cobalt Oxide", "LFP": "Lithium Iron Phosphate", "NMC": "Nickel Manganese Cobalt", "NCA": "Nickel Cobalt Aluminum"}
            chemistry = chem_map.get(cathode, "Lithium-Ion")

            # Check if battery exists
            battery = await db.battery.find_unique(where={"id": cell_id})
            if not battery:
                battery = await db.battery.create(
                    data={
                        "id": cell_id,
                        "manufacturer": f"{source} Consortium",
                        "model": "18650 Cylindrical" if source == "SNL" else "Pouch Cell",
                        "chemistry": chemistry,
                        "nominal_capacity_ah": 1.1 if cathode == "LFP" else 2.0,
                    }
                )
                logger.info(f"Created battery: {cell_id}")

            # No fake predictions or chain records are seeded.
            # Predictions should only come from actual inference model runs via the API.
            logger.info(f"Battery {cell_id} ready for inference — no mock data seeded")

    logger.info("Database seeding complete!")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
