"""PromptWars — Multi-Agent Candidate Evaluation API."""

import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from .config import settings
from .routers import health, evaluate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)

app = FastAPI(
    title="PromptWars — Multi-Agent Candidate Evaluation",
    description=(
        "AI-powered candidate evaluation using 4 independent agents, "
        "structured debate, and weighted adjudication."
    ),
    version="1.0.0",
)

# Global error handler guaranteeing JSON responses
@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    logging.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal error: {str(exc)}"},
    )

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(evaluate.router)


@app.get("/")
async def root():
    """Serve the frontend."""
    frontend_dir = Path(__file__).parent.parent.parent / "frontend"
    return FileResponse(frontend_dir / "index.html")


# Mount frontend static files (CSS, JS)
frontend_path = Path(__file__).parent.parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
