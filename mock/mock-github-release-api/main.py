import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

app = FastAPI()

EXPOSED_URL = os.getenv("EXPOSED_URL", "https://localhost:50501")
IMAGES = "/images"


@app.get("/")
async def root():
    return {"message": "This server mocks the GitHub Release API"}


# provide a list of releases
@app.get("/repos/{owner}/{repo}/releases")
async def list_releases(owner: str, repo: str):
    # check mounted dir for release files
    # assume that release tags are given by folders in /images/<owner>/<repo>/<tag>
    # if not found, return 404
    # if found, return 200
    if not os.path.isdir(os.path.join(IMAGES, owner, repo)):
        raise HTTPException(status_code=404, detail="Not Found")

    tags = []
    for folder in os.listdir(os.path.join(IMAGES, owner, repo)):
        tags.append({"tag_name": folder})

    return tags


# provide details for a specific release
@app.get("/repos/{owner}/{repo}/releases/tags/{tag}")
async def release_details(owner: str, repo: str, tag: str):
    # check mounted dir for release files
    # if not found, return 404
    # if found, return 200 with release details
    if not os.path.isdir(os.path.join(IMAGES, owner, repo, tag)):
        raise HTTPException(status_code=404, detail="Not Found")

    # assume that assets are in /images/<owner>/<repo>/<tag>/<asset>
    for folder in os.listdir(os.path.join(IMAGES, owner, repo)):
        if folder == tag:
            assets = []
            for asset in os.listdir(os.path.join(IMAGES, owner, repo, tag)):
                assets.append({
                    "name": asset,
                    "browser_download_url": f"{EXPOSED_URL}/{owner}/{repo}/releases/download/{tag}/{asset}",
                })
            return {"assets": assets}

    raise HTTPException(status_code=404, detail="Not Found")


# allow downloading of assets
@app.get("/{owner}/{repo}/releases/download/{tag}/{asset}")
async def download_asset(owner: str, repo: str, tag: str, asset: str):
    if not os.path.isdir(os.path.join(IMAGES, owner, repo, tag)):
        raise HTTPException(status_code=404, detail="Repo not Found")

    # serve file from /images/<owner>/<repo>/<tag>/<asset>
    path = os.path.join(IMAGES, owner, repo, tag, asset)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Asset not Found")
    else:
        return FileResponse(path, media_type="application/octet-stream", filename=asset)
