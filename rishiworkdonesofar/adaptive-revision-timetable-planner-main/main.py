from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

@app.get("/health")
async def health_check():
    return JSONResponse(content={"status": "ok"})

#makes it so the static files load when running the website
app.mount("/static", StaticFiles(directory="static"), "static")

#displays the login page from frontend folder
@app.get("/frontend/{path:path}")
async def frontend_page(path: str):
    return FileResponse(f"frontend/{path}")

#displays the main design.html
@app.get("/design")
async def design():
    return FileResponse("design.html")

#displays the website (root) - redirects to frontend/index.html
@app.get("/")
async def root():
    return FileResponse("frontend/index.html")
