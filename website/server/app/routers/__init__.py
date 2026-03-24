"""
Aggregates all routers for easy import in main.py.
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
from app.routers.messages import router as messages_router
from app.routers.dashboard import router as dashboard_router
from app.routers.dawah_reports import router as dawah_reports_router
from app.routers.track import router as track_router
from app.routers.settings import router as settings_router
from app.routers.help import router as help_router
from app.routers.profiles import router as profiles_router
from app.routers.chats import router as chats_router
from app.routers.minister import router as minister_router
from app.routers.ws_chat import router as ws_chat_router

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
    "messages_router",
    "dashboard_router",
    "dawah_reports_router",
    "track_router",
    "settings_router",
    "help_router",
    "profiles_router",
    "chats_router",
    "minister_router",
    "ws_chat_router",
]
