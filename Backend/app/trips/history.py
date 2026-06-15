from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.utils.auth_dep import get_current_user
from app.db.models import Trip

router = APIRouter()

@router.get("/history")
def history(page: int = 1, limit: int = 20, filter: str = Query(default="all"), db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Trip).filter(Trip.user_id == user.id).order_by(Trip.started_at.desc())
    trips = q.offset((page - 1) * limit).limit(limit).all()
    total = q.count()
    return {
        "trips": [
            {
                "id": t.id,
                "route_type": t.route_type,
                "started_at": t.started_at.isoformat() + "Z" if t.started_at else None,
                "duration_min": t.duration_min,
                "distance_km": t.distance_km,
                "trs": t.trs,
                "fare_inr": t.fare_inr,
                "transfers": t.transfers,
                "actual_delay_sec": t.actual_delay_sec,
                "reward_points_earned": t.reward_points_earned,
            }
            for t in trips
        ],
        "total": total,
        "page": page,
        "limit": limit,
    }
