import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

client = TestClient(app)

# Valid request body matching the current SearchRequest model
VALID_REQUEST = {
    "activities": ["Museums", "Outdoor Activities"],
    "vibes": [],
    "location": "London",
    "latitude": None,
    "longitude": None,
    "radius_miles": 5,
    "date": "today",
    "age_range": "all ages",
    "cost_range": "any",
    "free_text": None
}

MOCK_AGENT_RESULT = {
    "search_summary": "Museums in London, All ages, Any budget",
    "search_extended": False,
    "search_extended_message": None,
    "events": [],
    "venues": []
}

MOCK_VENUES_RESULT = {
    "search_summary": "Museums in London",
    "search_extended": False,
    "search_extended_message": None,
    "events": [],
    "venues": [{"name": "British Museum", "type": "venue"}]
}

MOCK_EVENTS_RESULT = {
    "search_summary": "Museums in London",
    "search_extended": False,
    "search_extended_message": None,
    "events": [{"name": "Science Workshop", "type": "event"}],
    "venues": []
}

# ---- HEALTH CHECK ----

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Halfterm backend is running"}

# ---- COMBINED SEARCH (/search) ----

def test_search_endpoint_returns_200():
    with patch('routes.search.run_agent') as mock_agent:
        mock_agent.return_value = MOCK_AGENT_RESULT
        response = client.post("/search", json=VALID_REQUEST)
        assert response.status_code == 200

def test_search_endpoint_returns_structured_result():
    with patch('routes.search.run_agent') as mock_agent:
        mock_agent.return_value = MOCK_AGENT_RESULT
        response = client.post("/search", json=VALID_REQUEST)
        data = response.json()
        assert "search_summary" in data
        assert "events" in data
        assert "venues" in data

def test_search_endpoint_returns_correct_summary():
    with patch('routes.search.run_agent') as mock_agent:
        mock_agent.return_value = MOCK_AGENT_RESULT
        response = client.post("/search", json=VALID_REQUEST)
        data = response.json()
        assert data["search_summary"] == "Museums in London, All ages, Any budget"
        assert isinstance(data["events"], list)
        assert isinstance(data["venues"], list)

def test_search_endpoint_rejects_missing_fields():
    response = client.post("/search", json={
        "activities": ["Museums"],
        "location": "London"
    })
    assert response.status_code == 422

def test_search_endpoint_handles_agent_error():
    with patch('routes.search.run_agent') as mock_agent:
        mock_agent.side_effect = Exception("Something went wrong")
        response = client.post("/search", json=VALID_REQUEST)
        assert response.status_code == 500

def test_search_endpoint_called_with_correct_arguments():
    with patch('routes.search.run_agent') as mock_agent:
        mock_agent.return_value = MOCK_AGENT_RESULT
        client.post("/search", json=VALID_REQUEST)
        call_kwargs = mock_agent.call_args.kwargs
        assert call_kwargs['activities'] == ["Museums", "Outdoor Activities"]
        assert call_kwargs['location'] == "London"
        assert call_kwargs['date'].startswith('today')
        assert call_kwargs['age_range'] == "all ages"
        assert call_kwargs['cost_range'] == "any"
        assert call_kwargs['vibes'] == []
        assert call_kwargs['latitude'] is None
        assert call_kwargs['longitude'] is None
        assert call_kwargs['radius_miles'] == 5

def test_search_endpoint_connection_error_returns_503():
    with patch('routes.search.run_agent') as mock_agent:
        mock_agent.side_effect = ConnectionError("Something went wrong")
        response = client.post("/search", json=VALID_REQUEST)
        assert response.status_code == 503

# ---- VENUES SEARCH (/search/venues) ----

def test_venues_endpoint_returns_200():
    with patch('routes.search.run_venues_search') as mock_venues:
        mock_venues.return_value = MOCK_VENUES_RESULT
        response = client.post("/search/venues", json=VALID_REQUEST)
        assert response.status_code == 200

def test_venues_endpoint_returns_venues():
    with patch('routes.search.run_venues_search') as mock_venues:
        mock_venues.return_value = MOCK_VENUES_RESULT
        response = client.post("/search/venues", json=VALID_REQUEST)
        data = response.json()
        assert "venues" in data
        assert isinstance(data["venues"], list)

