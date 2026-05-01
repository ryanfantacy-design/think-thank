from fastapi import FastAPI, APIRouter, HTTPException, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    color: str = "#FFD600"
    target_minutes_daily: int = 60
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SubjectCreate(BaseModel):
    name: str
    color: Optional[str] = "#FFD600"
    target_minutes_daily: Optional[int] = 60


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    target_minutes_daily: Optional[int] = None


class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject_id: str
    subject_name: str
    duration_minutes: int
    notes: str = ""
    date: str  # YYYY-MM-DD
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SessionCreate(BaseModel):
    subject_id: str
    duration_minutes: int
    notes: Optional[str] = ""
    date: Optional[str] = None  # YYYY-MM-DD; default today (UTC)


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "global"
    daily_goal_minutes: int = 240  # 4hr default
    pomodoro_work: int = 25
    pomodoro_break: int = 5


class SettingsUpdate(BaseModel):
    daily_goal_minutes: Optional[int] = None
    pomodoro_work: Optional[int] = None
    pomodoro_break: Optional[int] = None


class JournalEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    mood: str = "okay"  # great|good|okay|meh|bad
    content: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class JournalUpsert(BaseModel):
    date: Optional[str] = None
    mood: Optional[str] = "okay"
    content: str = ""


class MockTest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    date: str  # YYYY-MM-DD
    score: float
    max_score: float
    percentage: float
    notes: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class MockTestCreate(BaseModel):
    name: str
    subject_id: Optional[str] = None
    date: Optional[str] = None
    score: float
    max_score: float
    notes: Optional[str] = ""


# ---------- Helpers ----------
def today_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Study Tracker API"}


# Subjects
@api_router.post("/subjects", response_model=Subject)
async def create_subject(payload: SubjectCreate):
    subj = Subject(**payload.model_dump())
    await db.subjects.insert_one(subj.model_dump())
    return subj


@api_router.get("/subjects", response_model=List[Subject])
async def list_subjects():
    items = await db.subjects.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return items


