# Deployment Guide

This guide covers deploying FinPilot AI to a production Kubernetes environment (e.g., AWS EKS, Google GKE, DigitalOcean K8s).

## Prerequisites
- A running Kubernetes cluster.
- `kubectl` configured to interact with your cluster.
- Ingress controller (e.g., NGINX Ingress Controller) installed.
- `cert-manager` installed for TLS certificates.
- A managed PostgreSQL instance (e.g., AWS RDS, GCP Cloud SQL) is highly recommended over running Postgres in K8s.
- A managed Redis instance (e.g., AWS ElastiCache, GCP Memorystore).

## 1. Secrets & ConfigMaps

First, create a Kubernetes Secret to store sensitive environment variables:

```bash
kubectl create namespace finpilot

kubectl create secret generic finpilot-secrets \
  --namespace finpilot \
  --from-literal=DATABASE_URL="postgresql+asyncpg://user:pass@db-host:5432/finpilot" \
  --from-literal=REDIS_URL="redis://redis-host:6379/0" \
  --from-literal=CELERY_BROKER_URL="redis://redis-host:6379/1" \
  --from-literal=CELERY_RESULT_BACKEND="redis://redis-host:6379/2" \
  --from-literal=JWT_SECRET_KEY="generate-a-long-random-string-here" \
  --from-literal=ENCRYPTION_KEY="generate-a-32-byte-string-here" \
  --from-literal=OPENAI_API_KEY="sk-proj-..."
```

*(You can also use a secret management system like HashiCorp Vault or AWS Secrets Manager synced via External Secrets Operator).*

## 2. Deploy Services

Apply the Kubernetes manifests from the `infrastructure/k8s/` directory. Be sure to update the image tags in the Deployment YAMLs if you pushed your Docker images to a private registry.

```bash
kubectl apply -f infrastructure/k8s/backend.yaml
kubectl apply -f infrastructure/k8s/frontend.yaml
```

*(Note: We recommend adding a similar Deployment YAML for the Celery Worker, utilizing the same backend image but overriding the `command` to `celery -A app.tasks.celery_app worker`)*

## 3. Configure Ingress

Update `infrastructure/k8s/ingress.yaml` to match your domain names (e.g., `finpilot.ai` and `api.finpilot.ai`). Ensure DNS A-records are pointed to your Ingress controller's external IP.

```bash
kubectl apply -f infrastructure/k8s/ingress.yaml
```

Wait a few minutes for `cert-manager` to provision your Let's Encrypt certificates.

## 4. Run Database Migrations

You will need to run the Alembic migrations against your production database. You can do this by executing a one-off pod or running it from a bastion host:

```bash
# Execute within a backend pod:
kubectl exec -it deployment/finpilot-backend -n finpilot -- alembic upgrade head
```

## 5. CI/CD Integration

The provided `.github/workflows/ci-cd.yml` handles:
1. Running PyTest and Jest tests.
2. Building and pushing Docker images to GitHub Container Registry (GHCR).
3. Rolling out the new deployments to Kubernetes via `kubectl set image`.

Ensure you configure the necessary GitHub Actions Secrets (e.g., `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) if using AWS.
