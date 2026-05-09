from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from tools import search_ticketmaster_events, search_google_places, search_eventbrite_events
import os

# Load environment variables from .env file before anything else runs
load_dotenv()

# ---- THE MODEL ----
# This creates our connection to Claude
# temperature=0 keeps responses consistent and factual rather than creative
# api_key reads the Anthropic API key from the .env file
llm = ChatAnthropic(
    model="claude-opus-4-5",
    temperature=0,
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# ---- THE TOOLS ----
# Tools are now in their own files under backend/tools/
# search_ticketmaster_events — finds live family events via Ticketmaster API
# search_google_places — finds venue information via Google Places API
# search_eventbrite_events — finds additional family events via Eventbrite API
tools = [search_ticketmaster_events, search_google_places, search_eventbrite_events]

# ---- THE AGENT ----
# create_react_agent wires together the LLM and tools
# The agent uses the ReAct pattern — Reason, Act, Observe, repeat
# It reads the tool docstrings to decide which tools to call
agent_executor = create_react_agent(llm, tools)

# ---- THE RUN FUNCTION ----
# This is the public interface of the agent — the only function main.py calls
# It takes the search parameters, builds a detailed query, runs the agent
# and returns Claude's final formatted response
def run_agent(activities: list[str], location: str, date: str, age_range: str, cost_range: str) -> str:
    # Join activities list into a readable string
    # e.g. ["Museums", "Outdoor"] becomes "Museums, Outdoor"
    activities_str = ", ".join(activities) if activities else "family activities"

    # Build a detailed structured query from all five parameters
    # Each parameter is clearly labelled so Claude can use them precisely
    query = f"""
    Find activities for kids in {location}.

    Search criteria:
    - Activities: {activities_str}
    - Date: {date}
    - Age range: {age_range}
    - Budget: {cost_range}

    Please follow these instructions carefully:
    - Search for both live events and venue information
    - Only suggest activities suitable for ages {age_range}
    - Only suggest activities within the budget: {cost_range}
    - Present results in a clear friendly format for families
    - For each result include: name, location, cost, and why it's good for kids
    - If you cannot find results matching all criteria say so clearly and suggest alternatives
    - Always include booking links or website URLs where available
    """

    # Invoke the agent with the structured query
    result = agent_executor.invoke({"messages": [("human", query)]})

    # Return Claude's final formatted response
    return result["messages"][-1].content