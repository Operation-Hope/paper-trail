#!/usr/bin/env python3
"""Initialize database schema if it doesn't exist.

This script checks if the database schema exists, and if not,
restores it from the pg-dump.tar.bz2 file.
"""

import os
import sys
import tarfile
import tempfile
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import psycopg2
from app import config

DUMP_ARCHIVE = project_root / "bin" / "pg-dump.tar.bz2"


def check_schema_exists(conn):
    """Check if the database schema exists by checking for the Politicians table."""
    try:
        # Ensure we're in autocommit mode for this check
        old_autocommit = conn.autocommit
        conn.autocommit = True
        cursor = conn.cursor()
        # Use case-insensitive check since PostgreSQL stores unquoted table names in lowercase
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND LOWER(table_name) = 'politicians'
            );
        """)
        exists = cursor.fetchone()[0]
        cursor.close()
        # Restore previous autocommit state
        conn.autocommit = old_autocommit
        return exists
    except psycopg2.Error as e:
        print(f"Error checking schema: {e}")
        return False


def restore_schema_from_dump(conn):
    """Extract and restore database schema from pg_dump archive."""
    if not DUMP_ARCHIVE.exists():
        print(f"ERROR: Dump file not found at {DUMP_ARCHIVE}")
        print("Please ensure bin/pg-dump.tar.bz2 exists")
        return False

    print(f"Extracting dump from {DUMP_ARCHIVE}...")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract dump file using Python's tarfile module
        try:
            with tarfile.open(DUMP_ARCHIVE, "r:bz2") as tar:
                # Use data filter to avoid deprecation warning in Python 3.14+
                tar.extractall(path=tmpdir, filter='data')
        except (tarfile.TarError, IOError) as e:
            print(f"ERROR: Failed to extract dump file: {e}")
            return False

        dump_file = Path(tmpdir) / "paper-trail-dump"
        
        if not dump_file.exists():
            print(f"ERROR: Expected 'paper-trail-dump' in {DUMP_ARCHIVE}")
            return False

        print("Restoring schema from dump...")
        
        # Read SQL dump
        with dump_file.open() as f:
            dump_content = f.read()

        # Parse SQL statements (schema only, skip data)
        schema_statements = []
        current_statement = []
        in_data_section = False

        for line in dump_content.split("\n"):
            # Skip COPY data sections
            if line.startswith("COPY ") or line.startswith("\\copy "):
                in_data_section = True
                continue
            if line.strip() == "\\.":
                in_data_section = False
                continue
            if in_data_section:
                continue

            # Skip comments and empty lines
            stripped = line.strip()
            if not stripped or stripped.startswith("--"):
                if stripped.endswith(";"):
                    if current_statement:
                        statement = "\n".join(current_statement).strip()
                        if statement:
                            schema_statements.append(statement)
                        current_statement = []
                continue

            # Accumulate statement lines
            current_statement.append(line)

            # Execute when we hit a semicolon
            if stripped.endswith(";"):
                statement = "\n".join(current_statement).strip()
                if statement:
                    # Only include schema creation statements
                    if any(
                        statement.upper().startswith(cmd)
                        for cmd in [
                            "CREATE TABLE",
                            "ALTER TABLE",
                            "CREATE INDEX",
                            "CREATE UNIQUE INDEX",
                            "CREATE SEQUENCE",
                            "ALTER SEQUENCE",
                        ]
                    ):
                        schema_statements.append(statement)
                current_statement = []

        # Execute schema statements
        # Ensure connection is in a clean state before setting autocommit
        try:
            conn.rollback()
        except psycopg2.Error:
            pass  # Ignore if not in a transaction
        
        # Set autocommit before creating cursor
        conn.autocommit = True
        cursor = conn.cursor()
        
        try:
            for statement in schema_statements:
                # Skip OWNER TO statements (roles may not exist)
                if "OWNER TO" in statement.upper():
                    continue

                try:
                    cursor.execute(statement)
                except psycopg2.Error as e:
                    # Ignore "already exists" errors for robustness
                    error_str = str(e).lower()
                    if "already exists" not in error_str and "does not exist" not in error_str:
                        print(f"Warning: {e}")
            
            cursor.close()
            print("Schema restored successfully!")
            return True
        except Exception as e:
            print(f"ERROR: Failed to restore schema: {e}")
            cursor.close()
            return False


def main():
    """Main entry point."""
    print("Checking database schema...")
    
    # Try to connect to database with retries (in case DB is still starting up)
    max_retries = 5
    retry_delay = 2
    conn = None
    
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(**config.conn_params)
            break
        except psycopg2.Error as e:
            if attempt < max_retries - 1:
                print(f"Database not ready yet (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                print(f"ERROR: Failed to connect to database after {max_retries} attempts: {e}")
                print(f"Connection params: host={config.conn_params['host']}, "
                      f"dbname={config.conn_params['dbname']}, "
                      f"user={config.conn_params['user']}")
                sys.exit(1)

    try:
        # Check if schema exists
        if check_schema_exists(conn):
            print("Database schema already exists. Skipping initialization.")
            return 0
        
        print("Database schema not found. Initializing...")
        
        # Restore schema from dump
        if restore_schema_from_dump(conn):
            print("Database initialization complete!")
            return 0
        else:
            print("Database initialization failed!")
            return 1
            
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())

