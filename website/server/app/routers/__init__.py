"""
Routers Package — import all API routers here.
"""

from app.routers.users import router as users_router
from app.routers.admins import router as admins_router
from app.routers.organizations import router as organizations_router
from app.routers.preachers import router as preachers_router
from app.routers.muslim_callers import router as muslim_callers_router
from app.routers.interested_persons import router as interested_persons_router
from app.routers.auth import router as auth_router
from app.routers.dawah_requests import router as dawah_requests_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "users_router",
    "admins_router",
    "organizations_router",
    "preachers_router",
    "muslim_callers_router",
    "interested_persons_router",
    "auth_router",
    "dawah_requests_router",
    "notifications_router",
]
