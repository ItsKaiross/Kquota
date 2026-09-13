from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import auth, status, usage
from core.config import HOST, PORT

app = FastAPI(title="KQuota")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["tauri://localhost", "http://tauri.localhost", "http://localhost:1420"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(usage.router)
app.include_router(status.router)
app.include_router(auth.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
