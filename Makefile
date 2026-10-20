.PHONY: install test smoke regression test-ui test-api report clean

install:                ## Install Node and Python dependencies and the browser
	npm ci
	npx playwright install chromium
	uv sync

test: test-ui test-api  ## Everything -- the single documented command

smoke:                  ## 7 cases, under a minute: is this build worth testing at all
	npx playwright test --grep @smoke
	uv run pytest tests/api -m smoke

regression:             ## Every P1 case -- the CI gate
	npx playwright test --grep @P1
	uv run pytest tests/api -m P1

test-ui:                ## The Playwright suite only
	npx playwright test

test-api:               ## The pytest suite only
	uv run pytest tests/api

report:                 ## Open the last UI run report
	npx playwright show-report

clean:
	rm -rf playwright-report test-results .pytest_cache report.html
