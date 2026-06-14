"""Reports API Router."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.models.models import User

router = APIRouter()

@router.get("")
async def list_reports(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import select
    from app.models.models import Report
    result = await db.execute(select(Report).where(Report.user_id == current_user.id).order_by(Report.created_at.desc()).limit(20))
    reports = result.scalars().all()
    return {"reports": [{"id": str(r.id), "title": r.title, "report_type": r.report_type.value, "status": r.status, "created_at": r.created_at.isoformat()} for r in reports]}

@router.post("/generate")
async def generate_report(report_type: str = "monthly", db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime, timezone
    from app.models.models import Report, ReportType, ReportFormat
    report = Report(user_id=current_user.id, report_type=ReportType(report_type), report_format=ReportFormat.pdf, title=f"{report_type.title()} Report - {datetime.now().strftime('%B %Y')}", period_start=datetime.now(timezone.utc).replace(day=1), period_end=datetime.now(timezone.utc), status="processing")
    db.add(report)
    await db.flush()
    return {"report_id": str(report.id), "status": "processing", "message": "Report generation queued. Download will be available shortly."}
