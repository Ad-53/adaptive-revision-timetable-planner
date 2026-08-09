from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

#makes it so the static files load when running the website
app.mount("/static", StaticFiles(directory="static"), "static")

#displays the website
@app.get("/")
async def root():
    return FileResponse("template/login.html")

