"""JSON schemas for the ReqRes responses this suite depends on.

Validation follows a *tolerant reader* contract: strict about the fields a consumer
actually uses -- presence, type and format -- and tolerant of anything else at the top
level. ReqRes attaches a vendor marketing block (``support``, ``_meta``) to every
response and visibly changes it between responses; failing a test because that block
changed would say nothing about the contract and would make the suite unreliable for
the wrong reason.

Inside ``data``, where the consumer actually reads, ``additionalProperties`` is false:
an unexpected field there is a real contract change and should fail.
"""

USER = {
    "type": "object",
    "required": ["id", "email", "first_name", "last_name", "avatar"],
    "additionalProperties": False,
    "properties": {
        "id": {"type": "integer", "minimum": 1},
        "email": {"type": "string", "format": "email"},
        "first_name": {"type": "string", "minLength": 1},
        "last_name": {"type": "string", "minLength": 1},
        "avatar": {"type": "string", "pattern": r"^https?://"},
    },
}

SINGLE_USER = {
    "type": "object",
    "required": ["data"],
    "properties": {"data": USER},
}

USER_LIST = {
    "type": "object",
    "required": ["page", "per_page", "total", "total_pages", "data"],
    "properties": {
        "page": {"type": "integer", "minimum": 0},
        "per_page": {"type": "integer", "minimum": 1},
        "total": {"type": "integer", "minimum": 0},
        "total_pages": {"type": "integer", "minimum": 0},
        "data": {"type": "array", "items": USER},
    },
}

RESOURCE = {
    "type": "object",
    "required": ["id", "name", "year", "color", "pantone_value"],
    "additionalProperties": False,
    "properties": {
        "id": {"type": "integer", "minimum": 1},
        "name": {"type": "string", "minLength": 1},
        "year": {"type": "integer"},
        "color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
        "pantone_value": {"type": "string"},
    },
}

RESOURCE_LIST = {
    "type": "object",
    "required": ["page", "per_page", "total", "total_pages", "data"],
    "properties": {"data": {"type": "array", "items": RESOURCE}},
}

CREATED = {
    "type": "object",
    "required": ["id", "createdAt"],
    "properties": {
        # The identifier comes back as a string even though /users returns integers.
        # Documented here rather than silently accepted -- see TC-API-006.
        "id": {"type": "string"},
        "createdAt": {"type": "string", "format": "date-time"},
    },
}

UPDATED = {
    "type": "object",
    "required": ["updatedAt"],
    "properties": {"updatedAt": {"type": "string", "format": "date-time"}},
}

TOKEN = {
    "type": "object",
    "required": ["token"],
    "properties": {"token": {"type": "string", "minLength": 1}},
}

REGISTERED = {
    "type": "object",
    "required": ["id", "token"],
    "properties": {
        "id": {"type": "integer", "minimum": 1},
        "token": {"type": "string", "minLength": 1},
    },
}

ERROR = {
    "type": "object",
    "required": ["error"],
    "properties": {"error": {"type": "string", "minLength": 1}},
}
