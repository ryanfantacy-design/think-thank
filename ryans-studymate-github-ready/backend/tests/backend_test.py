import os, requests, pytest
BASE = os.environ.get('REACT_APP_BACKEND_URL', 'https://daily-study-4.preview.emergentagent.com').rstrip('/')
A = f"{BASE}/api"
S = requests.Session(); S.headers.update({"Content-Type":"application/json"})

# ---------- Root ----------
def test_root():
    r = S.get(f"{A}/"); assert r.status_code==200; assert "message" in r.json()

# ---------- Subjects fixture ----------
@pytest.fixture(scope="module")
def subj():
    r = S.post(f"{A}/subjects", json={"name":"TEST_Math","color":"#FFD600","target_minutes_daily":90})
    assert r.status_code==200; d=r.json(); assert d["name"]=="TEST_Math"; assert "id" in d
    yield d
    S.delete(f"{A}/subjects/{d['id']}")

# ---------- Subjects ----------
def test_list_subjects_no_id_leak(subj):
    r = S.get(f"{A}/subjects"); assert r.status_code==200
    for s in r.json(): assert "_id" not in s

def test_update_subject_propagates(subj):
    sid=subj["id"]
    sess=S.post(f"{A}/sessions", json={"subject_id":sid,"duration_minutes":10,"notes":"TEST"}).json()
    r=S.put(f"{A}/subjects/{sid}", json={"name":"TEST_Math2"}); assert r.status_code==200
    assert r.json()["name"]=="TEST_Math2"
    got=S.get(f"{A}/sessions").json()
    assert any(x["id"]==sess["id"] and x["subject_name"]=="TEST_Math2" for x in got)
    S.delete(f"{A}/sessions/{sess['id']}")

# ---------- Sessions ----------
def test_session_crud_and_filter(subj):
    sid=subj["id"]
    r=S.post(f"{A}/sessions", json={"subject_id":sid,"duration_minutes":30,"notes":"TEST_n","date":"2025-01-01"})
    assert r.status_code==200; sess=r.json(); assert sess["subject_name"].startswith("TEST_")
    r=S.get(f"{A}/sessions", params={"date_from":"2025-01-01","date_to":"2025-01-01"})
    assert any(x["id"]==sess["id"] for x in r.json())
    assert S.delete(f"{A}/sessions/{sess['id']}").status_code==200

# ---------- Stats ----------
def test_stats():
    for ep in ["/stats/today","/stats/weekly","/stats/streak"]:
        r=S.get(f"{A}{ep}"); assert r.status_code==200
    assert "total_minutes" in S.get(f"{A}/stats/today").json()
    assert len(S.get(f"{A}/stats/weekly").json()["days"])==7
    sk=S.get(f"{A}/stats/streak").json()
    assert all(k in sk for k in ["current","longest","active_days"])

# ---------- Settings ----------
def test_settings():
    r=S.get(f"{A}/settings"); assert r.status_code==200; orig=r.json()["daily_goal_minutes"]
    r=S.put(f"{A}/settings", json={"daily_goal_minutes":300}); assert r.json()["daily_goal_minutes"]==300
    S.put(f"{A}/settings", json={"daily_goal_minutes":orig})

# ---------- Export/Import (now includes journal + mock_tests) ----------
def test_export_includes_new_fields():
    r=S.get(f"{A}/export"); assert r.status_code==200
    d=r.json()
    for k in ["subjects","sessions","settings","journal","mock_tests"]:
        assert k in d, f"missing key {k} in export"
    assert isinstance(d["journal"], list) and isinstance(d["mock_tests"], list)

def test_import_replace_clears_journal_and_mocks():
    # seed one journal + one mock
    S.post(f"{A}/journal", json={"date":"2025-02-02","mood":"good","content":"TEST_seed"})
    S.post(f"{A}/mocks", json={"name":"TEST_seed_mock","date":"2025-02-02","score":50,"max_score":100})
    # import replace=true with empty arrays
    r=S.post(f"{A}/import?replace=true", json={"subjects":[],"sessions":[],"journal":[],"mock_tests":[]})
    assert r.status_code==200
    assert S.get(f"{A}/journal").json()==[]
    assert S.get(f"{A}/mocks").json()==[]

