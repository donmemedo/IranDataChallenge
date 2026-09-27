"""IranDataChallenge API: challenges, scored CSV submissions, leaderboards, B2B leads."""
import csv
import io
import math
import os
import random
import sqlite3
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

DB = os.getenv("DB_PATH", "data/app.db")
N = 300  # rows in every hidden test set
MAX_UPLOAD = 2 * 1024 * 1024

# ponytail: challenges live in code; move to a table when an admin panel creates them.
# task: ("cls", n_classes) or ("reg", mean, std) -> drives synthetic hidden ground truth.
CHALLENGES = [
    dict(slug="bank-churn", kind="private", sector="bank", metric="accuracy", task=("cls", 2), prize=1200, days=21, base=312,
         org_fa="بانک نوآوران پارس", org_en="Novavaran Pars Bank",
         title_fa="پیش‌بینی ریزش مشتریان بانک", title_en="Bank Customer Churn Prediction",
         summary_fa="کدام مشتریان در سه ماه آینده حساب خود را می‌بندند؟", summary_en="Which customers will close their accounts in the next three months?",
         desc_fa="داده ناشناس‌سازی‌شده تراکنش‌ها و رفتار ۱۸ ماه اخیر مشتریان. مدل برنده مستقیم وارد سامانه باشگاه مشتریان بانک می‌شود.",
         desc_en="Anonymized transactions and 18 months of customer behavior. The winning model ships straight into the bank's loyalty system.",
         features=["tenure_months", "avg_balance", "tx_count_90d", "card_usage", "branch_visits", "app_logins", "complaints"]),
    dict(slug="insurance-fraud", kind="private", sector="insurance", metric="macro_f1", task=("cls", 2), prize=950, days=34, base=187,
         org_fa="بیمه آسمان‌نما", org_en="Asemannama Insurance",
         title_fa="کشف تقلب در خسارت بیمه خودرو", title_en="Auto Insurance Fraud Detection",
         summary_fa="پرونده‌های مشکوک خسارت را پیش از پرداخت شناسایی کنید.", summary_en="Flag suspicious claims before they are paid out.",
         desc_fa="پرونده‌های خسارت با ویژگی‌های خودرو، راننده و محل حادثه. داده حساس است و شرکت در چالش نیازمند پذیرش NDA است.",
         desc_en="Claim files with vehicle, driver and accident-site features. Sensitive data: joining requires accepting an NDA.",
         features=["vehicle_age", "claim_amount", "days_to_report", "prior_claims", "region", "garage_id", "witness"]),
    dict(slug="persian-sentiment", kind="public", sector="retail", metric="macro_f1", task=("cls", 3), prize=420, days=12, base=864,
         org_fa="فروشگاه آنلاین بازارچه", org_en="Bazarcheh Online Store",
         title_fa="تحلیل احساس دیدگاه‌های فارسی", title_en="Persian Review Sentiment Analysis",
         summary_fa="دیدگاه کاربران را به مثبت، منفی یا خنثی دسته‌بندی کنید.", summary_en="Classify user reviews as positive, negative or neutral.",
         desc_fa="بیش از ۱۲۰ هزار دیدگاه فارسی محاوره‌ای با غلط املایی، ایموجی و فینگلیش. برچسب‌ها: ۰ منفی، ۱ خنثی، ۲ مثبت.",
         desc_en="120k+ colloquial Persian reviews with typos, emoji and Finglish. Labels: 0 negative, 1 neutral, 2 positive.",
         features=["review_text", "product_category", "rating_hint", "length", "has_emoji"]),
    dict(slug="tehran-air", kind="public", sector="health", metric="rmse", task=("reg", 95, 35), prize=380, days=45, base=421,
         org_fa="شبکه پایش هوای شهری", org_en="Urban Air Monitoring Network",
         title_fa="پیش‌بینی کیفیت هوای تهران", title_en="Tehran Air Quality Forecasting",
         summary_fa="شاخص AQI فردای ۲۲ منطقه تهران را پیش‌بینی کنید.", summary_en="Forecast tomorrow's AQI for Tehran's 22 districts.",
         desc_fa="داده ساعتی ایستگاه‌های پایش، هواشناسی و ترافیک. مدل برنده برای هشدار زودهنگام تعطیلی مدارس استفاده می‌شود.",
         desc_en="Hourly station, weather and traffic data. The winning model powers early school-closure alerts.",
         features=["district", "pm25_lag24", "wind_speed", "humidity", "inversion", "traffic_index", "weekday"]),
    dict(slug="power-load", kind="public", sector="energy", metric="rmse", task=("reg", 520, 110), prize=450, days=28, base=298,
         org_fa="توزیع نیروی آریا", org_en="Aria Power Distribution",
         title_fa="پیش‌بینی بار شبکه برق در پیک تابستان", title_en="Summer Peak Power Load Forecasting",
         summary_fa="بار ساعتی هر پست برق را برای مدیریت خاموشی پیش‌بینی کنید.", summary_en="Predict hourly substation load to plan around blackouts.",
         desc_fa="سه سال داده مصرف ساعتی ۴۰ پست توزیع همراه با دما و تعطیلات. واحد: مگاوات.",
         desc_en="Three years of hourly load from 40 substations with temperature and holidays. Unit: MW.",
         features=["substation", "hour", "temp_c", "holiday", "industrial_share", "load_lag168"]),
    dict(slug="telecom-anomaly", kind="private", sector="telecom", metric="macro_f1", task=("cls", 2), prize=1500, days=40, base=143,
         org_fa="اپراتور همراه‌نت", org_en="HamrahNet Operator",
         title_fa="تشخیص ناهنجاری ترافیک شبکه مخابراتی", title_en="Telecom Network Anomaly Detection",
         summary_fa="حملات و خرابی‌ها را در ترافیک سلول‌ها زودتر از مانیتورینگ کشف کنید.", summary_en="Catch attacks and faults in cell traffic before monitoring does.",
         desc_fa="ترافیک تجمیعی ۵ دقیقه‌ای سلول‌ها در محیط Sandbox داخلی. داده از زیرساخت اپراتور خارج نمی‌شود.",
         desc_en="5-minute aggregated cell traffic inside an on-prem sandbox. Data never leaves the operator.",
         features=["cell_id", "throughput", "drop_rate", "handover_fail", "users", "latency_p95"]),
    dict(slug="retail-demand", kind="public", sector="retail", metric="rmse", task=("reg", 140, 60), prize=300, days=18, base=356,
         org_fa="زنجیره فروشگاهی سبزینه", org_en="Sabzineh Chain Stores",
         title_fa="پیش‌بینی تقاضای فروشگاه‌های زنجیره‌ای", title_en="Chain-Store Demand Forecasting",
         summary_fa="فروش هفتگی هر کالا در هر شعبه را پیش‌بینی کنید.", summary_en="Forecast weekly sales per item per branch.",
         desc_fa="فروش ۲ ساله ۱۵۰ شعبه با تخفیف‌ها، مناسبت‌ها و ماه رمضان. کمترین خطا یعنی کمترین کالای فاسدشده.",
         desc_en="Two years of sales across 150 branches with promos, holidays and Ramadan. Lower error, less spoiled stock.",
         features=["store_id", "item_id", "week", "promo", "occasion", "price", "sales_lag4"]),
    dict(slug="hoda-digits", kind="academic", sector="education", metric="accuracy", task=("cls", 10), prize=60, days=9, base=512,
         org_fa="کلاس یادگیری ماشین ۱۴۰۵", org_en="Machine Learning Class 1405",
         title_fa="بازشناسی ارقام دست‌نویس فارسی", title_en="Persian Handwritten Digit Recognition",
         summary_fa="چالش کلاسی: ارقام ۰ تا ۹ فارسی را از تصویر بازشناسی کنید.", summary_en="Class challenge: recognize Persian digits 0-9 from images.",
         desc_fa="تصاویر ۳۲×۳۲ ارقام دست‌نویس فارسی. مناسب برای اولین تجربه شرکت در چالش؛ رتبه‌ها در کارنامه درس ثبت می‌شود.",
         desc_en="32×32 images of handwritten Persian digits. A friendly first challenge; ranks count toward the course grade.",
         features=["pixel_0", "…", "pixel_1023"]),
]
BY_SLUG = {c["slug"]: c for c in CHALLENGES}
TEAMS = ["تیم سیمرغ", "DeepPersia", "نوروز AI", "Gradient Gang", "کهکشان داده", "Zagros ML", "آرش کمانگیر", "Tensor Tehran",
         "دماوند", "Kaveh Labs", "پارس‌نت", "Overfit Outlaws", "سپیدار", "Caspian Minds", "ققنوس", "Shiraz Signals"]
