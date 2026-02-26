"""FastAPI application entry point."""

from fastapi import FastAPI

app = FastAPI(
    title="Arctis Engine",
    version="0.1.0",
    description="Trading Decision Support Analysis Engine",
)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
