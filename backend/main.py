from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone
import json
import pandas as pd
import numpy as np

APP_NAME = "CSV Analytics SaaS"
DATA_DIR = Path(__file__).parent / "data"
DATASETS_DIR = DATA_DIR / "datasets"
INDEX_PATH = DATA_DIR / "index.json"

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()

def ensure_storage():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    if not INDEX_PATH.exists():
        INDEX_PATH.write_text(json.dumps({"datasets": []}, indent=2), encoding="utf-8")

def read_index() -> Dict[str, Any]:
    ensure_storage()
    try:
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"datasets": []}

def write_index(payload: Dict[str, Any]):
    ensure_storage()
    INDEX_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")

def dataset_dir(dataset_id: str) -> Path:
    return DATASETS_DIR / dataset_id

def safe_filename(name: str) -> str:
    keep = []
    for ch in name:
        if ch.isalnum() or ch in ("-", "_", ".", " "):
            keep.append(ch)
    out = "".join(keep).strip().replace(" ", "_")
    return out[:120] if out else "dataset.csv"

def load_csv(path: Path) -> pd.DataFrame:
    try:
        df = pd.read_csv(path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")
    if df.shape[1] == 0:
        raise HTTPException(status_code=400, detail="CSV has no columns")
    return df

def try_parse_datetime_series(s: pd.Series) -> Optional[pd.Series]:
    if s.dtype.kind in ("M",):
        return s
    if s.dtype == object or pd.api.types.is_string_dtype(s):
        parsed = pd.to_datetime(s, errors="coerce", utc=True, infer_datetime_format=True)
        ok = parsed.notna().mean() if len(parsed) else 0.0
        if ok >= 0.85:
            return parsed
    return None

def infer_col_type(s: pd.Series) -> Tuple[str, Optional[pd.Series]]:
    dt = try_parse_datetime_series(s)
    if dt is not None:
        return "date", dt
    if pd.api.types.is_bool_dtype(s):
        return "category", None
    if pd.api.types.is_numeric_dtype(s):
        return "number", None
    n = len(s)
    non_null = s.dropna()
    if n == 0:
        return "text", None
    uniq = non_null.nunique(dropna=True)
    uniq_ratio = (uniq / max(len(non_null), 1)) if len(non_null) else 0.0
    if uniq <= 50 or uniq_ratio <= 0.2:
        return "category", None
    return "text", None

def profile_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    rows = int(df.shape[0])
    cols = int(df.shape[1])

    missing_total = float(df.isna().sum().sum())
    denom = float(rows * cols) if rows and cols else 1.0
    missing_ratio_global = missing_total / denom

    col_profiles: List[Dict[str, Any]] = []

    for col in df.columns:
        s = df[col]
        miss = float(s.isna().mean()) if len(s) else 0.0
        inferred_type, dt_series = infer_col_type(s)
        unique_count = int(s.dropna().nunique()) if len(s) else 0

        entry: Dict[str, Any] = {
            "name": str(col),
            "type": inferred_type,
            "missing_ratio": float(miss),
            "unique_count": unique_count,
        }

        if inferred_type == "number":
            numeric = pd.to_numeric(s, errors="coerce")
            clean = numeric.dropna()
            entry["min"] = None if clean.empty else float(clean.min())
            entry["max"] = None if clean.empty else float(clean.max())
            entry["mean"] = None if clean.empty else float(clean.mean())
        elif inferred_type == "date":
            dts = dt_series if dt_series is not None else try_parse_datetime_series(s)
            if dts is None:
                entry["date_start"] = None
                entry["date_end"] = None
            else:
                clean = dts.dropna()
                entry["date_start"] = None if clean.empty else clean.min().isoformat()
                entry["date_end"] = None if clean.empty else clean.max().isoformat()
        elif inferred_type == "category":
            top = s.dropna().astype(str).value_counts().head(10)
            entry["top_values"] = [{"value": k, "count": int(v)} for k, v in top.items()]
        else:
            entry["sample_values"] = s.dropna().astype(str).head(5).tolist()

        col_profiles.append(entry)

    return {
        "rows": rows,
        "columns": cols,
        "missing_ratio": float(missing_ratio_global),
        "generated_at": iso_now(),
        "columns_profile": col_profiles,
    }

def build_histogram(values: pd.Series, bins: int = 20) -> Dict[str, Any]:
    v = pd.to_numeric(values, errors="coerce").dropna()
    if v.empty:
        return {"bins": []}
    counts, edges = np.histogram(v.to_numpy(), bins=bins)
    out_bins = []
    for i in range(len(counts)):
        out_bins.append(
            {
                "x0": float(edges[i]),
                "x1": float(edges[i + 1]),
                "count": int(counts[i]),
                "label": f"{edges[i]:.2f}–{edges[i+1]:.2f}",
            }
        )
    return {"bins": out_bins}

def pick_primary_metric(numeric_cols: List[str]) -> Optional[str]:
    preferred = [
        "revenue_usd",
        "revenue",
        "sales",
        "amount",
        "total",
        "orders",
        "units_sold",
        "profit",
    ]
    lower_map = {c.lower(): c for c in numeric_cols}
    for p in preferred:
        if p in lower_map:
            return lower_map[p]
    return numeric_cols[0] if numeric_cols else None

def generate_dashboard(df: pd.DataFrame, profile: Dict[str, Any]) -> Dict[str, Any]:
    cols_profile = profile["columns_profile"]
    numeric_cols = [c["name"] for c in cols_profile if c["type"] == "number"]
    date_cols = [c["name"] for c in cols_profile if c["type"] == "date"]
    cat_cols = [c["name"] for c in cols_profile if c["type"] == "category"]

    metric = pick_primary_metric(numeric_cols)

    kpis = [
        {"label": "Rows", "value": profile["rows"]},
        {"label": "Columns", "value": profile["columns"]},
        {"label": "Missing Ratio", "value": round(profile["missing_ratio"] * 100, 2), "suffix": "%"},
        {"label": "Generated", "value": profile["generated_at"]},
    ]

    charts: List[Dict[str, Any]] = []

    if date_cols and metric:
        dcol = date_cols[0]
        dts = try_parse_datetime_series(df[dcol])
        if dts is not None:
            tmp = df.copy()
            tmp[dcol] = dts
            tmp[metric] = pd.to_numeric(tmp[metric], errors="coerce")
            tmp = tmp.dropna(subset=[dcol, metric])
            tmp = tmp.sort_values(dcol)
            tmp["_date"] = tmp[dcol].dt.date.astype(str)
            group = tmp.groupby("_date")[metric].sum().reset_index()
            charts.append(
                {
                    "id": "line_date_metric",
                    "type": "line",
                    "title": f"{metric.replace('_',' ').title()} over time",
                    "xKey": "_date",
                    "series": [{"yKey": metric, "label": metric}],
                    "data": group.to_dict(orient="records"),
                }
            )

    chosen_cat = None
    if "product_category" in df.columns and any(c["name"] == "product_category" and c["type"] == "category" for c in cols_profile):
        chosen_cat = "product_category"
    elif cat_cols:
        chosen_cat = cat_cols[0]

    if chosen_cat and metric:
        tmp = df[[chosen_cat, metric]].copy()
        tmp[chosen_cat] = tmp[chosen_cat].astype(str)
        tmp[metric] = pd.to_numeric(tmp[metric], errors="coerce")
        tmp = tmp.dropna(subset=[chosen_cat, metric])
        agg = tmp.groupby(chosen_cat)[metric].sum().sort_values(ascending=False).head(10)
        data = [{"category": k, "value": float(v)} for k, v in agg.items()]
        charts.append(
            {
                "id": "bar_category_metric",
                "type": "bar",
                "title": f"Top {chosen_cat.replace('_',' ')} by {metric.replace('_',' ')}",
                "xKey": "category",
                "series": [{"yKey": "value", "label": metric}],
                "data": data,
                "meta": {"category": chosen_cat, "metric": metric},
            }
        )

    if len(numeric_cols) >= 2:
        nums = numeric_cols[: min(len(numeric_cols), 10)]
        best_pair = (nums[0], nums[1])
        best_score = -1.0

        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                a, b = nums[i], nums[j]
                xa = pd.to_numeric(df[a], errors="coerce")
                xb = pd.to_numeric(df[b], errors="coerce")
                m = pd.concat([xa, xb], axis=1).dropna()
                if len(m) < 25:
                    continue
                corr = m.corr(numeric_only=True).iloc[0, 1]
                score = float(abs(corr)) if not np.isnan(corr) else 0.0
                if score > best_score:
                    best_score = score
                    best_pair = (a, b)

        a, b = best_pair
        m = pd.concat([pd.to_numeric(df[a], errors="coerce"), pd.to_numeric(df[b], errors="coerce")], axis=1)
        m.columns = ["x", "y"]
        m = m.dropna()
        if len(m) > 800:
            m = m.sample(800, random_state=42)
        data = m.to_dict(orient="records")

        charts.append(
            {
                "id": "scatter_numeric_numeric",
                "type": "scatter",
                "title": f"Relationship: {a} vs {b}",
                "xKey": "x",
                "series": [{"yKey": "y", "label": b}],
                "meta": {"xLabel": a, "yLabel": b},
                "data": data,
            }
        )

    if metric:
        hist = build_histogram(df[metric], bins=20)
        data = [{"bucket": b["label"], "count": b["count"]} for b in hist["bins"]]
        charts.append(
            {
                "id": "hist_metric",
                "type": "hist",
                "title": f"Distribution of {metric.replace('_',' ')}",
                "xKey": "bucket",
                "series": [{"yKey": "count", "label": "Count"}],
                "data": data,
                "meta": {"metric": metric},
            }
        )

    return {"kpis": kpis, "charts": charts, "generated_at": iso_now()}

def save_json(path: Path, payload: Any):
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))

