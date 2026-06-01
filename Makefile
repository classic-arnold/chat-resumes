COMPOSE := docker compose

.PHONY: start dev stop print-start-urls print-dev-urls

start:
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) up -d --force-recreate postgres backend web
	@$(MAKE) --no-print-directory print-start-urls

dev:
	$(COMPOSE) down --remove-orphans
	@$(MAKE) --no-print-directory print-dev-urls
	$(COMPOSE) --profile dev up --force-recreate postgres backend-dev web-dev

stop:
	$(COMPOSE) down --remove-orphans

print-start-urls:
	@printf '\nPreview stack URLs:\n'
	@printf '  Web:      http://localhost:43173\n'
	@printf '  API:      http://localhost:43807\n'
	@printf '  Health:   http://localhost:43807/health\n'
	@printf '  Postgres: postgresql://postgres:postgres@localhost:45439/chat_resumes?schema=public\n\n'

print-dev-urls:
	@printf '\nDev stack URLs:\n'
	@printf '  Web:      http://localhost:43174\n'
	@printf '  API:      http://localhost:43808\n'
	@printf '  Health:   http://localhost:43808/health\n'
	@printf '  Postgres: postgresql://postgres:postgres@localhost:45439/chat_resumes?schema=public\n\n'