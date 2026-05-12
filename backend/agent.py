from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from tools import search_ticketmaster_events, search_google_places, search_eventbrite_events
import os

# Load environment variables from .env file before anything else runs
# This ensures API keys are available when the model is initialised
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
# Tools are defined in their own files under backend/tools/
# search_ticketmaster_events — finds live ticketed events via Ticketmaster API
# search_google_places — finds permanent venues via Google Places API
# search_eventbrite_events — finds community events and workshops via Eventbrite API
# Claude reads each tool's docstring to decide when and how to use it
tools = [search_ticketmaster_events, search_google_places, search_eventbrite_events]

# ---- THE AGENT ----
# create_react_agent wires together the LLM and tools
# The agent uses the ReAct pattern — Reason, Act, Observe, repeat
# It reads the tool docstrings to decide which tools to call and when
agent_executor = create_react_agent(llm, tools)

# ---- THE RUN FUNCTION ----
# This is the public interface of the agent — the only function main.py calls
# It takes all five search parameters and builds a detailed query for Claude
def run_agent(activities: list[str], location: str, date: str, age_range: str, cost_range: str) -> str:
    # Join activities list into a readable string
    # e.g. ["Museums", "Outdoor Activities"] becomes "Museums, Outdoor Activities"
    activities_str = ", ".join(activities) if activities else "family activities"

    # Build a detailed structured query from all five parameters
    # We explicitly tell Claude which parameters to pass to each tool
    # This ensures date filtering works correctly across all three APIs
    query = f"""
    Find activities for kids in {location}.

    Search criteria:
    - Activities: {activities_str}
    - Date: {date}
    - Age range: {age_range}
    - Budget: {cost_range}

    Please follow these instructions carefully:
    - Search for both live events and venue information
    - When calling search_ticketmaster_events, pass location="{location}" and date="{date}"
    - When calling search_eventbrite_events, pass location="{location}", query="{activities_str}" and date="{date}"
    - When calling search_google_places, pass query="{activities_str}" and location="{location}"
    - Only suggest activities suitable for ages {age_range}
    - Only suggest activities within the budget: {cost_range}
    - Present results in a clear friendly format for families
    - For each result include: name, location, cost, and why it is good for kids
    - If you cannot find results matching all criteria say so clearly and suggest alternatives
    - Always include booking links or website URLs where available
    """

    # Invoke the agent with the structured query
    # The agent will reason through which tools to use and return a response
    result = agent_executor.invoke({"messages": [("human", query)]})

    # Return the last message which is Claude's final formatted response
    return result["messages"][-1].content