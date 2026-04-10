from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.schemas import UserCreate, UserRead, LoginRequest, TokenResponse
from app.services.auth_service import register_user, authenticate_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from jose import JWTError
from app.core.dependencies import get_current_user
from app.models import User
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


# ── Cookie Helper ──────────────────────────────────────────────────────────
def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400,
    )


# ── Register ───────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserRead, status_code=201)
async def register(
    data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)
):
    user = await register_user(db, data)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    set_auth_cookies(response, access_token, refresh_token)
    return user


# ── Login ──────────────────────────────────────────────────────────────────
@router.post("/login", response_model=UserRead)
async def login(
    data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(db, data.email, data.password)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    set_auth_cookies(response, access_token, refresh_token)
    return user


# ── Logout ─────────────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        "access_token",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    response.delete_cookie(
        "refresh_token",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    return {"message": "Logged out"}


# ── Refresh ────────────────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalido"
    )
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No hay refresh token"
        )
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_pk = int(user_id)
    except (JWTError, ValueError):
        raise credentials_exception

    # ── Re-validate user is still active ──────────────────────────────────
    result = await db.execute(select(User).where(User.id == user_pk))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception

    access_token = create_access_token({"sub": str(user.id)})
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )
    return {"access_token": access_token}


# ── Me ─────────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
