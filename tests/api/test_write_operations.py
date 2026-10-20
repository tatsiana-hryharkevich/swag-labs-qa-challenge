"""Create, replace, update and delete: the write contract. [REQ-004]

ReqRes is a mock. Writes are accepted and echoed but not stored, so no test here
assumes a created resource can be read back, and no test depends on another having
run first. Each builds its own payload and asserts only on the response it received.
"""
import pytest

from .schemas import CREATED, UPDATED


@pytest.mark.smoke
@pytest.mark.P1
def test_tc_api_006_creating_a_user_returns_201_and_echoes_the_input(created_user, validate):
    assert created_user.status_code == 201, "creation should report 201, not 200"
    body = created_user.json()
    validate(body, CREATED, "POST /users")
    assert body["name"] == "morpheus"
    assert body["job"] == "leader"


@pytest.mark.P3
def test_tc_api_006_the_created_identifier_is_a_string_not_an_integer(created_user, user_2):
    """Records an inconsistency in the contract rather than asserting it is correct.

    ``GET /users`` returns ``id`` as an integer; ``POST /users`` returns it as a string.
    A consumer that round-trips the value has to handle both. No specification says
    which is intended, so this is recorded, not reported as a defect.
    """
    assert isinstance(created_user.json()["id"], str)
    assert isinstance(user_2.json()["data"]["id"], int)


@pytest.mark.P2
@pytest.mark.parametrize("method", ["put", "patch"], ids=["replace", "update"])
def test_tc_api_007_updating_a_user_returns_a_timestamp(api, validate, method):
    response = getattr(api, method)("/users/2", json={"job": "zion resident"})
    assert response.status_code == 200
    body = response.json()
    validate(body, UPDATED, f"{method.upper()} /users/2")
    assert body["job"] == "zion resident"


@pytest.mark.P2
def test_tc_api_009_deleting_a_user_returns_204_with_no_body(api):
    response = api.delete("/users/2")
    assert response.status_code == 204
    assert response.text == "", "a 204 must not carry a body"
