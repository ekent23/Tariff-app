
from fastapi import FastAPI

app = FastAPI()  # This 'app' is what uvicorn is looking for!

@app.get("/")
def root():
    return {"message": "Hello World"}