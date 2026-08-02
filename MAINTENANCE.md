# Halfterm — Maintenance Checklist

A regular checklist to keep Halfterm healthy in production.
Run through this at least once a month, or after any significant change.

---

## Weekly (5 minutes)

### Costs
- [ ] Check Anthropic API credit balance at https://console.anthropic.com
      → Top up if below $5. Auto-reload should handle this but verify.
- [ ] Check Railway usage at https://railway.com/dashboard
      → Flag if monthly spend is tracking above $15

### Health
- [ ] Do a test search on https://halfterm.up.railway.app
      → Museums in London, today
      → Confirm venues load within 10 seconds
      → Confirm at least 3 results appear
- [ ] Check GitHub Actions at https://github.com/scottoswald/HalfTerm/actions
      → Confirm latest CI/CD run is green

---

## Monthly (15 minutes)

### Costs review
- [ ] Anthropic API — check monthly spend vs previous month
- [ ] Railway — check monthly invoice
- [ ] Google Cloud — check Places API usage and remaining credit
      → Go to https://console.cloud.google.com → Billing
      → Alert if credit drops below £100
- [ ] LangSmith — check trace volume, confirm still on free tier

### API health checks
Run each of these and confirm results come back:

```bash
cd backend && source venv/bin/activate

# Google Places
python -c "
from dotenv import load_dotenv; load_dotenv()
from tools.google_places import search_google_places_with_photos
result, photos = search_google_places_with_photos('family museums', 'London')
print('Google Places:', 'OK' if result else 'FAILED')
print('Photos:', len(photos), 'found')
"

# Ticketmaster
python -c "
from dotenv import load_dotenv; load_dotenv()
from tools.ticketmaster import search_ticketmaster_events
result = search_ticketmaster_events.invoke({'location': 'London', 'date': 'this weekend', 'latitude': None, 'longitude': None, 'radius_miles': 5, 'category': None})
print('Ticketmaster:', 'OK' if result else 'FAILED')
"

# Skiddle
python -c "
from dotenv import load_dotenv; load_dotenv()
from tools.skiddle import search_skiddle_events
result = search_skiddle_events.invoke({'query': 'family', 'location': 'London', 'date': 'this weekend', 'latitude': None, 'longitude': None, 'radius_miles': 5, 'category': None})
print('Skiddle:', 'OK' if result else 'FAILED')
"
```

### Test suite
```bash
# Backend
cd backend && source venv/bin/activate && python -m pytest tests/ -v

# Frontend
cd frontend && npx vitest run
```
→ All tests should pass. Investigate any failures immediately.

### LangSmith review
- [ ] Go to https://eu.smith.langchain.com
- [ ] Check the halfterm project for any error traces
- [ ] Look for patterns — are certain categories failing?
- [ ] Check average latency — flag if venues search > 15s or events > 35s
- [ ] Check token usage — flag if any single call exceeds 2000 tokens

### Dependency updates
- [ ] Check for Python dependency updates:
      ```bash
      cd backend && pip list --outdated
      ```
- [ ] Check for npm dependency updates:
      ```bash
      cd frontend && npm outdated
      ```
- [ ] Update dependencies carefully — test after each update

---

## Quarterly (30 minutes)

### API key rotation
- [ ] Rotate Anthropic API key
- [ ] Rotate Google Places API keys (frontend + backend)
- [ ] Rotate Skiddle API key
- [ ] Rotate Resend API key
- [ ] Update all keys in Railway environment variables
- [ ] Update all keys in local .env
- [ ] Redeploy Railway after key rotation
- [ ] Run test search to confirm everything still works

### Security review
- [ ] Check that .env is in .gitignore and never committed
- [ ] Confirm API keys are not exposed in frontend bundle
      → Open https://halfterm.up.railway.app, view source, search for key patterns
- [ ] Review Railway environment variables — remove any unused ones
- [ ] Check Google Cloud API key restrictions are still correct
      → Backend key: IP restricted to Railway IPs
      → Frontend key: HTTP referrer restricted to halfterm domains

### Performance review
- [ ] Check LangSmith for p95 latency over the past month
- [ ] Check Railway metrics for memory/CPU usage
- [ ] Review Google Places API quota usage in Google Cloud Console
- [ ] Check Ticketmaster rate limit hits in LangSmith traces

### Content review
- [ ] Do a test search for each of the 16 categories in London
- [ ] Note any categories returning 0 results
- [ ] Note any categories returning irrelevant results
- [ ] Update CATEGORY_STRATEGY in agent.py if needed

---

## After any deployment

- [ ] Do a test search immediately after deploying
- [ ] Check Railway deployment logs for errors
- [ ] Check LangSmith for any new error traces
- [ ] Confirm CI/CD pipeline passed

---

## Environment variables reference

### Backend (Railway + .env)
```
ANTHROPIC_API_KEY
GOOGLE_PLACES_API_KEY_BACKEND
TICKETMASTER_API_KEY
EVENTBRITE_API_KEY
SKIDDLE_API_KEY
RESEND_API_KEY
CONTACT_EMAIL
LANGCHAIN_TRACING_V2
LANGCHAIN_API_KEY
LANGCHAIN_PROJECT
LANGCHAIN_ENDPOINT
LANGSMITH_TRACING
LANGSMITH_API_KEY
LANGSMITH_PROJECT
LANGSMITH_ENDPOINT
```

### Frontend (Railway + .env)
```
VITE_BACKEND_URL
VITE_GOOGLE_PLACES_API_KEY
```

---

## Useful links

| Service | URL |
|---------|-----|
| Live app | https://halfterm.up.railway.app |
| Railway dashboard | https://railway.com/dashboard |
| Anthropic console | https://console.anthropic.com |
| Google Cloud console | https://console.cloud.google.com |
| LangSmith | https://eu.smith.langchain.com |
| GitHub repo | https://github.com/scottoswald/HalfTerm |
| GitHub Actions | https://github.com/scottoswald/HalfTerm/actions |
| Skiddle API | https://www.skiddle.com/api/ |
| Resend dashboard | https://resend.com/emails |

---

*Last updated: August 2026*
