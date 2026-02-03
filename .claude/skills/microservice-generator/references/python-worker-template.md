# Python Worker Template (NATS Consumer)

## Structure

```
services/<service-name>/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── events.py
│   │   └── handlers/
│   │       ├── __init__.py
│   │       └── <event>_handler.py
│   ├── infrastructure/
│   │   ├── __init__.py
│   │   ├── nats_client.py
│   │   └── consul_client.py
│   └── utils/
│       ├── __init__.py
│       └── logging.py
├── tests/
│   └── test_handlers.py
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── .env.example
```

---

## Fichiers clés

### main.py

```python
import asyncio
import signal
from src.config import settings
from src.infrastructure.nats_client import NatsClient
from src.infrastructure.consul_client import ConsulClient
from src.domain.handlers import register_handlers
from src.utils.logging import logger

async def main():
    # Init clients
    nats = NatsClient(settings.NATS_URL)
    consul = ConsulClient(settings.CONSUL_HOST, settings.CONSUL_PORT)

    # Connect
    await nats.connect()
    await consul.register(
        service_id=f"{settings.SERVICE_NAME}-{settings.HOSTNAME}",
        service_name=settings.SERVICE_NAME,
        tags=["worker", "python", settings.BOUNDED_CONTEXT],
    )

    logger.info(f"Worker {settings.SERVICE_NAME} started")

    # Register handlers
    await register_handlers(nats)

    # Graceful shutdown
    stop_event = asyncio.Event()

    def shutdown():
        logger.info("Shutting down...")
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, shutdown)

    await stop_event.wait()

    # Cleanup
    await consul.deregister()
    await nats.close()

if __name__ == "__main__":
    asyncio.run(main())
```

### config.py

```python
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    SERVICE_NAME: str = "<service-name>"
    BOUNDED_CONTEXT: str = "<context>"
    HOSTNAME: str = os.getenv("HOSTNAME", "local")

    # NATS
    NATS_URL: str = "nats://localhost:4222"

    # Consul
    CONSUL_HOST: str = "localhost"
    CONSUL_PORT: int = 8500

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()
```

### infrastructure/nats_client.py

```python
import json
from nats.aio.client import Client as NATS
from nats.js import JetStreamContext
from typing import Callable, Any
from src.utils.logging import logger

class NatsClient:
    def __init__(self, url: str):
        self.url = url
        self.nc: NATS = None
        self.js: JetStreamContext = None

    async def connect(self):
        self.nc = NATS()
        await self.nc.connect(self.url)
        self.js = self.nc.jetstream()
        logger.info(f"Connected to NATS at {self.url}")

    async def subscribe(
        self,
        subject: str,
        handler: Callable[[dict], Any],
        durable: str = None,
    ):
        async def message_handler(msg):
            try:
                data = json.loads(msg.data.decode())
                await handler(data)
                await msg.ack()
            except Exception as e:
                logger.error(f"Error handling {subject}: {e}")
                # NAK for retry
                await msg.nak(delay=5)

        sub = await self.js.subscribe(
            subject,
            durable=durable,
            cb=message_handler,
        )
        logger.info(f"Subscribed to {subject}")
        return sub

    async def publish(self, subject: str, data: dict):
        payload = json.dumps(data).encode()
        await self.js.publish(subject, payload)
        logger.debug(f"Published to {subject}")

    async def close(self):
        await self.nc.drain()
```

### infrastructure/consul_client.py

```python
import consul.aio
from src.utils.logging import logger

class ConsulClient:
    def __init__(self, host: str, port: int):
        self.client = consul.aio.Consul(host=host, port=port)
        self.service_id = None

    async def register(
        self,
        service_id: str,
        service_name: str,
        tags: list[str] = None,
    ):
        self.service_id = service_id
        await self.client.agent.service.register(
            name=service_name,
            service_id=service_id,
            tags=tags or [],
            check=consul.Check.ttl("30s"),
        )
        logger.info(f"Registered with Consul as {service_id}")

        # Start TTL check
        # In production: run periodic check.pass in background

    async def deregister(self):
        if self.service_id:
            await self.client.agent.service.deregister(self.service_id)
            logger.info(f"Deregistered from Consul")
```

