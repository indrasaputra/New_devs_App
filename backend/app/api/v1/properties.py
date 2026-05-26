from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from typing import Any, Dict

from app.core.auth import authenticate_request as get_current_user
from app.core.database_pool import DatabasePool

router = APIRouter()


def _require_tenant_id(current_user) -> str:
    tenant_id = getattr(current_user, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tenant could not be resolved for this user",
        )
    return tenant_id


@router.get("/properties")
async def list_properties(
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    tenant_id = _require_tenant_id(current_user)

    db_pool = DatabasePool()
    await db_pool.initialize()

    async with db_pool.get_session() as session:
        result = await session.execute(
            text(
                """
                SELECT id, name, timezone
                FROM properties
                WHERE tenant_id = :tenant_id
                ORDER BY name
                """
            ),
            {"tenant_id": tenant_id},
        )
        items = [
            {"id": row.id, "name": row.name, "timezone": row.timezone}
            for row in result.fetchall()
        ]

    return {"items": items, "total": len(items)}