def test_venues_endpoint_called_with_correct_arguments():
    with patch('routes.search.run_venues_search') as mock_venues:
        mock_venues.return_value = MOCK_VENUES_RESULT
        client.post("/search/venues", json=VALID_REQUEST)
        call_kwargs = mock_venues.call_args.kwargs
        assert call_kwargs['activities'] == ["Museums", "Outdoor Activities"]
        assert call_kwargs['location'] == "London"
        assert call_kwargs['vibes'] == []
        assert call_kwargs['radius_miles'] == 5

def test_venues_endpoint_handles_error():
    with patch('routes.search.run_venues_search') as mock_venues:
        mock_venues.side_effect = Exception("Something went wrong")
        response = client.post("/search/venues", json=VALID_REQUEST)
        assert response.status_code == 500

# ---- EVENTS SEARCH (/search/events) ----

def test_events_endpoint_returns_200():
    with patch('routes.search.run_events_search') as mock_events:
        mock_events.return_value = MOCK_EVENTS_RESULT
        response = client.post("/search/events", json=VALID_REQUEST)
        assert response.status_code == 200

def test_events_endpoint_returns_events():
    with patch('routes.search.run_events_search') as mock_events:
        mock_events.return_value = MOCK_EVENTS_RESULT
        response = client.post("/search/events", json=VALID_REQUEST)
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)

def test_events_endpoint_called_with_correct_arguments():
    with patch('routes.search.run_events_search') as mock_events:
        mock_events.return_value = MOCK_EVENTS_RESULT
        client.post("/search/events", json=VALID_REQUEST)
        call_kwargs = mock_events.call_args.kwargs
        assert call_kwargs['activities'] == ["Museums", "Outdoor Activities"]
        assert call_kwargs['location'] == "London"
        assert call_kwargs['vibes'] == []
        assert call_kwargs['radius_miles'] == 5

def test_events_endpoint_handles_error():
    with patch('routes.search.run_events_search') as mock_events:
        mock_events.side_effect = Exception("Something went wrong")
        response = client.post("/search/events", json=VALID_REQUEST)
        assert response.status_code == 500

# ---- CONTACT FORM ----

def test_contact_endpoint_returns_200():
    with patch('routes.contact.resend.Emails.send') as mock_send:
        mock_send.return_value = {"id": "test-id"}
        response = client.post("/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "Hello from the test suite"
        })
        assert response.status_code == 200

def test_contact_endpoint_returns_success():
    with patch('routes.contact.resend.Emails.send') as mock_send:
        mock_send.return_value = {"id": "test-id"}
        response = client.post("/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "Hello from the test suite"
        })
        data = response.json()
        assert data["success"] is True

def test_contact_endpoint_rejects_missing_fields():
    response = client.post("/contact", json={
        "name": "Test User"
        # missing email and message
    })
    assert response.status_code == 422

def test_contact_endpoint_handles_send_error():
    with patch('routes.contact.resend.Emails.send') as mock_send:
        mock_send.side_effect = Exception("Resend failed")
        response = client.post("/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "Hello"
        })
        assert response.status_code == 500

# ---- VIBES EXTRACTION ----

def test_vibes_values_extracted_before_agent():
    with patch('routes.search.run_agent') as mock_agent:
        mock_agent.return_value = MOCK_AGENT_RESULT
        request_with_vibes = {
            **VALID_REQUEST,
            "vibes": [
                {"label": "Accessible", "value": "accessible and inclusive for children with additional needs"},
                {"label": "Free & Low Cost", "value": "free and low cost, suitable for families on a tight budget"}
            ]
        }
        client.post("/search", json=request_with_vibes)
        call_kwargs = mock_agent.call_args.kwargs
        assert call_kwargs['vibes'] == [
            "accessible and inclusive for children with additional needs",
            "free and low cost, suitable for families on a tight budget"
        ]

# ---- AGENT UTILITY TESTS ----

def test_parse_response_valid_json():
    from agent import parse_response
    result = parse_response(
        '{"search_summary": "test", "events": [], "venues": [], "search_extended": false, "search_extended_message": null}',
        "Museums", "London"
    )
    assert result["search_summary"] == "test"
    assert result["events"] == []
    assert result["venues"] == []