@api_router.put("/subjects/{subject_id}", response_model=Subject)
async def update_subject(subject_id: str, payload: SubjectUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        existing = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "Subject not found")
        return existing
    res = await db.subjects.update_one({"id": subject_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Subject not found")
    # also update subject_name in sessions if name changed
    if "name" in update:
        await db.sessions.update_many({"subject_id": subject_id}, {"$set": {"subject_name": update["name"]}})
    item = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    return item


@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    res = await db.subjects.delete_one({"id": subject_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Subject not found")
    # optionally also delete sessions; we keep them for historical records
    return {"deleted": True}


# Sessions
@api_router.post("/sessions", response_model=Session)
async def create_session(payload: SessionCreate):
    subj = await db.subjects.find_one({"id": payload.subject_id}, {"_id": 0})
    if not subj:
        raise HTTPException(404, "Subject not found")
    sess = Session(
        subject_id=payload.subject_id,
        subject_name=subj["name"],
        duration_minutes=payload.duration_minutes,
        notes=payload.notes or "",
        date=payload.date or today_str(),
    )
    await db.sessions.insert_one(sess.model_dump())
    return sess


@api_router.get("/sessions", response_model=List[Session])
async def list_sessions(date_from: Optional[str] = None, date_to: Optional[str] = None, limit: int = 1000):
    q: Dict[str, Any] = {}
    if date_from or date_to:
        q["date"] = {}
        if date_from:
            q["date"]["$gte"] = date_from
        if date_to:
            q["date"]["$lte"] = date_to
    items = await db.sessions.find(q, {"_id": 0}).sort("started_at", -1).to_list(limit)
    return items


@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    res = await db.sessions.delete_one({"id": session_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Session not found")
    return {"deleted": True}


# Stats
@api_router.get("/stats/today")
async def stats_today():
    t = today_str()
    sessions = await db.sessions.find({"date": t}, {"_id": 0}).to_list(1000)
    total = sum(s["duration_minutes"] for s in sessions)
    by_subject: Dict[str, int] = {}
    for s in sessions:
        by_subject[s["subject_name"]] = by_subject.get(s["subject_name"], 0) + s["duration_minutes"]
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0}) or {"daily_goal_minutes": 240}
    return {
        "date": t,
        "total_minutes": total,
        "goal_minutes": settings.get("daily_goal_minutes", 240),
        "by_subject": by_subject,
        "sessions_count": len(sessions),
    }


@api_router.get("/stats/weekly")
async def stats_weekly():
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=6)
    days = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    sessions = await db.sessions.find(
        {"date": {"$gte": days[0], "$lte": days[-1]}}, {"_id": 0}
    ).to_list(10000)
    subjects = await db.subjects.find({}, {"_id": 0, "name": 1, "color": 1}).to_list(10000)
    subject_colors = {s["name"]: s.get("color", "#FFD600") for s in subjects}
    by_day = {d: 0 for d in days}
    by_subject: Dict[str, int] = {}
    for s in sessions:
        if s["date"] in by_day:
            by_day[s["date"]] += s["duration_minutes"]
        by_subject[s["subject_name"]] = by_subject.get(s["subject_name"], 0) + s["duration_minutes"]
    return {
        "days": [
            {"date": d, "minutes": by_day[d], "label": (datetime.strptime(d, "%Y-%m-%d").strftime("%a"))}
            for d in days
        ],
        "subject_totals": [
            {"name": name, "minutes": minutes, "color": subject_colors.get(name, "#FFD600")}
            for name, minutes in sorted(by_subject.items(), key=lambda item: item[1], reverse=True)
        ],
    }


@api_router.get("/stats/streak")
async def stats_streak():
    # consecutive days (including today or yesterday) with at least 1 session
    sessions = await db.sessions.find({}, {"_id": 0, "date": 1}).to_list(100000)
    days_with = set(s["date"] for s in sessions)
    today = datetime.now(timezone.utc).date()
    streak = 0
    cursor = today
    # if today empty, allow starting from yesterday
    if cursor.strftime("%Y-%m-%d") not in days_with:
        cursor = cursor - timedelta(days=1)
    while cursor.strftime("%Y-%m-%d") in days_with:
        streak += 1
        cursor -= timedelta(days=1)
    longest = 0
    if days_with:
        sorted_days = sorted(days_with)
        cur = 1
        longest = 1
        for i in range(1, len(sorted_days)):
            prev = datetime.strptime(sorted_days[i - 1], "%Y-%m-%d").date()
            now = datetime.strptime(sorted_days[i], "%Y-%m-%d").date()
            if (now - prev).days == 1:
                cur += 1
                longest = max(longest, cur)
            else:
                cur = 1
    return {"current": streak, "longest": longest, "active_days": len(days_with)}


# Settings
@api_router.get("/settings", response_model=Settings)
async def get_settings():
    item = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not item:
        s = Settings()
        await db.settings.insert_one(s.model_dump())
        return s
    return item


@api_router.put("/settings", response_model=Settings)
async def update_settings(payload: SettingsUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.settings.update_one({"id": "global"}, {"$set": update}, upsert=True)
    item = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not item:
        item = Settings().model_dump()
    return item


# Export / Import
@api_router.get("/export")
async def export_all():
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(10000)
    sessions = await db.sessions.find({}, {"_id": 0}).to_list(100000)
    settings = await db.settings.find_one({"id": "global"}, {"_id": 0}) or Settings().model_dump()
    journal = await db.journal.find({}, {"_id": 0}).to_list(100000)
    mocks = await db.mock_tests.find({}, {"_id": 0}).to_list(100000)
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "subjects": subjects,
        "sessions": sessions,
        "settings": settings,
        "journal": journal,
        "mock_tests": mocks,
    }


@api_router.post("/import")
async def import_all(data: Dict[str, Any] = Body(...), replace: bool = True):
    if replace:
        await db.subjects.delete_many({})
        await db.sessions.delete_many({})
        await db.journal.delete_many({})
        await db.mock_tests.delete_many({})
    if data.get("subjects"):
        for s in data["subjects"]:
            if "id" not in s:
                s["id"] = str(uuid.uuid4())
        await db.subjects.insert_many(data["subjects"])
    if data.get("sessions"):
        for s in data["sessions"]:
            if "id" not in s:
                s["id"] = str(uuid.uuid4())
        await db.sessions.insert_many(data["sessions"])
    if data.get("journal"):
        for s in data["journal"]:
            if "id" not in s:
                s["id"] = str(uuid.uuid4())
        await db.journal.insert_many(data["journal"])
    if data.get("mock_tests"):
        for s in data["mock_tests"]:
            if "id" not in s:
                s["id"] = str(uuid.uuid4())
        await db.mock_tests.insert_many(data["mock_tests"])
    if data.get("settings"):
        s = data["settings"]
        s["id"] = "global"
        await db.settings.update_one({"id": "global"}, {"$set": s}, upsert=True)
    return {
        "imported": True,
        "subjects": len(data.get("subjects", []) or []),
        "sessions": len(data.get("sessions", []) or []),
        "journal": len(data.get("journal", []) or []),
        "mock_tests": len(data.get("mock_tests", []) or []),
    }


# Journal
@api_router.get("/journal", response_model=List[JournalEntry])
async def list_journal(date_from: Optional[str] = None, date_to: Optional[str] = None):
    q: Dict[str, Any] = {}
    if date_from or date_to:
        q["date"] = {}
        if date_from:
            q["date"]["$gte"] = date_from
        if date_to:
            q["date"]["$lte"] = date_to
    items = await db.journal.find(q, {"_id": 0}).sort("date", -1).to_list(10000)
    return items


@api_router.get("/journal/{entry_date}")
async def get_journal(entry_date: str):
    item = await db.journal.find_one({"date": entry_date}, {"_id": 0})
    return item or {"date": entry_date, "mood": "okay", "content": "", "id": None}


@api_router.post("/journal", response_model=JournalEntry)
async def upsert_journal(payload: JournalUpsert):
    d = payload.date or today_str()
    existing = await db.journal.find_one({"date": d}, {"_id": 0})
    now_iso = datetime.now(timezone.utc).isoformat()
    if existing:
        update = {"mood": payload.mood or "okay", "content": payload.content or "", "updated_at": now_iso}
        await db.journal.update_one({"date": d}, {"$set": update})
        merged = {**existing, **update}
        return merged
    entry = JournalEntry(date=d, mood=payload.mood or "okay", content=payload.content or "")
    await db.journal.insert_one(entry.model_dump())
    return entry


@api_router.delete("/journal/{entry_id}")
async def delete_journal(entry_id: str):
    res = await db.journal.delete_one({"id": entry_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Journal entry not found")
    return {"deleted": True}


# Mock Tests
@api_router.post("/mocks", response_model=MockTest)
async def create_mock(payload: MockTestCreate):
    subject_name = None
    if payload.subject_id:
        subj = await db.subjects.find_one({"id": payload.subject_id}, {"_id": 0})
        if subj:
            subject_name = subj["name"]
    if payload.max_score <= 0:
        raise HTTPException(400, "max_score must be > 0")
    pct = round((payload.score / payload.max_score) * 100, 2)
    m = MockTest(
        name=payload.name,
        subject_id=payload.subject_id,
        subject_name=subject_name,
        date=payload.date or today_str(),
        score=payload.score,
        max_score=payload.max_score,
        percentage=pct,
        notes=payload.notes or "",
    )
    await db.mock_tests.insert_one(m.model_dump())
    return m


@api_router.get("/mocks", response_model=List[MockTest])
async def list_mocks():
    items = await db.mock_tests.find({}, {"_id": 0}).sort("date", -1).to_list(10000)
    return items


@api_router.delete("/mocks/{mock_id}")
async def delete_mock(mock_id: str):
    res = await db.mock_tests.delete_one({"id": mock_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Mock test not found")
    return {"deleted": True}


@api_router.get("/mocks/stats/overview")
async def mock_stats():
    items = await db.mock_tests.find({}, {"_id": 0}).to_list(10000)
    if not items:
        return {"count": 0, "avg": 0, "best": 0, "worst": 0, "trend": []}
    pcts = [m["percentage"] for m in items]
    sorted_items = sorted(items, key=lambda x: x["date"])
    return {
        "count": len(items),
        "avg": round(sum(pcts) / len(pcts), 2),
        "best": max(pcts),
        "worst": min(pcts),
        "trend": [{"date": m["date"], "name": m["name"], "percentage": m["percentage"]} for m in sorted_items],
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
