import uvicorn

if __name__ == "__main__":
    
    # uvicorn.run("app.app:app", host="0.0.0.0", port=80, log_level="info")   # For local development
    uvicorn.run("app.app:app", log_level="info")
