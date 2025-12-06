import asyncio
import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

# Import the main app
from main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client():
    """Create an async test client for the FastAPI app using ASGITransport (httpx >=0.28)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_gemini_client():
    """Mock the Google Gemini AI client."""
    with patch("google.generativeai.GenerativeModel") as mock_model:
        mock_instance = MagicMock()
        mock_model.return_value = mock_instance

        # Mock the generate_content method
        mock_response = MagicMock()
        mock_response.text = "This is a test summary of the provided note content."
        mock_instance.generate_content.return_value = mock_response

        yield mock_instance


@pytest.fixture
def mock_gemini_error():
    """Mock a failed Gemini AI response."""
    with patch("google.generativeai.GenerativeModel") as mock_model:
        mock_instance = MagicMock()
        mock_model.return_value = mock_instance

        # Mock a failed response
        mock_instance.generate_content.side_effect = Exception("API Error")

        yield mock_instance


@pytest.fixture
def mock_api_key():
    """Mock the Google API key."""
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "test-api-key"}):
        yield "test-api-key"


@pytest.fixture
def mock_no_api_key():
    """Mock missing API key."""
    with patch.dict(os.environ, {}, clear=True):
        yield


@pytest.fixture
def sample_note_text():
    """Provide sample note text for testing."""
    return """
    This is a comprehensive note about machine learning fundamentals.
    Machine learning is a subset of artificial intelligence that focuses on algorithms
    that can learn from and make predictions or decisions based on data.

    Key concepts include:
    - Supervised learning: learning with labeled data
    - Unsupervised learning: finding patterns in unlabeled data
    - Reinforcement learning: learning through interaction with environment

    Common algorithms include linear regression, decision trees, neural networks,
    and support vector machines. The field has applications in many domains
    including computer vision, natural language processing, and robotics.
    """


@pytest.fixture
def long_note_text():
    """Provide long note text for testing token limits."""
    return "This is a very long note. " * 1000  # Simulate a very long note


@pytest.fixture
def empty_note_text():
    """Provide empty note text for testing edge cases."""
    return ""


@pytest.fixture
def special_characters_note():
    """Provide note text with special characters for testing."""
    return """
    Note with special characters:
    - Emojis: 📚📖📝✍️
    - Unicode: αβγδε ñáéíóú
    - Symbols: @#$%^&*()
    - Code: `console.log("Hello, World!");`
    - Math: ∑∆∞≈≠±
    """


@pytest.fixture
def multilingual_note():
    """Provide multilingual note text for testing."""
    return """
    English: This is a note about learning.
    Spanish: Esta es una nota sobre el aprendizaje.
    French: Ceci est une note sur l'apprentissage.
    German: Dies ist eine Notiz über das Lernen.
    Chinese: 这是一篇关于学习的笔记。
    """


@pytest.fixture
def malicious_note_text():
    """Provide potentially malicious note text for security testing."""
    return """
    <script>alert('xss')</script>
    '; DROP TABLE notes; --
    ../../../etc/passwd
    ${7*7}
    """


@pytest.fixture
def valid_summarize_request():
    """Provide a valid summarize request payload."""
    return {
        "text": "This is a note about Python programming. Python is a high-level programming language known for its simplicity and readability.",
        "max_length": 100,
    }


@pytest.fixture
def invalid_summarize_request():
    """Provide an invalid summarize request payload."""
    return {"text": "", "max_length": -1}  # Empty text  # Invalid length


@pytest.fixture
def mock_rate_limiter():
    """Mock rate limiting for testing."""
    with patch("slowapi.Limiter") as mock_limiter:
        yield mock_limiter


# Health check fixtures
@pytest.fixture
def health_check_response():
    """Expected health check response."""
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0",
        "timestamp": pytest.approx(1000000000, abs=1000000000),  # Flexible timestamp
    }


# Performance testing fixtures
@pytest.fixture
def performance_test_data():
    """Provide data for performance testing."""
    return {
        "small_text": "Short note.",
        "medium_text": "This is a medium-length note about testing. " * 10,
        "large_text": "This is a large note for performance testing. " * 100,
    }


# Error simulation fixtures
@pytest.fixture
def mock_network_error():
    """Mock network error for testing."""
    with patch("google.generativeai.GenerativeModel") as mock_model:
        mock_instance = MagicMock()
        mock_model.return_value = mock_instance
        mock_instance.generate_content.side_effect = ConnectionError("Network error")
        yield mock_instance


@pytest.fixture
def mock_timeout_error():
    """Mock timeout error for testing."""
    with patch("google.generativeai.GenerativeModel") as mock_model:
        mock_instance = MagicMock()
        mock_model.return_value = mock_instance
        mock_instance.generate_content.side_effect = asyncio.TimeoutError(
            "Request timeout"
        )
        yield mock_instance


@pytest.fixture
def mock_api_quota_exceeded():
    """Mock API quota exceeded error."""
    with patch("google.generativeai.GenerativeModel") as mock_model:
        mock_instance = MagicMock()
        mock_model.return_value = mock_instance

        error = Exception("Quota exceeded")
        error.code = 429
        mock_instance.generate_content.side_effect = error
        yield mock_instance


# Database and cache fixtures (if needed in the future)
@pytest.fixture
def mock_redis():
    """Mock Redis cache for testing."""
    with patch("redis.Redis") as mock_redis:
        mock_instance = MagicMock()
        mock_redis.return_value = mock_instance
        mock_instance.get.return_value = None
        mock_instance.set.return_value = True
        yield mock_instance


# Configuration fixtures
@pytest.fixture
def test_config():
    """Provide test configuration."""
    return {
        "google_api_key": "test-api-key",
        "max_tokens": 1000,
        "timeout": 30,
        "rate_limit": "10/minute",
    }


# Cleanup fixture
@pytest.fixture(autouse=True)
def cleanup_env():
    """Clean up environment after each test."""
    yield
    # Clean up any test artifacts
    pass


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line(
        "markers", "requires_api_key: mark test as requiring API key"
    )
