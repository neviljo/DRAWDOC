.PHONY: up down seed logs migrate build

up:
	docker compose -f infra/docker-compose.yml up -d

down:
	docker compose -f infra/docker-compose.yml down

logs:
	docker compose -f infra/docker-compose.yml logs -f

build:
	docker compose -f infra/docker-compose.yml build

seed:
	docker compose -f infra/docker-compose.yml run --rm api uv run python seed.py

migrate:
	docker compose -f infra/docker-compose.yml run --rm api uv run alembic upgrade head

shell-api:
	docker compose -f infra/docker-compose.yml run --rm api /bin/bash

shell-ws:
	docker compose -f infra/docker-compose.yml run --rm ws /bin/bash

shell-agent:
	docker compose -f infra/docker-compose.yml run --rm agent /bin/bash