HIGHER_BETTER = {"accuracy": True, "macro_f1": True, "rmse": False}


def higher_better(c):
    return HIGHER_BETTER[c["metric"]]


def truth(c):
    r = random.Random(c["slug"])
    t = c["task"]
    if t[0] == "reg":
        return [round(r.gauss(t[1], t[2]), 2) for _ in range(N)]
    return [r.randrange(t[1]) for _ in range(N)]


def score(metric, y, p):
    if metric == "rmse":
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(y, p)) / len(y))
    if metric == "accuracy":
        return sum(a == b for a, b in zip(y, p)) / len(y)
    f1s = []  # macro F1
    for k in set(y):
        tp = sum(a == k == b for a, b in zip(y, p))
        fp = sum(b == k != a for a, b in zip(y, p))
        fn = sum(a == k != b for a, b in zip(y, p))
        f1s.append(2 * tp / (2 * tp + fp + fn))
    return sum(f1s) / len(f1s)


def noisy(c, y, r, level):
    """Simulated competitor predictions: truth corrupted by `level` in [0, 1]."""
    t = c["task"]
    if t[0] == "reg":
        return [v + r.gauss(0, t[2] * level) for v in y]
    return [v if r.random() > level else r.randrange(t[1]) for v in y]


def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


def init():
    os.makedirs(os.path.dirname(DB) or ".", exist_ok=True)
    with db() as con:
        con.execute("CREATE TABLE IF NOT EXISTS subs (id INTEGER PRIMARY KEY, challenge TEXT, team TEXT, score REAL, created TEXT)")
        con.execute("CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY, name TEXT, org TEXT, contact TEXT, kind TEXT, message TEXT, created TEXT)")
        if con.execute("SELECT COUNT(*) FROM subs").fetchone()[0]:
            return
        now = datetime.now(timezone.utc)
        for c in CHALLENGES:
            r, y = random.Random(c["slug"] + "-seed"), truth(c)
            for team in r.sample(TEAMS, r.randint(9, 14)):
                skill = r.uniform(0.15, 0.7)
                for _ in range(r.randint(1, 4)):
                    s = score(c["metric"], y, noisy(c, y, r, skill * r.uniform(0.9, 1.4)))
                    when = (now - timedelta(hours=r.randint(1, 400))).isoformat()
                    con.execute("INSERT INTO subs (challenge, team, score, created) VALUES (?,?,?,?)", (c["slug"], team, s, when))


