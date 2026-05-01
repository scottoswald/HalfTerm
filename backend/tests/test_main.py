import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

# TestClient wraps our FastAPI app and lets us make
# HTTP requests without running a real server
client = TestClient(app)

# ---- HEALTH CHECK TESTS ----

def test_root_endpoint():
    # Make a GET request to the root endpoint
    response = client.get("/")

    # Assert the status code is 200 (success)
    assert response.status_code == 200

    # Assert the response contains our expected message
    assert response.json() == {"message": "Halfterm backend is running"}

# ---- SEARCH ENDPOINT TESTS ----

def test_search_endpoint_returns_200():
    # patch() temporarily replaces run_agent with a fake version
    # This means the test never makes a real API call to Claude
    # 'main.run_agent' means "the run_agent function as imported in main.py"
    with patch('main.run_agent') as mock_agent:
        # Configure the fake run_agent to return a predictable string
        mock_agent.return_value = "Some museum activities for kids"

        response = client.post("/search", json={
            "activity": "Museum",
            "location": "London",
            "when": "today"
        })

        assert response.status_code == 200

def test_search_endpoint_returns_result():
    with patch('main.run_agent') as mock_agent:
        mock_agent.return_value = "Some museum activities for kids"

        response = client.post("/search", json={
            "activity": "Museum",
            "location": "London",
            "when": "today"
        })

        data = response.json()

        # Assert the response has a result field
        assert "result" in data

        # Assert the result is a non empty string
        assert isinstance(data["result"], str)
        assert len(data["result"]) > 0

def test_search_endpoint_returns_correct_result():
    with patch('main.run_agent') as mock_agent:
        # Set a specific return value so we can assert exactly what comes back
        mock_agent.return_value = "Science Museum activities for kids"

        response = client.post("/search", json={
            "activity": "Museum",
            "location": "London",
            "when": "today"
        })

        data = response.json()

        # Assert the result matches exactly what our mock returned
        assert data["result"] == "Science Museum activities for kids"

def test_search_endpoint_rejects_missing_fields():
    # Send an incomplete request — missing the 'when' field
    # FastAPI should reject this with a 422 status code
    response = client.post("/search", json={
        "activity": "Museum",
        "location": "London"
    })

    # 422 means the request was rejected due to validation failure
    assert response.status_code == 422

def test_search_endpoint_handles_agent_error():
    with patch('main.run_agent') as mock_agent:
        # Make the fake run_agent throw an exception
        # This simulates something going wrong inside the agent
        mock_agent.side_effect = Exception("Something went wrong")

        response = client.post("/search", json={
            "activity": "Museum",
            "location": "London",
            "when": "today"
        })

        # Our error handling in main.py should catch this
        # and return a 500 status code instead of crashing
        assert response.status_code == 500

def test_search_endpoint_called_with_correct_arguments():
    with patch('main.run_agent') as mock_agent:
        mock_agent.return_value = "Some results"

        client.post("/search", json={
            "activity": "Museum",
            "location": "London",
            "when": "today"
        })

        # assert_called_once_with checks that run_agent was called
        # exactly once with exactly these three arguments
        # This confirms main.py is passing the right data to the agent
        mock_agent.assert_called_once_with("Museum", "London", "today")