import os
from dotenv import load_dotenv
# from pathlib import Path

# Check for Docker environment BEFORE loading .env file
# This ensures Docker environment variables take precedence
is_docker = os.getenv("DOCKER_COMPOSE", "").lower() == "true"

# Load .env file (won't override existing environment variables)
load_dotenv('.env')

# --- Base Directory ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Load Database Credentials from .env ---
# We use os.getenv() to read the variables.
# Smart defaults: detect if running in Docker (service name 'db') or locally ('localhost')
# Docker Compose sets DOCKER_COMPOSE=true, but we can also detect by checking if 'db' hostname resolves
# Note: In Docker, always use 'db' as host regardless of .env file
if is_docker:
    # Force 'db' host in Docker, ignore .env file value
    DB_HOST = "db"
else:
    # Use .env file value or default to localhost
    DB_HOST = os.getenv("DB_HOST") or "localhost"

DB_PORT = os.getenv("DB_PORT") or "5432"
DB_NAME = os.getenv("DB_NAME") or "paper_trail_dev"
DB_USER = os.getenv("DB_USER") or "paper_trail_user"
DB_PASSWORD = os.getenv("DB_PASSWORD") or "dev_password_change_in_production"

# --- Test Mode Override ---
# When running tests, force usage of test database to prevent production data corruption
if os.getenv("TESTING") == "true":
    DB_NAME = "paper_trail_test"

# --- Build the conn_params dictionary that all your scripts use ---
# This dictionary is imported by your other scripts.
conn_params = {
    "host": DB_HOST,
    "port": DB_PORT,
    "dbname": DB_NAME,
    "user": DB_USER,
    "password": DB_PASSWORD
}

# --- Load API Key from .env ---
CONGRESS_GOV_API_KEY = os.getenv("CONGRESS_GOV_API_KEY")

# --- Non-Secret File Paths ---
# These are not secrets, so they can stay here.
FEC_DATA_FOLDER_PATH = os.path.join(BASE_DIR, "contributions")
VOTE_DATA_FOLDER_PATH = os.path.join(BASE_DIR, "votes")
MEMBER_FILE_PATH = os.path.join(BASE_DIR, "HSall_members.json")
BILL_DATA_PATH = os.path.join(BASE_DIR, "bills")

# --- Sanity Check (Optional but Recommended) ---
# This will warn you if you forgot to fill in your .env file.
if not DB_NAME or not DB_USER or not DB_PASSWORD:
    print("WARNING: Database credentials (DB_NAME, DB_USER, DB_PASSWORD) not found in .env file.")

if not CONGRESS_GOV_API_KEY:
    print("WARNING: CONGRESS_GOV_API_KEY not found in .env file.")