import pytest
from fastapi.testclient import TestClient
from main import app

# TestClient is a special FastAPI tool that lets us make 
# HTTP requests to our app without running a real server
# It simulates the server in memory during tests
client = TestClient(app)

# ---- HEALTH CHECK TESTS ----
def test_root_endpoint():
    # Make a GET request to the root endpoint
    response = client.get("/")
    
    # Assert the status code is 200 (success)
    # If this fails, pytest will tell us exactly what it got instead
    assert response.status_code == 200
    
    # Assert the response contains our expected message
    assert response.json() == {"message": "Halfterm backend is running"}

# ---- SEARCH ENDPOINT TESTS ----
def test_search_endpoint_returns_200():
    # Make a POST request to /search with valid data
    response = client.post("/search", json={
        "activity": "Museum",
        "location": "London",
        "when": "today"
    })
    
    # Assert the request succeeded
    assert response.status_code == 200

def test_search_endpoint_returns_result():
    # Make a POST request and check the response contains a result field
    response = client.post("/search", json={
        "activity": "Museum",
        "location": "London",
        "when": "today"
    })
    
    data = response.json()
    
    # Assert the response has a result field
    assert "result" in data
    
    # Assert the result is a non-empty string
    assert isinstance(data["result"], str)
    assert len(data["result"]) > 0

def test_search_endpoint_rejects_missing_fields():
    # Send an incomplete request — missing the 'when' field
    # FastAPI should reject this with a 422 status code (Unprocessable Entity)
    response = client.post("/search", json={
        "activity": "Museum",
        "location": "London"
    })
    
    # 422 means the request was rejected due to validation failure
    # This confirms our SearchRequest model is working correctly
    assert response.status_code == 422