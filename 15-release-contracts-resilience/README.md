# Module 15: Release Contracts and Resilience

> Shipping safely is a product feature. Contracts, rollout controls, and failure drills make the difference between a demo and a system you can trust.

## The Story

Your microservices are already working. The new problem is shipping them without surprises.

The team needs three things before the next launch:

- a published OpenAPI contract that external clients can rely on
- a release strategy that keeps deployments boring and reversible
- load and failure drills that show you what happens before production does

This module turns the existing Ship It stack into a release-ready platform.

## What You'll Build

- **OpenAPI publishing** for the public API contract
- **Failure drills** so you can rehearse dependency outages safely
- **Load test script** to validate the API under repeated traffic
- **Release-oriented deployment flow** with Docker and CI preserved from Module 11

## How It Fits In

Module 11 taught the mechanics of shipping. This module teaches the guardrails:

1. publish the contract
2. exercise the failure mode
3. verify the load path
4. roll forward and roll back with confidence

## Running It

```bash
docker compose up -d
npm run load:test
bash scripts/smoke-test.sh
```

## Key Concepts

### Contract-First Releases

The OpenAPI spec becomes part of the release artifact. Consumers can validate against it, and reviewers can spot breaking changes before rollout.

### Failure Injection

The app exposes a controlled endpoint that simulates a downstream failure. That lets you rehearse incidents without touching production systems.

### Load Testing

The included load test script makes repeated requests to the public API so you can catch obvious performance regressions before they land.

## Prerequisites

- Module 11 completed
- Docker Desktop running
- Node.js 20+

## Course Map

This module closes the last major gap in the masterclass:

- deployment strategy
- API contracts
- resilience drills

