from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.utils.auth_dep import get_current_user
from app.db.models import Trip

router = APIRouter()

@router.get("/{trip_id}")
def detail(trip_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {
        "id": trip.id,
        "origin": {"lat": trip.origin_lat, "lng": trip.origin_lng},
        "destination": {"lat": trip.destination_lat, "lng": trip.destination_lng},
        "route_type": trip.route_type,
        "started_at": trip.started_at.isoformat() + "Z" if trip.started_at else None,
        "ended_at": trip.ended_at.isoformat() + "Z" if trip.ended_at else None,
        "duration_min": trip.duration_min,
        "distance_km": trip.distance_km,
        "trs": trip.trs,
        "fare_inr": trip.fare_inr,
        "transfers": trip.transfers,
        "actual_delay_sec": trip.actual_delay_sec,
        "reward_points_earned": trip.reward_points_earned,
        "polyline": trip.polyline,
    }
