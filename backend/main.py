import uvicorn
# import argparse


if __name__ == "__main__":
    # parser = argparse.ArgumentParser()

    # parser.add_argument("--local_dev", action="store_true", help="Run tests locally")


    # args = parser.parse_args()
    
    # if args.local_dev:
    #     uvicorn.run("app.app:app", host="0.0.0.0", port=80, log_level="info")   # For local development
    # else:
    #     uvicorn.run("app.app:app", log_level="info")

    uvicorn.run("app.app:app", log_level="info")

