import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

# TestClient wraps our FastAPI app and lets us make
# HTTP requests without running a real server
client = TestClient(app)

# Valid request body matching the new SearchRequest model
# Used across multiple tests to avoid repetition
VALID_REQUEST = {
    "activities": ["Museums", "Outdoor Activities"],
    "location": "London",
    "date": "today",
    "age_range": "all ages",
    "cost_range": "any cost"
}

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
    with patch('main.run_agent') as mock_agent:
        mock_agent.return_value = "Some museum activities for kids"

        response = client.post("/search", json=VALID_REQUEST)

        assert response.status_code == 200

def test_search_endpoint_returns_result():
    with patch('main.run_agent') as mock_agent:
        # run_agent now returns a structured dict not a string
        mock_agent.return_value = {
            "search_summary": "Museums in London",
            "events": [],
            "venues": []
        }

        response = client.post("/search", json=VALID_REQUEST)
        data = response.json()

        # Assert the response has the new structured fields
        assert "search_summary" in data
        assert "events" in data
        assert "venues" in data

def test_search_endpoint_returns_correct_result():
    with patch('main.run_agent') as mock_agent:
        # Set a specific structured return value so we can assert exactly what comes back
        mock_agent.return_value = {
            "search_summary": "Museums in London, All ages, Any budget",
            "events": [],
            "venues": []
        }

        response = client.post("/search", json=VALID_REQUEST)
        data = response.json()

        # Assert the search summary matches exactly what our mock returned
        assert data["search_summary"] == "Museums in London, All ages, Any budget"
        assert isinstance(data["events"], list)
        assert isinstance(data["venues"], list)

def test_search_endpoint_rejects_missing_fields():
    # Send an incomplete request — missing required fields
    # FastAPI should reject this with a 422 status code
    response = client.post("/search", json={
        "activities": ["Museums"],
        "location": "London"
        # missing date, age_range, cost_range
    })

    # 422 means the request was rejected due to validation failure
    assert response.status_code == 422

def test_search_endpoint_handles_agent_error():
    with patch('main.run_agent') as mock_agent:
        # Make the fake run_agent throw an exception
        # This simulates something going wrong inside the agent
        mock_agent.side_effect = Exception("Something went wrong")

        response = client.post("/search", json=VALID_REQUEST)

        # Our error handling should catch this and return 500
        assert response.status_code == 500

def test_search_endpoint_called_with_correct_arguments():
    with patch('main.run_agent') as mock_agent:
        mock_agent.return_value = "Some results"

        client.post("/search", json=VALID_REQUEST)

        # Assert run_agent was called with the correct keyword arguments
        # Note: date is resolved before reaching run_agent so we check
        # that it starts with 'today' rather than an exact match
        # since the exact date changes daily
        call_kwargs = mock_agent.call_args.kwargs
        assert call_kwargs['activities'] == ["Museums", "Outdoor Activities"]
        assert call_kwargs['location'] == "London"
        assert call_kwargs['date'].startswith('today')
        assert call_kwargs['age_range'] == "all ages"
        assert call_kwargs['cost_range'] == "any cost"

def test_ConnectionError_runs_as_expected():
    with patch('main.run_agent') as mock_agent:
        mock_agent.side_effect = ConnectionError("Something went wrong")

        response = client.post("/search", json=VALID_REQUEST)
        data = response.json()

        assert response.status_code == 503
        assert data["detail"] == "Could not connect to external services. Please try again shortly."