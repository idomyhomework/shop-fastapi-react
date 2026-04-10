from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from app.database import get_db  # re-exported from here for convenience
from app.core.security import decode_token
from app.models import User, UserRole
from sqlalchemy import select


# ── Auth Dependencies ──────────────────────────────────────────────────────
async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Error en autorización"
    )
    if not access_token:
        raise credentials_exception
    try:
        payload = decode_token(access_token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_pk = int(user_id)
    except (JWTError, ValueError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_pk))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren los derechos del admin para esta acción",
        )
    return current_user
