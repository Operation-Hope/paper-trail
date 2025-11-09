## Local dev set up instructions

### Prerequisites

- Python 3.13 or higher
- PostgreSQL database server (install via [PostgreSQL downloads](https://www.postgresql.org/download/) or use Docker)

### Setup Steps

1. **Create and activate virtual environment**

   ```bash
   python -m venv env
   ```

   **Linux/mac:**
   ```bash
   source env/bin/activate
   ```

   **Windows:**
   ```bash
   source env/Scripts/activate
   ```

2. **Install requirements**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   
   Copy `.dev.env` to `.env` and update with your local database credentials:
   ```bash
   cp .dev.env .env
   ```
   
   Edit `.env` and update these values:
   - `DB_HOST`: Your PostgreSQL host (use `localhost` for local development)
   - `DB_PORT`: PostgreSQL port (default: `5432`)
   - `DB_NAME`: Your development database name (e.g., `paper_trail_dev`)
   - `DB_USER`: Your PostgreSQL username (often your system username for local PostgreSQL)
   - `DB_PASSWORD`: Your PostgreSQL password (can be empty for local PostgreSQL with peer authentication)
   - `CONGRESS_GOV_API_KEY`: Your Congress.gov API key (optional for basic functionality)

4. **Launch application**
   ```bash
   python -m app.main
   ```

## Running Tests

The project uses [pytest](https://docs.pytest.org/) for testing. The test suite includes comprehensive unit tests for all API endpoints, with fixtures for database setup and test data seeding.

### Prerequisites for Testing

Before running tests, you need:

1. A PostgreSQL database server running (same as for development)
2. Your `.env` file configured with database credentials (the test database will be created automatically)
3. Your database user must have permissions to create databases (required for automatic test database creation)

The test suite will automatically:
- Create a test database named `paper_trail_test` if it doesn't exist
- Restore the database schema from `bin/pg-dump.tar.bz2` (schema only, no data)
- Seed test data before each test
- Clean up data between tests to ensure isolation

### Running the Tests

With your virtual environment activated and requirements installed:

```bash
# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run tests for a specific file
pytest tests/test_api_bills.py

# Run a specific test class or function
pytest tests/test_api_bills.py::TestBillSubjects::test_get_subjects_returns_list

# Run tests with coverage report
pytest --cov=app --cov-report=html

# Run tests and show print statements
pytest -s
```

### Test Structure

The test suite is organized as follows:

```
tests/
├── conftest.py              # Pytest configuration and fixtures
├── fixtures/
│   └── seed_data.py        # Test data seeding functions
├── test_api_bills.py       # Tests for /api/bills endpoints
├── test_api_donations.py   # Tests for /api/donations endpoints
├── test_api_donors.py      # Tests for /api/donors endpoints
├── test_api_politicians.py # Tests for /api/politicians endpoints
└── test_api_votes.py       # Tests for /api/votes endpoints
```

### Key Test Fixtures

The test suite provides several pytest fixtures (defined in `conftest.py`):

- `client`: A Flask test client for making API requests
- `db_connection`: A database connection for direct database operations
- `seed_test_data`: Automatically seeds comprehensive test data before each test
- `clean_db`: Automatically cleans all tables between tests for isolation
- `setup_test_db`: Creates the test database schema once per test session

### Test Database Safety

The test suite includes multiple safety checks to prevent accidentally running tests against production data:

- Tests automatically use a separate database named `paper_trail_test`
- The `TESTING` environment variable is set to force test database usage
- Runtime checks verify the correct database is being used before tests run

### Troubleshooting Tests

If tests fail to run:

1. Ensure PostgreSQL is running and accessible
2. Verify your `.env` file has correct database credentials
3. Make sure your database user has permissions to create databases (required for automatic test database creation)
4. Check that the `bin/pg-dump.tar.bz2` file exists and is valid
5. Try running tests with `-v` flag for more detailed output

### Pod Containers for deployment

```bash
echo "paper-trail build image"
podman build -t paper-trail -f Dockerfile

echo "Create pod pod-paper-trail"
podman pod create -p 5000:5000 --name=pod-paper-trail \
&& \
podman pod start pod-paper-trail

# untar the pg_dump.tar.bz2 file before mounting it to the pg container.
podman run -d --pod=pod-paper-trail \
    --name=paper_trail_db \
    -v paper-trail-data:/var/lib/postgresql/data \
    -v ./bin/paper-trail-dump:/paper-trail-dump:ro \ 
    --secret DB_NAME,type=env,target=POSTGRES_DB \
    --secret DB_HOST,type=env,target=POSTGRES_SERVER \
    --secret DB_PORT,type=env,target=POSTGRES_PORT \
    --secret DB_USER,type=env,target=POSTGRES_USER \
    --secret DB_PASSWORD,type=env,target=POSTGRES_PASSWORD \
    docker.io/postgres:latest


# -p 5000:5000 only needed when local container used, otherwise pod exposes it above. 
podman run --rm -d --pod=pod-paper-trail --name=paper-trail \
    --secret DB_NAME,type=env,target=DB_NAME \
    --secret DB_HOST,type=env,target=DB_HOST \
    --secret DB_PORT,type=env,target=DB_PORT \
    --secret DB_USER,type=env,target=DB_USER \
    --secret DB_PASSWORD,type=env,target=DB_PASSWORD \
    paper-trail

```

Restore db:

```
cd bin
tar -xvf pg-dump.tar.bz2 
```

This will give you the dump file paper-trail-dump which you can then copy to your postgres db. If using a container, you can copy it into the container then then restore `psql postres < paper-trail-dump` 