# ---------- Journal ----------
def test_journal_upsert_idempotent_on_date():
    d="2025-03-15"
    # cleanup first
    existing = S.get(f"{A}/journal/{d}").json()
    if existing.get("id"):
        S.delete(f"{A}/journal/{existing['id']}")
    r1=S.post(f"{A}/journal", json={"date":d,"mood":"good","content":"first"})
    assert r1.status_code==200
    eid=r1.json()["id"]; assert eid
    r2=S.post(f"{A}/journal", json={"date":d,"mood":"great","content":"second"})
    assert r2.status_code==200
    assert r2.json()["id"]==eid, "Same-date POST must update, not create new id"
    assert r2.json()["content"]=="second"
    assert r2.json()["mood"]=="great"
    # list filtered should contain exactly one for this date
    lst=S.get(f"{A}/journal", params={"date_from":d,"date_to":d}).json()
    assert len([x for x in lst if x["date"]==d])==1
    # GET by date returns the upserted entry
    g=S.get(f"{A}/journal/{d}").json()
    assert g["id"]==eid and g["content"]=="second"
    # cleanup
    assert S.delete(f"{A}/journal/{eid}").status_code==200

def test_journal_get_default_for_missing_date():
    g=S.get(f"{A}/journal/1999-01-01").json()
    assert g["date"]=="1999-01-01"
    assert g["id"] is None
    assert g.get("mood")=="okay"
    assert g.get("content")==""

def test_journal_delete_404():
    r=S.delete(f"{A}/journal/does-not-exist")
    assert r.status_code==404

# ---------- Mock Tests ----------
def test_mock_create_auto_percentage_and_listing():
    r=S.post(f"{A}/mocks", json={"name":"TEST_Mock1","date":"2025-04-01","score":80,"max_score":100,"notes":"TEST"})
    assert r.status_code==200; m1=r.json()
    assert m1["percentage"]==80.0
    r=S.post(f"{A}/mocks", json={"name":"TEST_Mock2","date":"2025-04-03","score":45,"max_score":90})
    assert r.status_code==200; m2=r.json()
    assert m2["percentage"]==50.0
    # list sorted desc by date
    lst=S.get(f"{A}/mocks").json()
    ours=[x for x in lst if x["id"] in (m1["id"], m2["id"])]
    assert len(ours)==2
    # date desc => m2 (2025-04-03) should appear before m1 (2025-04-01)
    idx2 = next(i for i,x in enumerate(lst) if x["id"]==m2["id"])
    idx1 = next(i for i,x in enumerate(lst) if x["id"]==m1["id"])
    assert idx2 < idx1, "Mocks must be sorted by date desc"
    # stats
    stats=S.get(f"{A}/mocks/stats/overview").json()
    for k in ["count","avg","best","worst","trend"]:
        assert k in stats
    assert stats["count"] >= 2
    assert isinstance(stats["trend"], list) and len(stats["trend"]) >= 2
    # cleanup
    assert S.delete(f"{A}/mocks/{m1['id']}").status_code==200
    assert S.delete(f"{A}/mocks/{m2['id']}").status_code==200

def test_mock_rejects_zero_or_negative_max_score():
    r=S.post(f"{A}/mocks", json={"name":"TEST_BadMax","date":"2025-04-01","score":10,"max_score":0})
    assert r.status_code==400
    r=S.post(f"{A}/mocks", json={"name":"TEST_BadMax2","date":"2025-04-01","score":10,"max_score":-5})
    assert r.status_code==400

def test_mock_delete_404():
    r=S.delete(f"{A}/mocks/does-not-exist")
    assert r.status_code==404

def test_mock_stats_empty_shape():
    # may not be empty if other data exists, but shape must hold
    s=S.get(f"{A}/mocks/stats/overview").json()
    for k in ["count","avg","best","worst","trend"]:
        assert k in s
