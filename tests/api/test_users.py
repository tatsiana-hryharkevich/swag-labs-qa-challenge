"""User endpoints: the read contract. [REQ-004]"""
import pytest

from .schemas import ERROR, RESOURCE_LIST, SINGLE_USER, USER_LIST
from .conftest import LATENCY_BUDGET_SECONDS


@pytest.mark.P1
def test_tc_api_001_user_list_matches_its_contract(api, validate):
    response = api.get("/users?page=2")
    assert response.status_code == 200
    body = response.json()
    validate(body, USER_LIST, "GET /users?page=2")
    # The pagination fields must describe the payload, not merely be present.
    assert body["page"] == 2
    assert len(body["data"]) == body["per_page"]
    assert body["total_pages"] == -(-body["total"] // body["per_page"])


@pytest.mark.smoke
@pytest.mark.P1
def test_tc_api_002_single_user_matches_its_contract(user_2, validate):
    assert user_2.status_code == 200
    validate(user_2.json(), SINGLE_USER, "GET /users/2")


@pytest.mark.P1
def test_tc_api_003_unknown_user_is_not_found(api):
    response = api.get("/users/23")
    assert response.status_code == 404
    assert response.json() == {}, "a 404 should carry no user data"


@pytest.mark.P2
def test_tc_api_004_resource_list_matches_its_contract(api, validate):
    response = api.get("/unknown")
    assert response.status_code == 200
    validate(response.json(), RESOURCE_LIST, "GET /unknown")


@pytest.mark.P2
def test_tc_api_005_unknown_resource_is_not_found(api):
    assert api.get("/unknown/23").status_code == 404


@pytest.mark.P3
@pytest.mark.parametrize(
    "identifier",
    ["abc", "99999"],
    ids=["not-a-number", "far-beyond-the-last"],
)
def test_tc_api_003_odd_identifiers_are_not_found_rather_than_errors(api, identifier):
    """An identifier that cannot exist must be a 404, never a server error."""
    response = api.get(f"/users/{identifier}")
    assert response.status_code == 404, f"/users/{identifier} returned {response.status_code}"


@pytest.mark.P3
def test_tc_api_016_pagination_boundaries(api, validate):
    """Documents how the service treats pages outside the real range.

    Neither behaviour is called wrong: no specification says what should happen. The
    test records what does happen, so a change would be noticed.
    """
    below = api.get("/users?page=0")
    assert below.status_code == 200
    assert below.json()["page"] == 1, "page 0 is treated as the first page"

    beyond = api.get("/users?page=99")
    assert beyond.status_code == 200
    body = beyond.json()
    validate(body, USER_LIST, "GET /users?page=99")
    assert body["data"] == [], "a page past the end returns no users rather than an error"
    assert body["total_pages"] < body["page"]


@pytest.mark.P3
def test_tc_api_016_page_size_is_honoured(api):
    body = api.get("/users?per_page=3").json()
    assert body["per_page"] == 3
    assert len(body["data"]) == 3


@pytest.mark.P2
def test_tc_api_018_a_single_request_answers_within_the_budget(user_2):
    """Reuses the response from TC-API-002 rather than spending another request."""
    elapsed = user_2.elapsed.total_seconds()
    assert elapsed < LATENCY_BUDGET_SECONDS, (
        f"a single read took {elapsed:.2f}s against a budget of {LATENCY_BUDGET_SECONDS}s"
    )


@pytest.mark.P3
def test_tc_api_015_the_delay_parameter_actually_delays(api):
    response = api.get("/users?delay=3")
    assert response.status_code == 200
    assert response.elapsed.total_seconds() >= 3
