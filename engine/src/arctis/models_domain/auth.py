"""Auth domain models.

Defines User, UserRole, PlanTier, and Workspace dataclasses for the SaaS
control plane foundation. Single-user initially — multi-tenant later.
"""

from dataclasses import dataclass, field
from enum import Enum
import time
import uuid


class UserRole(str, Enum):
    TRADER = "trader"
    ADMIN = "admin"
    VIEWER = "viewer"


class PlanTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class User:
    user_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    email: str = ""
    display_name: str = ""
    role: UserRole = UserRole.TRADER
    plan: PlanTier = PlanTier.PRO
    created_at: float = field(default_factory=time.time)


@dataclass
class Workspace:
    workspace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Default"
    owner_id: str = ""
    created_at: float = field(default_factory=time.time)
