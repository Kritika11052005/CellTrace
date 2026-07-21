"""CellTrace — Auth routes (register, login, refresh)."""
import logging
from fastapi import APIRouter, HTTPException, Request, status

from app.schemas import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.auth.jwt import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.prisma import Json

router = APIRouter()
logger = logging.getLogger("celltrace.auth")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: Request, body: RegisterRequest):
    """Register a new operator account."""
    db = request.app.state.db

    # Check if email already exists
    existing = await db.user.find_unique(where={"email": body.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create user
    user = await db.user.create(
        data={
            "email": body.email,
            "password_hash": hash_password(body.password),
            "role": "operator",
        }
    )

    # Generate tokens
    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Audit log
    await db.auditlog.create(
        data={
            "actor": {"connect": {"id": user.id}},
            "action": "register",
            "metadata": Json({"email": user.email}),
        }
    )

    logger.info(f"New user registered: {user.email}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role,
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, body: LoginRequest):
    """Authenticate and get JWT tokens."""
    db = request.app.state.db

    user = await db.user.find_unique(where={"email": body.email})
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Audit log
    await db.auditlog.create(
        data={
            "actor": {"connect": {"id": user.id}},
            "action": "login",
            "metadata": Json({"email": user.email}),
        }
    )

    logger.info(f"User logged in: {user.email}")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, body: RefreshRequest):
    """Refresh an expired access token."""
    db = request.app.state.db

    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        role=user.role,
    )


@router.get("/me")
async def get_me(request: Request):
    """Get current user info (requires auth)."""
    from app.auth.dependencies import get_current_user
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    from fastapi import Depends

    # This is a simplified approach — in production use Depends
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = auth_header.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = request.app.state.db
    user = await db.user.find_unique(where={"id": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
    }
