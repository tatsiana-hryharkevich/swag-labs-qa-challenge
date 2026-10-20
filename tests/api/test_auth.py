"""Registration and sign-in. [REQ-004]"""
import pytest

from .schemas import ERROR, REGISTERED, TOKEN

KNOWN_USER = "eve.holt@reqres.in"


@pytest.mark.P1
def test_tc_api_010_registering_a_known_user_returns_an_identifier_and_a_token(api, validate):
    response = api.post("/register", json={"email": KNOWN_USER, "password": "pistol"})
    assert response.status_code == 200
    validate(response.json(), REGISTERED, "POST /register")


@pytest.mark.P1
def test_tc_api_012_signing_in_returns_a_token(api, validate):
    response = api.post("/login", json={"email": KNOWN_USER, "password": "cityslicka"})
    assert response.status_code == 200
    validate(response.json(), TOKEN, "POST /login")


@pytest.mark.P1
@pytest.mark.parametrize(
    "path,payload,expected_message",
    [
        ("/register", {"email": KNOWN_USER}, "Missing password"),
        ("/register", {"password": "pistol"}, "Missing email or username"),
        ("/register", {}, "Missing email or username"),
        ("/login", {"email": KNOWN_USER}, "Missing password"),
        ("/login", {"password": "cityslicka"}, "Missing email or username"),
        ("/login", {}, "Missing email or username"),
    ],
    ids=[
        "register-without-password",
        "register-without-email",
        "register-with-nothing",
        "login-without-password",
        "login-without-email",
        "login-with-nothing",
    ],
)
def test_tc_api_011_incomplete_credentials_are_rejected(api, validate, path, payload, expected_message):
    """Every missing-field case names the field that is missing.

    Marked smoke for one of the six: the point of a smoke check is that bad input is
    rejected at all, and the remaining five are detail.
    """
    response = api.post(path, json=payload)
    assert response.status_code == 400, f"{path} with {payload} returned {response.status_code}"
    body = response.json()
    validate(body, ERROR, f"POST {path}")
    assert body["error"] == expected_message


@pytest.mark.smoke
@pytest.mark.P1
def test_tc_api_013_signing_in_without_a_password_is_rejected(api, validate):
    response = api.post("/login", json={"email": KNOWN_USER})
    assert response.status_code == 400
    validate(response.json(), ERROR, "POST /login")


@pytest.mark.P1
def test_tc_api_014_an_unknown_account_cannot_sign_in(rejected_login):
    assert rejected_login.status_code == 400
    assert rejected_login.json()["error"] == "user not found"


@pytest.mark.P2
def test_tc_api_014_registration_is_refused_for_an_unknown_account(api, validate):
    response = api.post("/register", json={"email": "nobody@nowhere.io", "password": "x"})
    assert response.status_code == 400
    validate(response.json(), ERROR, "POST /register")


@pytest.mark.P2
def test_tc_api_014_a_failed_sign_in_returns_no_token(rejected_login):
    """A rejected sign-in must not leak a token. Reuses the refusal from TC-API-014."""
    assert "token" not in rejected_login.json()
