#!/usr/bin/env python3
"""Capture a full rendered page and split it into review-sized PNG slices."""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from PIL import Image
import websocket

WIDTH = 1440
VIEWPORT_HEIGHT = 1100
SLICE_HEIGHT = 1800
SLICE_OVERLAP = 120
MAX_PAGE_HEIGHT = 30000


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def main():
    if len(sys.argv) < 3:
        raise SystemExit("usage: capture-page.py URL OUTPUT_PREFIX")
    url, prefix = sys.argv[1], sys.argv[2]
    chrome = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
    if not chrome:
        raise SystemExit("CHROMIUM_PATH is not set and no Chromium executable was found")
    port = free_port()
    profile = tempfile.mkdtemp(prefix="susi-capture-")
    proc = subprocess.Popen(
        [
            chrome,
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--hide-scrollbars",
            f"--remote-debugging-port={port}",
            "--remote-allow-origins=*",
            f"--user-data-dir={profile}",
            f"--window-size={WIDTH},{VIEWPORT_HEIGHT}",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    ws = None
    try:
        targets = None
        for _ in range(60):
            try:
                targets = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json", timeout=1))
                break
            except Exception:
                time.sleep(0.25)
        if not targets:
            raise SystemExit("Chromium DevTools endpoint did not start")
        page = next(item for item in targets if item.get("type") == "page")
        ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=40)
        next_id = 0

        def command(method, params=None):
            nonlocal next_id
            next_id += 1
            ws.send(json.dumps({"id": next_id, "method": method, "params": params or {}}))
            while True:
                message = json.loads(ws.recv())
                if message.get("id") == next_id:
                    if "error" in message:
                        raise SystemExit(message["error"].get("message", "DevTools command failed"))
                    return message.get("result", {})

        def evaluate(expression, await_promise=False):
            result = command(
                "Runtime.evaluate",
                {"expression": expression, "returnByValue": True, "awaitPromise": await_promise},
            )
            return result.get("result", {}).get("value")

        command("Page.enable")
        command("Runtime.enable")
        command("Page.navigate", {"url": url})
        time.sleep(10)
        # Trigger lazy-loaded sections before measuring the real document height.
        evaluate(
            """(async()=>{const s=document.documentElement;for(let y=0;y<s.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}window.scrollTo(0,0);await new Promise(r=>setTimeout(r,600));return true})()""",
            await_promise=True,
        )
        time.sleep(1)
        height = evaluate(
            "Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,innerHeight)"
        )
        height = max(VIEWPORT_HEIGHT, min(int(height), MAX_PAGE_HEIGHT))
        shot = command(
            "Page.captureScreenshot",
            {
                "format": "png",
                "captureBeyondViewport": True,
                "fromSurface": True,
                "clip": {"x": 0, "y": 0, "width": WIDTH, "height": height, "scale": 1},
            },
        )
        import base64

        full_path = f"{prefix}-full.png"
        Path(full_path).write_bytes(base64.b64decode(shot["data"]))
        with Image.open(full_path) as image:
            image = image.convert("RGB")
            actual_height = image.height
            slices = []
            step = SLICE_HEIGHT - SLICE_OVERLAP
            top = 0
            while top < actual_height:
                bottom = min(actual_height, top + SLICE_HEIGHT)
                if actual_height - bottom < 300:
                    bottom = actual_height
                    top = max(0, bottom - SLICE_HEIGHT)
                output = f"{prefix}-{len(slices)}.png"
                image.crop((0, top, image.width, bottom)).save(output, "PNG", optimize=True)
                slices.append(output)
                if bottom >= actual_height:
                    break
                top += step
        print(json.dumps({"full": full_path, "width": WIDTH, "height": actual_height, "images": slices}))
    finally:
        try:
            if ws:
                ws.close()
        except Exception:
            pass
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except Exception:
            proc.kill()
        shutil.rmtree(profile, ignore_errors=True)


if __name__ == "__main__":
    main()
