from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from tools import search_ticketmaster_events, search_google_places
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
# Importing them here keeps agent.py clean and focused on wiring things together
tools = [search_ticketmaster_events, search_google_places]

# ---- THE AGENT ----
# create_react_agent wires together the LLM and tools
# The agent uses the ReAct pattern — Reason, Act, Observe, repeat
# It reads the tool docstrings to decide which tools to call
agent_executor = create_react_agent(llm, tools)

# ---- THE RUN FUNCTION ----
# This is the public interface of the agent — the only function main.py calls
# It takes the search parameters, builds a detailed query, runs the agent
# and returns Claude's final formatted response
def run_agent(activity: str, location: str, when: str) -> str:
    # Build a detailed natural language query from all search parameters
    # The more context we give the agent the better it can filter results
    query = f"""
    Find {activity} activities for kids in {location} {when}.
    
    Please follow these instructions carefully:
    - Search for both live events and venue information
    - Filter results to match the specified criteria in: {when}
    - For age range: only suggest activities suitable for the specified age group
    - For budget: only suggest activities within the specified cost range
    - Present results in a clear, friendly format for families
    - For each result include: name, location, cost if known, and why it's good for kids
    - If you cannot find results matching all criteria, say so clearly and suggest alternatives
    - Always include booking links or website URLs where available
    """

    # Invoke the agent with the detailed query
    # The agent will reason through which tools to use and return a response
    result = agent_executor.invoke({"messages": [("human", query)]})

    # Return the last message which is Claude's final formatted response
    return result["messages"][-1].content