def test_parse_response_with_markdown_fences():
    from agent import parse_response
    fenced = '```json\n{"search_summary": "test", "events": [], "venues": [], "search_extended": false, "search_extended_message": null}\n```'
    result = parse_response(fenced, "Museums", "London")
    assert result["search_summary"] == "test"

def test_parse_response_invalid_json_returns_error():
    from agent import parse_response
    result = parse_response("not valid json at all", "Museums", "London")
    assert result["events"] == []
    assert result["venues"] == []
    assert "error" in result

def test_inject_venue_photos_exact_match():
    from agent import inject_venue_photos
    venues = [{"name": "British Museum", "image_url": None}]
    photo_urls = {"British Museum": "https://example.com/photo.jpg"}
    result = inject_venue_photos(venues, photo_urls)
    assert result[0]["image_url"] == "https://example.com/photo.jpg"

def test_inject_venue_photos_partial_match():
    from agent import inject_venue_photos
    venues = [{"name": "The British Museum", "image_url": None}]
    photo_urls = {"British Museum": "https://example.com/photo.jpg"}
    result = inject_venue_photos(venues, photo_urls)
    assert result[0]["image_url"] == "https://example.com/photo.jpg"

def test_inject_venue_photos_no_match_leaves_none():
    from agent import inject_venue_photos
    venues = [{"name": "Unknown Venue", "image_url": None}]
    photo_urls = {"British Museum": "https://example.com/photo.jpg"}
    result = inject_venue_photos(venues, photo_urls)
    assert result[0]["image_url"] is None

def test_inject_venue_photos_empty_dict():
    from agent import inject_venue_photos
    venues = [{"name": "British Museum", "image_url": None}]
    result = inject_venue_photos(venues, {})
    assert result[0]["image_url"] is None

# ---- CATEGORY STRATEGY TESTS ----

def test_get_strategy_museums_skips_skiddle():
    from agent import get_strategy
    strategy = get_strategy(["Museums"])
    assert strategy["use_google_places"] is True
    assert strategy["use_skiddle"] is False

def test_get_strategy_theatre_uses_google_places():
    from agent import get_strategy
    strategy = get_strategy(["Theatre and Shows"])
    assert strategy["use_google_places"] is True
    assert strategy["use_skiddle"] is True

def test_get_strategy_community_skips_ticketmaster():
    from agent import get_strategy
    strategy = get_strategy(["Community"])
    assert strategy["use_ticketmaster"] is False
    assert strategy["use_google_places"] is False
    assert strategy["use_eventbrite"] is True

def test_get_strategy_fairs_skips_ticketmaster():
    from agent import get_strategy
    strategy = get_strategy(["Fairs and Festivals"])
    assert strategy["use_ticketmaster"] is False
    assert strategy["use_skiddle"] is True

def test_get_strategy_unknown_category_uses_all_sources():
    from agent import get_strategy
    strategy = get_strategy(["Unknown Category"])
    assert strategy["use_google_places"] is True
    assert strategy["use_ticketmaster"] is True
    assert strategy["use_eventbrite"] is True
    assert strategy["use_skiddle"] is True

def test_get_strategy_empty_activities_uses_all_sources():
    from agent import get_strategy
    strategy = get_strategy([])
    assert strategy["use_google_places"] is True
    assert strategy["use_ticketmaster"] is True

# ---- DATE RESOLVER TESTS ----

def test_date_resolver_today():
    from utils.date_resolver import resolve_date
    result = resolve_date("today")
    assert result.startswith("today (")

def test_date_resolver_tomorrow():
    from utils.date_resolver import resolve_date
    result = resolve_date("tomorrow")
    assert result.startswith("tomorrow (")

def test_date_resolver_this_weekend():
    from utils.date_resolver import resolve_date
    result = resolve_date("this weekend")
    assert "this weekend" in result or "Saturday" in result

def test_date_resolver_next_week():
    from utils.date_resolver import resolve_date
    result = resolve_date("next week")
    assert "next week" in result or "Monday" in result

def test_date_resolver_unknown_input_returned_unchanged():
    from utils.date_resolver import resolve_date
    result = resolve_date("some unknown date string")
    assert result == "some unknown date string"
