#!/usr/bin/env python3
"""
ShipForge API Health Check
==========================
Operational script that validates all critical system components are live
and responding correctly. Run manually, in CI, or on a cron schedule.

Usage:
    python3 scripts/health_check.py                    # uses defaults
    python3 scripts/health_check.py --host localhost --port 5000
    python3 scripts/health_check.py --env ../.env      # load from specific .env
    python3 scripts/health_check.py --json             # machine-readable JSON output
    python3 scripts/health_check.py --timeout 10       # custom timeout (seconds)
    python3 scripts/health_check.py --skip-env         # skip env var check (for CI)

Exit codes:
    0  All checks passed
    1  One or more checks failed
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


# ─── ANSI colours (disabled automatically when output is piped) ──────────────
USE_COLOUR = sys.stdout.isatty()

def _c(code, text):
    return f"\033[{code}m{text}\033[0m" if USE_COLOUR else text

GREEN  = lambda t: _c("32;1", t)
RED    = lambda t: _c("31;1", t)
YELLOW = lambda t: _c("33;1", t)
BOLD   = lambda t: _c("1", t)
DIM    = lambda t: _c("2", t)


# ─── Result tracking ──────────────────────────────────────────────────────────
class CheckResult:
    def __init__(self, name):
        self.name    = name
        self.passed  = False
        self.message = ""
        self.detail  = {}
        self.latency = 0.0

    def ok(self, message, detail=None):
        self.passed  = True
        self.message = message
        self.detail  = detail or {}
        return self

    def fail(self, message, detail=None):
        self.passed  = False
        self.message = message
        self.detail  = detail or {}
        return self


# ─── .env loader (zero external dependencies — stdlib only) ──────────────────
def load_dotenv(path):
    """
    Parse a .env file and return a dict.
    Handles quoted values, inline comments, and blank lines.
    Does NOT override existing environment variables.
    """
    env = {}
    try:
        with open(path) as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key   = key.strip()
                # Strip inline comments (e.g.  PORT=5000   # api port)
                value = value.split("#")[0].strip().strip('"').strip("'")
                env[key] = value
    except FileNotFoundError:
        pass
    return env


# ─── HTTP helper ──────────────────────────────────────────────────────────────
def http_get(url, timeout):
    """
    GET a JSON URL. Returns (status_code, body_dict, latency_seconds).
    Raises ConnectionError on network failure.
    """
    start = time.perf_counter()
    req   = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            latency = time.perf_counter() - start
            body    = json.loads(resp.read().decode())
            return resp.status, body, latency
    except urllib.error.HTTPError as e:
        latency = time.perf_counter() - start
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {"error": str(e)}
        return e.code, body, latency


def http_post_json(url, payload, timeout):
    """POST JSON payload. Returns (status_code, body_dict, latency_seconds)."""
    data  = json.dumps(payload).encode()
    req   = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            latency = time.perf_counter() - start
            return resp.status, json.loads(resp.read().decode()), latency
    except urllib.error.HTTPError as e:
        latency = time.perf_counter() - start
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {"error": str(e)}
        return e.code, body, latency


# ─── Individual checks ────────────────────────────────────────────────────────

def check_env_vars(env_path):
    """
    Validates required environment variables are set and look valid.
    Warns (but does not fail) on weak JWT_SECRET or missing optional vars.
    """
    r = CheckResult("Environment Variables")
    required = ["DATABASE_URL", "JWT_SECRET"]
    optional = ["NODE_ENV", "PORT", "CORS_ORIGIN", "BCRYPT_ROUNDS"]

    env      = load_dotenv(env_path)
    all_vars = {**env, **os.environ}   # process env takes precedence

    missing = [k for k in required if not all_vars.get(k)]
    if missing:
        return r.fail(
            f"Missing required vars: {', '.join(missing)}",
            {"hint": f"Copy backend/.env.example to backend/.env and fill in the values"}
        )

    warnings = []

    jwt = all_vars.get("JWT_SECRET", "")
    if len(jwt) < 32:
        warnings.append(
            f"JWT_SECRET is only {len(jwt)} chars — use ≥64 random bytes in production"
        )

    db_url = all_vars.get("DATABASE_URL", "")
    if not (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
        warnings.append("DATABASE_URL doesn't start with postgresql:// — double-check the connection string")

    absent = [k for k in optional if not all_vars.get(k)]
    if absent:
        warnings.append(f"Optional vars not set (using defaults): {', '.join(absent)}")

    if warnings:
        return r.ok("Required vars present — see warnings below", {"warnings": warnings})
    return r.ok("All required environment variables present and valid")


def check_health_endpoint(base_url, timeout):
    """
    Calls GET /api/health — the same endpoint used by the Docker HEALTHCHECK.
    Validates the response has success:true and an uptime field.
    """
    r   = CheckResult("API Health Endpoint  (/api/health)")
    url = f"{base_url}/api/health"
    try:
        status, body, latency = http_get(url, timeout)
        r.latency = latency

        if status != 200:
            return r.fail(f"HTTP {status} — expected 200", {"url": url, "body": body})
        if not body.get("success"):
            return r.fail("Response missing success:true", {"body": body})

        uptime  = body.get("uptime", "?")
        version = body.get("version", "?")
        return r.ok(
            f"Healthy · v{version} · uptime {uptime}s · {latency*1000:.0f}ms",
            {"service": body.get("service"), "uptime_seconds": uptime, "version": version}
        )
    except Exception as exc:
        return r.fail(f"Connection refused — is the backend running? ({exc})", {"url": url})


def check_auth_reachability(base_url, timeout):
    """
    Posts deliberately bad credentials to POST /api/auth/login.
    Expects exactly 401 — proves auth middleware and DB are up and routing correctly.
    A 200 here would mean the auth system is broken.
    A 500 means the DB is likely down.
    """
    r   = CheckResult("Auth System  (POST /api/auth/login)")
    url = f"{base_url}/api/auth/login"
    try:
        status, body, latency = http_post_json(
            url,
            {"email": "healthcheck@shipforge.internal", "password": "HealthCheck!NotReal999"},
            timeout,
        )
        r.latency = latency

        if status == 401:
            return r.ok(f"Auth responding correctly (401 for bad creds) · {latency*1000:.0f}ms")
        if status == 429:
            # Rate limited — still means the auth system is up
            return r.ok(
                f"Rate limiter active (429) — auth is live · {latency*1000:.0f}ms",
                {"note": "Rate limited; expected in production or after repeated runs"}
            )
        if status == 500:
            return r.fail(
                "500 from auth — database may be unreachable",
                {"hint": "Check DATABASE_URL and that the db container is healthy"}
            )
        if status == 200:
            return r.fail(
                "Unexpected 200 for fake credentials — auth bypass detected",
                {"critical": True}
            )
        return r.fail(f"Unexpected HTTP {status}", {"body": body, "url": url})
    except Exception as exc:
        return r.fail(f"Connection refused ({exc})", {"url": url})


def check_404_shape(base_url, timeout):
    """
    Requests a nonexistent route and validates the error response follows
    the project's standard JSON shape: { success: false, message: '...' }.
    This confirms the 404 catch-all middleware in app.js is active.
    """
    r   = CheckResult("404 Handler  (JSON error shape)")
    url = f"{base_url}/api/__healthcheck_nonexistent_{int(time.time())}__"
    try:
        status, body, latency = http_get(url, timeout)
        r.latency = latency
        if status == 404 and body.get("success") is False and "message" in body:
            return r.ok(f"404 returns correct {{success:false, message}} shape · {latency*1000:.0f}ms")
        return r.fail(
            f"Expected 404 + JSON shape, got HTTP {status}",
            {"body": body, "hint": "Check app.js 404 handler"}
        )
    except Exception as exc:
        return r.fail(f"Connection refused ({exc})", {"url": url})


def check_latency(base_url, timeout, warn_ms=300.0):
    """
    Hits /api/health three times and reports avg/p50 latency.
    Fails if average exceeds warn_ms (default 300ms).
    """
    r   = CheckResult(f"Response Latency  (warn > {warn_ms:.0f}ms avg)")
    url = f"{base_url}/api/health"
    samples = []
    try:
        for _ in range(3):
            _, _, lat = http_get(url, timeout)
            samples.append(lat * 1000)
            time.sleep(0.05)

        avg = sum(samples) / len(samples)
        p50 = sorted(samples)[1]
        r.latency = avg / 1000

        detail = {"samples_ms": [round(s) for s in samples], "avg_ms": round(avg), "p50_ms": round(p50)}
        if avg <= warn_ms:
            return r.ok(f"avg {avg:.0f}ms  p50 {p50:.0f}ms", detail)
        return r.fail(
            f"avg {avg:.0f}ms exceeds {warn_ms:.0f}ms threshold",
            {**detail, "hint": "Check DB query performance or container resource limits"}
        )
    except Exception as exc:
        return r.fail(f"Connection refused ({exc})")


# ─── Report printer ───────────────────────────────────────────────────────────
def print_human(results, elapsed):
    passed = sum(1 for r in results if r.passed)
    total  = len(results)
    all_ok = passed == total

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print()
    print(BOLD(f"  ShipForge Health Check  ·  {now}"))
    print(DIM("  " + "─" * 56))
    print()

    for r in results:
        icon   = GREEN("✓") if r.passed else RED("✗")
        lat    = DIM(f"  {r.latency*1000:.0f}ms") if r.latency else ""
        msg    = GREEN(r.message) if r.passed else RED(r.message)
        print(f"  {icon}  {BOLD(r.name)}")
        print(f"     {msg}{lat}")
        if r.detail:
            for k, v in r.detail.items():
                if k == "warnings":
                    for w in v:
                        print(f"       {YELLOW('⚠')}  {DIM(w)}")
                elif k not in ("url", "critical"):
                    print(f"       {DIM(k + ':')}  {DIM(str(v))}")
        print()

    print(DIM("  " + "─" * 56))
    summary = f"  {passed}/{total} checks passed  ·  {elapsed:.2f}s total"
    if all_ok:
        print(GREEN(f"{summary}  ✓ ALL HEALTHY"))
    else:
        print(RED(f"{summary}  ✗ {total - passed} FAILED"))
    print()


def print_json(results, elapsed):
    report = {
        "timestamp":       datetime.now(timezone.utc).isoformat(),
        "all_ok":          all(r.passed for r in results),
        "passed":          sum(1 for r in results if r.passed),
        "total":           len(results),
        "elapsed_seconds": round(elapsed, 3),
        "checks": [
            {
                "name":       r.name,
                "passed":     r.passed,
                "message":    r.message,
                "latency_ms": round(r.latency * 1000, 1),
                "detail":     r.detail,
            }
            for r in results
        ],
    }
    print(json.dumps(report, indent=2))


# ─── Entry point ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="ShipForge API Health Check — validates all critical system components",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--host",     default="localhost",  help="API host (default: localhost)")
    parser.add_argument("--port",     default="5000",       help="API port (default: 5000)")
    parser.add_argument("--env",      default=None,         help="Path to .env file (default: auto-detect)")
    parser.add_argument("--timeout",  default=8.0, type=float, help="HTTP timeout in seconds (default: 8)")
    parser.add_argument("--warn-ms",  default=300.0, type=float, help="Latency warning threshold ms (default: 300)")
    parser.add_argument("--json",     action="store_true",  help="Output JSON instead of human-readable text")
    parser.add_argument("--skip-env", action="store_true",  help="Skip .env validation (useful in CI)")
    args = parser.parse_args()

    # Auto-detect .env: script lives at backend/scripts/health_check.py
    # So backend/.env is one directory up from scripts/
    if args.env:
        env_path = str(Path(args.env).resolve())
    else:
        env_path = str(Path(__file__).parent.parent / ".env")

    base_url = f"http://{args.host}:{args.port}"

    t0      = time.perf_counter()
    results = []

    if not args.skip_env:
        results.append(check_env_vars(env_path))

    results.append(check_health_endpoint(base_url, args.timeout))
    results.append(check_auth_reachability(base_url, args.timeout))
    results.append(check_404_shape(base_url, args.timeout))
    results.append(check_latency(base_url, args.timeout, args.warn_ms))

    elapsed = time.perf_counter() - t0

    if args.json:
        print_json(results, elapsed)
    else:
        print_human(results, elapsed)

    sys.exit(0 if all(r.passed for r in results) else 1)


if __name__ == "__main__":
    main()