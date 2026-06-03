import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.graph import create_graph

router = APIRouter(prefix="/agent", tags=["agent"])


class ChatBody(BaseModel):
    doc_id: str
    message: str
    thread_id: str | None = None


class ThreadResponse(BaseModel):
    id: str
    doc_id: str
    thread_id: str
    message_count: int = 0


@router.post("/chat")
async def chat(body: ChatBody):
    thread_id = body.thread_id or body.doc_id

    async def event_stream():
        try:
            graph = create_graph()
            async for event in graph.astream_events(
                {"messages": [{"role": "user", "content": body.message}], "doc_id": body.doc_id},
                {"configurable": {"thread_id": thread_id}},
                version="v2",
            ):
                kind = event.get("event")
                if kind == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and chunk.content:
                        yield f"data: {json.dumps({'type': 'text', 'content': chunk.content})}\n\n"
                elif kind == "on_tool_start":
                    tool = event.get("name", "unknown")
                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool})}\n\n"
                elif kind == "on_chain_end":
                    pass

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.get("/threads/{doc_id}")
async def get_or_create_thread(doc_id: str):
    return ThreadResponse(id=uuid.uuid4().hex, doc_id=doc_id, thread_id=doc_id)


@router.get("/threads/{thread_id}/messages")
async def get_thread_messages(thread_id: str, before: str | None = None):
    return {"messages": [], "has_more": False}


@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str):
    return {"ok": True}
