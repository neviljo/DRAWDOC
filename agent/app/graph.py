from typing import Literal
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.checkpoint.base import BaseCheckpointSaver
from app.config import settings
import psycopg
from psycopg_pool import AsyncConnectionPool


class AgentState(TypedDict, total=False):
    messages: list
    doc_id: str
    doc_title: str
    workspace_id: str
    user_id: str
    intent: Literal["diagram_request", "doc_edit", "question", "general"]
    entities: dict
    diagram_plan: dict
    diagram_elements: list
    elements_written: int
    document_content: str
    edit_plan: list
    retrieved_chunks: list
    response: str
    tool_summary: str


async def route_intent(state: AgentState) -> AgentState:
    return state


async def plan_diagram(state: AgentState) -> AgentState:
    return state


async def generate_elements(state: AgentState) -> AgentState:
    return state


async def write_to_canvas(state: AgentState) -> AgentState:
    return state


async def read_document(state: AgentState) -> AgentState:
    return state


async def plan_edit(state: AgentState) -> AgentState:
    return state


async def apply_edit(state: AgentState) -> AgentState:
    return state


async def retrieve_context(state: AgentState) -> AgentState:
    return state


async def generate_answer(state: AgentState) -> AgentState:
    return state


async def chat_response(state: AgentState) -> AgentState:
    return state


def router(state: AgentState) -> str:
    if state.get("intent") == "diagram_request":
        return "plan_diagram"
    elif state.get("intent") == "doc_edit":
        return "read_document"
    elif state.get("intent") == "question":
        return "retrieve_context"
    return "chat_response"


def create_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("route_intent", route_intent)
    graph.add_node("plan_diagram", plan_diagram)
    graph.add_node("generate_elements", generate_elements)
    graph.add_node("write_to_canvas", write_to_canvas)
    graph.add_node("read_document", read_document)
    graph.add_node("plan_edit", plan_edit)
    graph.add_node("apply_edit", apply_edit)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("generate_answer", generate_answer)
    graph.add_node("chat_response", chat_response)

    graph.set_entry_point("route_intent")
    graph.add_conditional_edges("route_intent", router)
    graph.add_edge("plan_diagram", "generate_elements")
    graph.add_edge("generate_elements", "write_to_canvas")
    graph.add_edge("write_to_canvas", END)
    graph.add_edge("read_document", "plan_edit")
    graph.add_edge("plan_edit", "apply_edit")
    graph.add_edge("apply_edit", END)
    graph.add_edge("retrieve_context", "generate_answer")
    graph.add_edge("generate_answer", END)
    graph.add_edge("chat_response", END)

    return graph.compile()


async def get_checkpointer() -> BaseCheckpointSaver:
    pool = AsyncConnectionPool(settings.database_url, min_size=1, max_size=5)
    await pool.open()
    checkpointer = PostgresSaver(pool)
    await checkpointer.setup()
    return checkpointer
