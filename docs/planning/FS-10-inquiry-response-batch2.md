# FS-10 — Inquiry context + Revenue inquiry response (Batch 2)

**Base:** `dev` @ `92f58e60ffd2705a8057320d39794a6d4b921c55`  
**Contract:** `agent-control-plane@1.0.0` (merged via Batch 1 / PR #21)

## API (standalone — no outbound provider send)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/tenant-context` | Tenant context envelope |
| POST | `/api/v1/tenant-context/resolve` | `CanonicalEntityRefV1` + `rv1` recordVersion |
| GET | `/api/v1/tenant-context/inquiries/:bookingRequestId` | Inquiry graph anchor (booking_request + optional customer/job) |
| POST | `/api/v1/revenue/inquiries/:bookingRequestId/response-draft` | Qualify inquiry + create `message.send_proposed` agent action (`awaiting_approval`) |
| GET | `/api/v1/agent-actions?state=awaiting_approval` | Approvals inbox feed (Figma Improved/02 `10:220` backend) |
| POST | `/api/v1/agent-actions/:id/approve` | Owner approval |
| POST | `/api/v1/agent-actions/:id/execute` | Persist execution receipt + audit only |

## Rules

- Rule-based qualification (no live LLM / no Twilio-SendGrid enqueue).
- `message.send_proposed` always requires owner approval before execute.
- Execute records `agent.execution_succeeded` — does **not** send to real customers.