### domain/handlers/__init__.py

```python
from src.infrastructure.nats_client import NatsClient
from src.domain.handlers.<event>_handler import handle_<event>

async def register_handlers(nats: NatsClient):
    """Register all event handlers."""

    await nats.subscribe(
        subject="<context>.<aggregate>.<event>",
        handler=handle_<event>,
        durable="<service-name>-<event>",
    )

    # Add more handlers here
```

### domain/handlers/example_handler.py

```python
from src.utils.logging import logger

async def handle_<event>(event: dict) -> None:
    """
    Handle <context>.<aggregate>.<event> event.

    Args:
        event: Event payload with structure:
            - id: str
            - type: str
            - timestamp: str
            - aggregateId: str
            - data: dict
    """
    event_id = event.get("id")
    aggregate_id = event.get("aggregateId")
    data = event.get("data", {})

    logger.info(f"Processing event {event_id} for {aggregate_id}")

    # TODO: Implement business logic

    logger.info(f"Event {event_id} processed successfully")
```

---

## requirements.txt

```txt
nats-py>=2.6.0
python-consul>=1.1.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
structlog>=23.0.0
```

---

## Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY src/ ./src/

# Environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

CMD ["python", "-m", "src.main"]
```

---

## docker-compose

```yaml
# compose/<service-name>.yml
version: '3.8'

services:
  <service-name>:
    build:
      context: ../services/<service-name>
      dockerfile: Dockerfile
    container_name: <service-name>
    environment:
      - SERVICE_NAME=<service-name>
      - BOUNDED_CONTEXT=<context>
      - NATS_URL=nats://nats:4222
      - CONSUL_HOST=consul
      - CONSUL_PORT=8500
      - LOG_LEVEL=INFO
    depends_on:
      - nats
      - consul
    networks:
      - winaity-network
    restart: unless-stopped

networks:
  winaity-network:
    external: true
```

---

## .env.example

```env
SERVICE_NAME=<service-name>
BOUNDED_CONTEXT=<context>
NATS_URL=nats://localhost:4222
CONSUL_HOST=localhost
CONSUL_PORT=8500
LOG_LEVEL=DEBUG
```

---

## Tests

```python
# tests/test_handlers.py
import pytest
from unittest.mock import AsyncMock, patch
from src.domain.handlers.<event>_handler import handle_<event>

@pytest.fixture
def sample_event():
    return {
        "id": "evt_123",
        "type": "<context>.<aggregate>.<event>",
        "timestamp": "2024-01-15T10:00:00Z",
        "aggregateId": "agg_456",
        "data": {
            "field1": "value1",
        },
    }

@pytest.mark.asyncio
async def test_handle_<event>_success(sample_event):
    # Act
    await handle_<event>(sample_event)

    # Assert
    # TODO: Add assertions based on expected behavior

@pytest.mark.asyncio
async def test_handle_<event>_idempotent(sample_event):
    # Act - process same event twice
    await handle_<event>(sample_event)
    await handle_<event>(sample_event)

    # Assert - should not fail or duplicate side effects
```

---

## Commandes

```bash
# Install
cd services/<service-name>
pip install -r requirements.txt

# Run local
python -m src.main

# Test
pytest tests/

# Docker
docker build -t <service-name> .
docker compose -f compose/<service-name>.yml up -d
```

---

## Notes V1

Ce template est un **squelette minimal**. Pour V2+ :
- Ajouter Redis pour dedup/cache
- Ajouter structured logging avec correlation-id
- Ajouter health endpoint (HTTP ou gRPC)
- Ajouter metrics Prometheus
- Ajouter retry avec backoff exponentiel
- Ajouter DLQ handling
