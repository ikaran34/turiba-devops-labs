# Failure Drill: API Outage

## Incident Summary
- **Time detected:** 20:45
- **Time resolved:** 20:47
- **Duration:** ~2 minutes
- **Impact:** The API became unreachable because all replicas were scaled to 0.

## Root Cause
I intentionally scaled the API deployment to 0 replicas to simulate a complete service outage.

## Resolution
I scaled the deployment back to 3 replicas. The pods restarted and the application returned to normal.

## Lessons Learned
- The system handles a full outage gracefully (no crash, just unavailable).
- Grafana correctly showed the pods disappearing from the CPU/Memory graphs.
- A real production system would need monitoring alerts to catch this faster.
