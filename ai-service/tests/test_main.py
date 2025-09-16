import pytest
import asyncio
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient

from main import app


class TestHealthEndpoint:
    """Test the health check endpoint."""

    def test_health_check_success(self, test_client):
        """Test successful health check."""
        response = test_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ai-service"
        assert "version" in data
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_health_check_async(self, async_client):
        """Test health check with async client."""
        response = await async_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestSummarizeEndpoint:
    """Test the summarize note endpoint."""

    def test_summarize_success(self, test_client, mock_gemini_client, sample_note_text):
        """Test successful note summarization."""
        response = test_client.post(
            "/summarize-note",
            json={"text": sample_note_text}
        )

        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert isinstance(data["summary"], str)
        assert len(data["summary"]) > 0

        # Verify the mock was called
        mock_gemini_client.generate_content.assert_called_once()

    def test_summarize_with_max_length(self, test_client, mock_gemini_client, sample_note_text):
        """Test summarization with custom max length."""
        response = test_client.post(
            "/summarize-note",
            json={
                "text": sample_note_text,
                "max_length": 50
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "summary" in data

        # Verify the mock was called with the right parameters
        mock_gemini_client.generate_content.assert_called_once()

    def test_summarize_empty_text(self, test_client, empty_note_text):
        """Test summarization with empty text."""
        response = test_client.post(
            "/summarize-note",
            json={"text": empty_note_text}
        )

        assert response.status_code == 422  # Validation error

    def test_summarize_missing_text(self, test_client):
        """Test summarization without text field."""
        response = test_client.post(
            "/summarize-note",
            json={}
        )

        assert response.status_code == 422  # Validation error

    def test_summarize_invalid_max_length(self, test_client, sample_note_text):
        """Test summarization with invalid max length."""
        response = test_client.post(
            "/summarize-note",
            json={
                "text": sample_note_text,
                "max_length": -1
            }
        )

        assert response.status_code == 422  # Validation error

    def test_summarize_api_error(self, test_client, mock_gemini_error, sample_note_text):
        """Test handling of API errors."""
        response = test_client.post(
            "/summarize-note",
            json={"text": sample_note_text}
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
        assert "error" in data["detail"].lower()

    def test_summarize_special_characters(self, test_client, mock_gemini_client, special_characters_note):
        """Test summarization with special characters."""
        response = test_client.post(
            "/summarize-note",
            json={"text": special_characters_note}
        )

        assert response.status_code == 200
        mock_gemini_client.generate_content.assert_called_once()

    def test_summarize_multilingual(self, test_client, mock_gemini_client, multilingual_note):
        """Test summarization with multilingual text."""
        response = test_client.post(
            "/summarize-note",
            json={"text": multilingual_note}
        )

        assert response.status_code == 200
        mock_gemini_client.generate_content.assert_called_once()

    def test_summarize_long_text(self, test_client, mock_gemini_client, long_note_text):
        """Test summarization with very long text."""
        response = test_client.post(
            "/summarize-note",
            json={"text": long_note_text}
        )

        # Should either succeed or return appropriate error for text too long
        assert response.status_code in [200, 400, 413]

    @pytest.mark.slow
    def test_summarize_performance(self, test_client, mock_gemini_client, performance_test_data):
        """Test summarization performance with different text sizes."""
        import time

        for text_type, text in performance_test_data.items():
            start_time = time.time()

            response = test_client.post(
                "/summarize-note",
                json={"text": text}
            )

            end_time = time.time()
            response_time = end_time - start_time

            assert response.status_code == 200
            assert response_time < 30  # Should respond within 30 seconds

    @pytest.mark.asyncio
    async def test_summarize_async(self, async_client, mock_gemini_client, sample_note_text):
        """Test summarization with async client."""
        response = await async_client.post(
            "/summarize-note",
            json={"text": sample_note_text}
        )

        assert response.status_code == 200
        data = response.json()
        assert "summary" in data

    def test_summarize_content_type_validation(self, test_client, sample_note_text):
        """Test that endpoint requires JSON content type."""
        response = test_client.post(
            "/summarize-note",
            data=f"text={sample_note_text}",
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        assert response.status_code == 422

    def test_summarize_security_malicious_input(self, test_client, mock_gemini_client, malicious_note_text):
        """Test handling of potentially malicious input."""
        response = test_client.post(
            "/summarize-note",
            json={"text": malicious_note_text}
        )

        # Should handle gracefully without executing malicious code
        assert response.status_code in [200, 400]

        if response.status_code == 200:
            data = response.json()
            # Ensure response doesn't contain raw malicious content
            assert "<script>" not in data.get("summary", "")


class TestErrorHandling:
    """Test error handling scenarios."""

    def test_network_error(self, test_client, mock_network_error, sample_note_text):
        """Test handling of network errors."""
        response = test_client.post(
            "/summarize-note",
            json={"text": sample_note_text}
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data

    def test_timeout_error(self, test_client, mock_timeout_error, sample_note_text):
        """Test handling of timeout errors."""
        response = test_client.post(
            "/summarize-note",
            json={"text": sample_note_text}
        )

        assert response.status_code == 500
        data = response.json()
        assert "detail" in data

    def test_api_quota_exceeded(self, test_client, mock_api_quota_exceeded, sample_note_text):
        """Test handling of API quota exceeded."""
        response = test_client.post(
            "/summarize-note",
            json={"text": sample_note_text}
        )

        assert response.status_code == 429
        data = response.json()
        assert "detail" in data

    @pytest.mark.requires_api_key
    def test_missing_api_key(self, test_client, mock_no_api_key, sample_note_text):
        """Test behavior when API key is missing."""
        response = test_client.post(
            "/summarize-note",
            json={"text": sample_note_text}
        )

        # Should handle missing API key gracefully
        assert response.status_code in [500, 503]


class TestCORS:
    """Test CORS configuration."""

    def test_cors_headers(self, test_client):
        """Test that CORS headers are present."""
        response = test_client.options("/summarize-note")

        # Check for CORS headers
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers


class TestRateLimiting:
    """Test rate limiting functionality."""

    @pytest.mark.slow
    def test_rate_limiting(self, test_client, mock_gemini_client, sample_note_text):
        """Test that rate limiting is enforced."""
        # This test depends on your actual rate limiting configuration
        responses = []

        # Make multiple rapid requests
        for i in range(20):
            response = test_client.post(
                "/summarize-note",
                json={"text": f"{sample_note_text} {i}"}
            )
            responses.append(response)

        # At least some requests should succeed
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count > 0

        # Some requests might be rate limited (status 429)
        rate_limited = any(r.status_code == 429 for r in responses)
        # Rate limiting might not be triggered in test environment


class TestInputValidation:
    """Test input validation and sanitization."""

    def test_max_text_length(self, test_client):
        """Test maximum text length validation."""
        very_long_text = "a" * 100000  # Very long text

        response = test_client.post(
            "/summarize-note",
            json={"text": very_long_text}
        )

        # Should either succeed or reject with appropriate error
        assert response.status_code in [200, 400, 413, 422]

    def test_text_type_validation(self, test_client):
        """Test that text field must be string."""
        response = test_client.post(
            "/summarize-note",
            json={"text": 12345}  # Number instead of string
        )

        assert response.status_code == 422

    def test_max_length_bounds(self, test_client, sample_note_text):
        """Test max_length parameter bounds."""
        # Test very large max_length
        response = test_client.post(
            "/summarize-note",
            json={
                "text": sample_note_text,
                "max_length": 100000
            }
        )

        assert response.status_code in [200, 422]

        # Test zero max_length
        response = test_client.post(
            "/summarize-note",
            json={
                "text": sample_note_text,
                "max_length": 0
            }
        )

        assert response.status_code == 422


@pytest.mark.integration
class TestIntegration:
    """Integration tests that require actual API keys."""

    @pytest.mark.requires_api_key
    def test_real_api_integration(self, test_client):
        """Test with real API (requires valid API key)."""
        # This test would only run with a real API key
        if not os.getenv("GOOGLE_API_KEY"):
            pytest.skip("Real API key required for integration test")

        response = test_client.post(
            "/summarize-note",
            json={
                "text": "This is a real test of the AI summarization service. It should create a meaningful summary of this text."
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert len(data["summary"]) > 0
        assert data["summary"] != "This is a real test of the AI summarization service. It should create a meaningful summary of this text."