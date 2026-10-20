"""Error handling and robustness. [REQ-004]

The brief asks specifically how the service behaves for invalid input. These checks
share one rule: whatever the service decides to do, it must answer with a 4xx that a
consumer can act on, and never with a server error.
"""
import pytest

from .schemas import ERROR


@pytest.mark.P2
def test_tc_api_017_a_malformed_body_is_rejected_with_a_usable_error(api):
    response = api.post(
        "/users",
        data="not-json-at-all",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400
    body = response.json()
    # The service returns a structured error here rather than a bare string, so the
    # assertion follows what it actually provides.
    assert body["error"] == "invalid_json"
    assert "message" in body and body["message"]


@pytest.mark.P3
def test_tc_api_017_an_empty_body_is_rejected(api):
    response = api.post(
        "/users", data="", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 400


# A sweep asserting that no endpoint answers with a 5xx was written and then removed:
# it cost four requests out of a daily allowance of forty to assert something every
# other test in this suite already asserts, since each of them pins an exact status.


@pytest.mark.P3
def test_tc_api_017_an_unknown_path_is_not_found(api):
    response = api.get("/no-such-collection")
    assert response.status_code == 404
