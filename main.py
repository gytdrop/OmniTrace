from fastapi import FastAPI, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import uvicorn

app = FastAPI()

# Allow frontend ports to communicate seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/parse")
async def parse_intent(prompt: str = Form(...)):
    # High-fidelity mock response structured exactly for React Flow coordinate space
    mock_canvas_data = {
        "nodes": [
            {
                "id": "node-root",
                "type": "input",
                "position": { "x": 250, "y": 0 },
                "data": { "label": "Intent Core", "content": f"Command parsed: '{prompt}'" }
            },
            {
                "id": "node-crm",
                "type": "default",
                "position": { "x": 0, "y": 150 },
                "data": { "label": "CRM Initialization", "content": "Entity: Acme Corp | Status: Staged" }
            },
            {
                "id": "node-pm",
                "type": "default",
                "position": { "x": 500, "y": 150 },
                "data": { "label": "Project Assignment", "content": "Owner: Anirudh | Priority: P0 Critical" }
            }
        ],
        "edges": [
            { "id": "e-root-crm", "source": "node-root", "target": "node-crm", "animated": True },
            { "id": "e-root-pm", "source": "node-root", "target": "node-pm", "animated": True }
        ]
    }
    return Response(content=json.dumps(mock_canvas_data), media_type="application/json")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
