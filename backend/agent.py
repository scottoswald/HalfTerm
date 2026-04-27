from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
import os

# Load environment variables from .env file before anything else runs
load_dotenv()

# ---- THE MODEL ----
# This creates our connection to Claude
# model= specifies which version of Claude to use
# temperature= controls how creative/random the responses are
# 0 = focused and consistent, 1 = more creative and varied
# For factual search results we want 0 — consistent and accurate
llm = ChatAnthropic(
    model="claude-opus-4-5",
    temperature=0,
    api_key=os.getenv("ANTHROPIC_API_KEY")
)

# ---- THE TOOLS ----
# Tools are functions the agent can choose to call during its reasoning
# The @tool decorator tells LangChain "this function is a tool the agent can use"
# The docstring (the text in triple quotes) is what the agent reads to 
# understand what the tool does and when to use it
@tool
def search_london_museum_events(query: str) -> str:
    """
    Search for kids activities and events happening today at museums in London.
    Use this tool when the user wants to find museum activities for children in London.
    Returns a list of relevant activities and events.
    """
    # For now this is a placeholder — we'll connect real API data here later
    # For now it returns hardcoded dummy data so we can test the agent works
    return """
    Here are some kids activities at London museums today:
    
    1. Science Museum — 'Wonderlab' interactive science sessions for kids aged 7-14. 
       Free with museum entry. Running all day.
    
    2. Natural History Museum — Dinosaur gallery explorer trail for families. 
       Pick up a trail map at the entrance. Free.
    
    3. Victoria & Albert Museum — Sunday craft workshops for children aged 5-12. 
       11am and 2pm sessions. Free.
    """

# Collect all tools into a list
# We only have one tool for now but this list will grow as we add more
tools = [search_london_museum_events]

# ---- THE AGENT ----
# create_react_agent is the modern LangGraph way of creating an agent
# It wires together the LLM and tools in one step
agent_executor = create_react_agent(llm, tools)

# ---- THE RUN FUNCTION ----
# This is what we'll call from main.py when the frontend makes a search request
# It takes the user's search and passes it to the agent
def run_agent(activity: str, location: str, when: str) -> str:
    # Build a natural language query from the three search parameters
    query = f"Find {activity} activities for kids in {location} {when}"
    
    # Invoke the agent with the query
    # The agent will reason through which tools to use and return a response
    result = agent_executor.invoke({"messages": [("human", query)]})
    
    # The response lives in the last message in the messages list
    return result["messages"][-1].content