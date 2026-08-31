# app/connections.py
from typing import List
from fastapi import WebSocket
import json

class ConnectionManager:
    """Manages active WebSocket connections for live real-time dashboard updates."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accepts a new incoming WebSocket connection from the frontend."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Removes a WebSocket connection when the frontend disconnects."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Sends a real-time JSON event update to all connected frontend clients instantly."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        
        # Clean up any broken connections automatically
        for conn in disconnected:
            self.disconnect(conn)

# Create the instance here so it can be imported by everyone
manager = ConnectionManager()