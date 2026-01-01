"""Templates API endpoints."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DBClient
from app.core.logging import audit_logger
from app.models.templates import Template, TemplateCreate, TemplateType, TemplateUpdate

router = APIRouter()


@router.post("/", response_model=Template, status_code=status.HTTP_201_CREATED)
async def create_template(
    template: TemplateCreate,
    current_user: CurrentUser,
    db: DBClient,
) -> Template:
    """Create a new template."""
    data = template.model_dump()
    data["practice_id"] = str(template.practice_id) if template.practice_id else None
    data["variables"] = [v.model_dump() for v in template.variables]

    result = db.table("templates").insert(data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create template",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="create",
        resource_type="template",
        resource_id=result.data[0]["id"],
    )

    return Template(**result.data[0])


@router.get("/", response_model=list[Template])
async def list_templates(
    current_user: CurrentUser,
    db: DBClient,
    practice_id: UUID | None = None,
    template_type: TemplateType | None = None,
    include_system: bool = True,
) -> list[Template]:
    """List templates with optional filtering."""
    query = db.table("templates").select("*").eq("is_active", True)

    if practice_id:
        if include_system:
            # Include both practice templates and system templates (practice_id is null)
            query = query.or_(f"practice_id.eq.{practice_id},practice_id.is.null")
        else:
            query = query.eq("practice_id", str(practice_id))
    elif include_system:
        query = query.is_("practice_id", "null")

    if template_type:
        query = query.eq("template_type", template_type.value)

    query = query.order("name")
    result = query.execute()

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="list",
        resource_type="template",
        resource_id="*",
        details={"count": len(result.data) if result.data else 0},
    )

    return [Template(**item) for item in result.data] if result.data else []


@router.get("/defaults", response_model=list[Template])
async def get_default_templates(
    current_user: CurrentUser,
    db: DBClient,
) -> list[Template]:
    """Get all default system templates."""
    result = (
        db.table("templates")
        .select("*")
        .is_("practice_id", "null")
        .eq("is_default", True)
        .eq("is_active", True)
        .order("name")
        .execute()
    )

    return [Template(**item) for item in result.data] if result.data else []


@router.get("/{template_id}", response_model=Template)
async def get_template(
    template_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> Template:
    """Get a template by ID."""
    result = (
        db.table("templates")
        .select("*")
        .eq("id", str(template_id))
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="read",
        resource_type="template",
        resource_id=str(template_id),
    )

    return Template(**result.data)


@router.patch("/{template_id}", response_model=Template)
async def update_template(
    template_id: UUID,
    template_update: TemplateUpdate,
    current_user: CurrentUser,
    db: DBClient,
) -> Template:
    """Update a template."""
    update_data = template_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Convert variables if present
    if "variables" in update_data and update_data["variables"]:
        update_data["variables"] = [v.model_dump() for v in update_data["variables"]]

    # Increment version on content change
    if "content" in update_data:
        current = (
            db.table("templates")
            .select("version")
            .eq("id", str(template_id))
            .single()
            .execute()
        )
        if current.data:
            update_data["version"] = current.data["version"] + 1

    result = (
        db.table("templates")
        .update(update_data)
        .eq("id", str(template_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="update",
        resource_type="template",
        resource_id=str(template_id),
        details={"updated_fields": list(update_data.keys())},
    )

    return Template(**result.data[0])


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: UUID,
    current_user: CurrentUser,
    db: DBClient,
) -> None:
    """Delete a template (soft delete by setting is_active to false)."""
    result = (
        db.table("templates")
        .update({"is_active": False})
        .eq("id", str(template_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    audit_logger.log_access(
        user_id=str(current_user.id),
        action="delete",
        resource_type="template",
        resource_id=str(template_id),
    )