class DatasetMeta(BaseModel):
    id: str
    name: str
    rows: int
    columns: int
    created_at: str

@app.on_event("startup")
def on_startup():
    ensure_storage()

@app.get("/api/health")
def health():
    return {"ok": True, "name": APP_NAME, "time": iso_now()}

@app.post("/api/datasets/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    fname = safe_filename(file.filename)
    if not fname.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    dataset_id = str(uuid4())
    ddir = dataset_dir(dataset_id)
    ddir.mkdir(parents=True, exist_ok=True)

    csv_path = ddir / "original.csv"
    csv_path.write_bytes(content)

    df = load_csv(csv_path)

    meta = DatasetMeta(
        id=dataset_id,
        name=fname,
        rows=int(df.shape[0]),
        columns=int(df.shape[1]),
        created_at=iso_now(),
    ).model_dump()

    profile = profile_dataframe(df)
    dashboard = generate_dashboard(df, profile)

    save_json(ddir / "meta.json", meta)
    save_json(ddir / "profile.json", profile)
    save_json(ddir / "dashboard.json", dashboard)

    idx = read_index()
    items = idx.get("datasets", [])
    items = [x for x in items if x.get("id") != dataset_id]
    items.insert(0, meta)
    idx["datasets"] = items
    write_index(idx)

    return {"id": dataset_id, "meta": meta}

@app.get("/api/datasets")
def list_datasets():
    idx = read_index()
    return {"datasets": idx.get("datasets", [])}

@app.get("/api/datasets/{dataset_id}/preview")
def preview_dataset(dataset_id: str):
    ddir = dataset_dir(dataset_id)
    csv_path = ddir / "original.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="Dataset not found")
    df = load_csv(csv_path)
    head = df.head(50)
    cols = [str(c) for c in head.columns]
    rows = head.replace({np.nan: None}).to_dict(orient="records")
    return {"columns": cols, "rows": rows}

@app.get("/api/datasets/{dataset_id}/profile")
def get_profile(dataset_id: str):
    path = dataset_dir(dataset_id) / "profile.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Profile not found")
    return JSONResponse(load_json(path))

@app.get("/api/datasets/{dataset_id}/dashboard")
def get_dashboard(dataset_id: str):
    path = dataset_dir(dataset_id) / "dashboard.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return JSONResponse(load_json(path))
