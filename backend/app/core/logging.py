"""Logging configuration for HIPAA-compliant audit trails."""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings


class AuditLogger:
    """HIPAA-compliant audit logger for PHI access."""

    def __init__(self, name: str = "notesmith.audit"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)

        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(
                logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            )
            self.logger.addHandler(handler)

    def log_access(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        details: dict[str, Any] | None = None,
        success: bool = True,
    ) -> None:
        """Log PHI access for HIPAA compliance."""
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "success": success,
            "environment": settings.environment,
            "details": details or {},
        }
        self.logger.info(f"AUDIT: {json.dumps(audit_entry)}")

    def log_auth_event(
        self,
        user_id: str | None,
        event_type: str,
        ip_address: str | None = None,
        success: bool = True,
        details: dict[str, Any] | None = None,
    ) -> None:
        """Log authentication events."""
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "event_type": event_type,
            "ip_address": ip_address,
            "success": success,
            "environment": settings.environment,
            "details": details or {},
        }
        self.logger.info(f"AUTH: {json.dumps(audit_entry)}")


audit_logger = AuditLogger()

