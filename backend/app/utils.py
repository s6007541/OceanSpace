import socket
from starlette.config import Config


def get_local_ip_address() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 1))  # connect() for UDP doesn't send packets
    local_ip_address = s.getsockname()[0]
    return local_ip_address


# TODO: fix this to the deployed URL
frontend_url = f"http://localhost:5173"
backend_url = f"http://localhost:8000"

ENV = Config(".env")