init()
app = FastAPI(title="IranDataChallenge API")
TODAY = date.today()


def leaderboard(c):
    agg = "MAX" if higher_better(c) else "MIN"
    rows = db().execute(
        f"SELECT team, {agg}(score) best, COUNT(*) n, MAX(created) last FROM subs WHERE challenge=? GROUP BY team ORDER BY best {'DESC' if higher_better(c) else 'ASC'}",
        (c["slug"],)).fetchall()
    return [dict(rank=i + 1, team=r["team"], score=round(r["best"], 5), entries=r["n"], last=r["last"]) for i, r in enumerate(rows)]


def summary(c, teams=None):
    teams = len(leaderboard(c)) if teams is None else teams
    out = {k: v for k, v in c.items() if k not in ("task", "days", "base", "features", "desc_fa", "desc_en")}
    return out | dict(higher_better=higher_better(c), days_left=c["days"], deadline=(TODAY + timedelta(days=c["days"])).isoformat(),
                      participants=c["base"] + teams, teams=teams)


def get(slug):
    if slug not in BY_SLUG:
        raise HTTPException(404, "not_found")
    return BY_SLUG[slug]


def bad(code):
    raise HTTPException(400, code)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/stats")
def stats():
    with db() as con:
        subs = con.execute("SELECT COUNT(*) FROM subs").fetchone()[0]
    items = [summary(c) for c in CHALLENGES]
    return dict(members=sum(i["participants"] for i in items), challenges=len(items), submissions=subs,
                prize_pool=sum(c["prize"] for c in CHALLENGES), organizations=len({c["org_en"] for c in CHALLENGES}))


