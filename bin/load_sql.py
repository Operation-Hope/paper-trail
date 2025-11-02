import psycopg2
import logging
import os
import sys
from pathlib import Path

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
from app.config import conn_params


logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def load_sql_files(db_config, folder_path, schema="pt"):
    """Simple function to load all SQL files in a directory"""

    sql_files = sorted(Path(folder_path).glob("*.sql"))
    logger.info(f"Found {len(sql_files)} SQL files")

    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute(f"SET search_path TO {schema}, public;")
        cursor.execute("SET session_replication_role = 'replica';")
        conn.commit()
        logger.info("Connected to database and disabled foreign keys")

        for sql_file in sql_files:
            logger.info(f"Executing {sql_file.name}")

            with open(sql_file, "r", encoding="utf-8") as f:
                sql_content = f.read()

            cursor.execute(sql_content)
            conn.commit()
            logger.info(f"Successfully executed {sql_file.name}")

        cursor.execute("SET session_replication_role = 'origin';")
        conn.commit()
        logger.info("Re-enabled foreign keys")

        # Count records in each table to verify load
        logger.info("Counting records in tables...")
        tables = [
            "politicians",
            "bills",
            "donors",
            "donations",
            "votes",
            "fec_politician_map",
        ]
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            logger.info(f"  {table}: {count} records")

        cursor.close()
        conn.close()
        logger.info("All files loaded successfully!")

    except Exception as e:
        logger.error(f"Error: {e}")
        if "conn" in locals():
            conn.rollback()
            conn.close()


def main():
    sql_folder = "./"
    load_sql_files(conn_params, sql_folder, schema="pt")


if __name__ == "__main__":
    main()
