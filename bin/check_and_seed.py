#!/usr/bin/env python3
"""Check if database has data and offer to seed it if empty."""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import psycopg2
from app import config


def check_database_has_data():
    """Check if the database contains any data."""
    try:
        conn = psycopg2.connect(**config.conn_params)
        cursor = conn.cursor()
        
        # Set search path to match app behavior (pt, public)
        cursor.execute("SET search_path TO pt, public;")
        
        # Check if Politicians table exists in either schema (case-insensitive)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema IN ('public', 'pt')
            AND LOWER(table_name) = 'politicians';
        """)
        table_exists = cursor.fetchone()[0] > 0
        
        if not table_exists:
            cursor.close()
            conn.close()
            return False, "Schema not initialized"
        
        # Try to count politicians (will work with search_path set)
        try:
            cursor.execute("SELECT COUNT(*) FROM Politicians;")
            politician_count = cursor.fetchone()[0]
        except psycopg2.Error:
            # Table exists but might be in different schema or empty
            politician_count = 0
        
        cursor.close()
        conn.close()
        
        if politician_count == 0:
            return False, "Database is empty (no politicians found)"
        
        return True, f"Database has {politician_count} politicians"
        
    except psycopg2.Error as e:
        error_msg = str(e).lower()
        # Provide helpful error message for common connection issues
        if "could not translate host name" in error_msg or "nodename nor servname" in error_msg:
            host = config.conn_params.get('host', 'unknown')
            return None, f"Cannot connect to database at '{host}'. " \
                        f"Check your .env file - for local development, DB_HOST should be 'localhost', " \
                        f"not 'db' (which is for Docker)."
        elif "role" in error_msg and "does not exist" in error_msg:
            user = config.conn_params.get('user', 'unknown')
            return None, f"Database user '{user}' does not exist. " \
                        f"Either create this user in your local PostgreSQL database, or update your .env file " \
                        f"with your existing database credentials."
        elif "database" in error_msg and "does not exist" in error_msg:
            dbname = config.conn_params.get('dbname', 'unknown')
            return None, f"Database '{dbname}' does not exist. " \
                        f"Either create this database, or update your .env file with your existing database name."
        return None, f"Error checking database: {e}"


def run_populate_script(script_name):
    """Run a populate script."""
    script_path = project_root / "bin" / script_name
    if not script_path.exists():
        print(f"  ❌ Script not found: {script_name}")
        return False
    
    print(f"  Running {script_name}...")
    import subprocess
    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=str(project_root)
    )
    return result.returncode == 0


def interactive_seed():
    """Interactively offer to seed the database."""
    print("\n" + "="*60)
    print("📊 Database Seeding")
    print("="*60)
    print("\nThe database appears to be empty. Would you like to populate it?")
    print("\nAvailable populate scripts:")
    print("  1. populate_politicians.py - Fetches from Congress.gov API")
    print("  2. populate_bills.py - Imports bill data from local files")
    print("  3. populate_donors_and_donations.py - Imports FEC data")
    print("  4. populate_votes.py - Imports voting records")
    print("  5. populate_industries.py - Categorizes donors by industry")
    print("\nRecommended order: 1 → 2 → 3 → 4 → 5")
    
    while True:
        response = input("\nWould you like to run populate scripts? [y/n/all/skip]: ").strip().lower()
        
        if response == 'n' or response == 'skip':
            print("Skipping database seeding. You can run populate scripts manually later.")
            return False
        
        if response == 'y':
            # Run scripts one by one with confirmation
            scripts = [
                'populate_politicians.py',
                'populate_bills.py',
                'populate_donors_and_donations.py',
                'populate_votes.py',
                'populate_industries.py'
            ]
            
            for script in scripts:
                run = input(f"\nRun {script}? [y/n]: ").strip().lower() == 'y'
                if run:
                    success = run_populate_script(script)
                    if not success:
                        print(f"  ⚠️  {script} failed. Continue? [y/n]: ", end='')
                        if input().strip().lower() != 'y':
                            return False
                else:
                    print(f"  Skipping {script}")
            return True
        
        if response == 'all':
            # Run all scripts in recommended order
            scripts = [
                'populate_politicians.py',
                'populate_bills.py',
                'populate_donors_and_donations.py',
                'populate_votes.py',
                'populate_industries.py'
            ]
            
            print("\nRunning all populate scripts in recommended order...")
            for script in scripts:
                success = run_populate_script(script)
                if not success:
                    print(f"\n⚠️  {script} failed. Continue with remaining scripts? [y/n]: ", end='')
                    if input().strip().lower() != 'y':
                        return False
            return True
        
        print("Please enter 'y' (yes), 'n' (no), 'all' (run all), or 'skip' (skip)")


def main():
    """Main entry point."""
    print("Checking database status...")
    
    has_data, message = check_database_has_data()
    
    if has_data is None:
        # Error checking database
        print(f"⚠️  {message}")
        print("\n💡 Tip: Make sure your .env file is configured correctly.")
        print("   For local development, use:")
        print("   - DB_HOST=localhost")
        print("   - DB_PORT=5432")
        print("   - DB_NAME=your_database_name")
        print("   - DB_USER=your_database_user")
        print("   - DB_PASSWORD=your_database_password")
        print("\n   Copy .dev.env to .env and update with your local database credentials.")
        return 1
    
    if has_data:
        print(f"✅ {message}")
        return 0
    
    # Database is empty
    print(f"⚠️  {message}")
    
    # Only offer seeding if not in Docker (Docker has its own initialization)
    if not os.getenv('DOCKER_COMPOSE'):
        # Check if we're in an interactive terminal
        if sys.stdin.isatty():
            interactive_seed()
        else:
            print("\nNon-interactive mode detected. Skipping seed prompt.")
            print("Run populate scripts manually if needed.")
    else:
        print("\nRunning in Docker. Database seeding should be done manually.")
        print("Run: docker exec -it paper-trail-backend python bin/populate_*.py")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

