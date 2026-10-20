"""Shared fixtures for the ReqRes contract suite.

ReqRes is a third party we do not control. Two risks follow from that (test plan, R1
and R2) and both are handled here rather than left to chance:

* the service may start requiring an API key, so one is always sent -- harmless when
  it is not needed;
* the service may rate-limit or go down mid-run. When that happens the tests are
  **skipped with the reason visible**, never failed. A failure means the contract is
  broken; somebody else's outage is not that, and reporting it as one would make the
  suite lie.

The free tier allows **40 requests per day from one address**, which a careless suite
exhausts in a single run. This one is written to a request budget: responses that more
than one check needs are requested once and shared through session-scoped fixtures,
and the number of requests a run consumed is printed when it finishes. Set
``REQRES_API_KEY`` to a real key to lift the limit.
"""
from __future__ import annotations

import os
import time

import jsonschema
import pytest
import requests

BASE_URL = os.environ.get("REQRES_BASE_URL", "https://reqres.in/api")
API_KEY = os.environ.get("REQRES_API_KEY", "reqres-free-v1")
TIMEOUT = float(os.environ.get("REQRES_TIMEOUT", "15"))

# A single request should return well inside this. It is a stated assumption, not an
# agreed service level -- there is nobody to agree one with (see Q-01).
LATENCY_BUDGET_SECONDS = 3.0

# ReqRes belongs to someone else and rate-limits the free tier. A short pause between
# requests keeps a full run inside the allowance and keeps our usage of a service we do
# not own modest. It costs a few seconds per run and removes a whole class of noise.
REQUEST_SPACING_SECONDS = float(os.environ.get("REQRES_SPACING", "0.35"))


class ApiClient:
    """Thin wrapper over requests: one place for the base URL, headers and timeout.

    Every response passes through :meth:`_guard`, which turns the two third-party
    conditions we cannot control into **skips with a visible reason** rather than
    failures. The distinction is the point: a failure claims the contract is broken,
    and an exhausted rate limit is not that.
    """

    def __init__(self, session: requests.Session) -> None:
        self._session = session
        self.calls = 0

    @staticmethod
    def _guard(response: requests.Response, method: str, path: str) -> requests.Response:
        if response.status_code == 429:
            pytest.skip(
                f"ReqRes rate-limited {method} {path} (429): this check did not run. "
                "Re-run later, or raise REQRES_SPACING to slow the suite down."
            )
        if response.status_code == 401:
            pytest.skip(
                f"ReqRes rejected the API key on {method} {path} (401): "
                "the contract could not be checked."
            )
        return response

    def request(self, method: str, path: str, **kwargs) -> requests.Response:
        self.calls += 1
        time.sleep(REQUEST_SPACING_SECONDS)
        try:
            response = self._session.request(
                method, f"{BASE_URL}{path}", timeout=TIMEOUT, **kwargs
            )
        except requests.RequestException as exc:
            pytest.skip(f"ReqRes is unreachable on {method} {path}: {type(exc).__name__}")
        return self._guard(response, method, path)

    def get(self, path, **kw):
        return self.request("GET", path, **kw)

    def post(self, path, **kw):
        return self.request("POST", path, **kw)

    def put(self, path, **kw):
        return self.request("PUT", path, **kw)

    def patch(self, path, **kw):
        return self.request("PATCH", path, **kw)

    def delete(self, path, **kw):
        return self.request("DELETE", path, **kw)


@pytest.fixture(scope="session")
def http_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {"x-api-key": API_KEY, "Accept": "application/json"}
    )
    yield session
    session.close()


@pytest.fixture(scope="session")
def api(http_session: requests.Session) -> ApiClient:
    """The client is shared for the whole run so that responses can be shared too.

    There is no separate health probe: it would cost a request out of a very small
    daily allowance, and the per-response guard already reports the same conditions
    with better precision -- it names the call that could not be made.
    """
    client = ApiClient(http_session)
    yield client
    print(f"\n\nReqRes requests used by this run: {client.calls}")


@pytest.fixture(scope="session")
def user_2(api):
    """GET /users/2 -- read once and shared, because four checks need this response."""
    return api.get("/users/2")


@pytest.fixture(scope="session")
def created_user(api):
    """POST /users -- created once and shared by the checks that inspect the result."""
    return api.post("/users", json={"name": "morpheus", "job": "leader"})


@pytest.fixture(scope="session")
def rejected_login(api):
    """A sign-in that must fail, shared by the checks that inspect the refusal."""
    return api.post("/login", json={"email": "nobody@nowhere.io", "password": "x"})


@pytest.fixture
def validate():
    """Validates a payload against a schema, failing with the offending field named."""

    def _validate(payload, schema, label="response"):
        try:
            jsonschema.validate(
                payload, schema, format_checker=jsonschema.FormatChecker()
            )
        except jsonschema.ValidationError as exc:
            location = "/".join(str(p) for p in exc.absolute_path) or "(root)"
            pytest.fail(
                f"{label} does not match the contract at {location}: {exc.message}"
            )

    return _validate