@app.get("/api/challenges")
def challenges():
    return [summary(c) for c in CHALLENGES]


@app.get("/api/challenges/{slug}")
def challenge(slug: str):
    c = get(slug)
    board = leaderboard(c)
    return summary(c, len(board)) | dict(desc_fa=c["desc_fa"], desc_en=c["desc_en"], features=c["features"], rows=N,
                                         start=(TODAY - timedelta(days=60 - c["days"] % 30)).isoformat(),
                                         top=board[0]["score"] if board else None)


@app.get("/api/challenges/{slug}/leaderboard")
def board(slug: str):
    return leaderboard(get(slug))


@app.get("/api/challenges/{slug}/sample.csv")
def sample(slug: str):
    c, r = get(slug), random.Random(slug + "-sample")
    t = c["task"]
    preds = [round(t[1], 2)] * N if t[0] == "reg" else [r.randrange(t[1]) for _ in range(N)]
    body = "id,prediction\n" + "".join(f"{i},{p}\n" for i, p in enumerate(preds, 1))
    return PlainTextResponse(body, media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{slug}_sample_submission.csv"'})


def parse(raw, c):
    try:
        rows = list(csv.reader(io.StringIO(raw.decode("utf-8-sig"))))
    except (UnicodeDecodeError, csv.Error):
        bad("bad_file")
    if not rows or [h.strip().lower() for h in rows[0]] != ["id", "prediction"]:
        bad("bad_header")
    reg = c["task"][0] == "reg"
    pred = {}
    for row in rows[1:]:
        if not row:
            continue
        try:
            v = float(row[1]) if reg else int(row[1])
            pred[int(row[0])] = v
        except (ValueError, IndexError):
            bad("bad_value")
        if reg and not math.isfinite(v):
            bad("bad_value")
    if any(i not in pred for i in range(1, N + 1)):
        bad("missing_ids")
    return [pred[i] for i in range(1, N + 1)]


@app.post("/api/challenges/{slug}/submit")
async def submit(slug: str, team: str = Form(...), file: UploadFile = File(...), nda: bool = Form(False)):
    c = get(slug)
    team = team.strip()
    if not 2 <= len(team) <= 40:
        bad("bad_team")
    if c["kind"] == "private" and not nda:
        bad("nda_required")
    raw = await file.read(MAX_UPLOAD + 1)
    if len(raw) > MAX_UPLOAD:
        bad("too_large")
    s = score(c["metric"], truth(c), parse(raw, c))
    with db() as con:
        con.execute("INSERT INTO subs (challenge, team, score, created) VALUES (?,?,?,?)",
                    (slug, team, s, datetime.now(timezone.utc).isoformat()))
    rows = leaderboard(c)
    me = next(r for r in rows if r["team"] == team)
    return dict(score=round(s, 5), best=me["score"], rank=me["rank"], total=len(rows), metric=c["metric"], higher_better=higher_better(c))


class Lead(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    org: str = Field(min_length=2, max_length=120)
    contact: str = Field(min_length=5, max_length=120)
    kind: Literal["public", "private", "academic", "talent", "mlops"]
    message: str = Field("", max_length=2000)


@app.post("/api/leads")
def lead(body: Lead):
    with db() as con:
        con.execute("INSERT INTO leads (name, org, contact, kind, message, created) VALUES (?,?,?,?,?,?)",
                    (body.name, body.org, body.contact, body.kind, body.message, datetime.now(timezone.utc).isoformat()))
    return {"ok": True}
