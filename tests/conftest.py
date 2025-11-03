# ABOUTME: Pytest fixtures and configuration for test suite
# ABOUTME: Provides Flask app client fixture and database connection utilities

import pytest
from app.main import app as flask_app


@pytest.fixture
def app():
    """Create and configure a Flask app instance for testing."""
    flask_app.config.update({
        "TESTING": True,
    })
    yield flask_app


@pytest.fixture
def client(app):
    """Create a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test CLI runner for the Flask app."""
    return app.test_cli_runner()
