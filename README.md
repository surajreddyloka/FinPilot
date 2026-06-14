# FinPilot AI

FinPilot AI is an enterprise-grade AI-powered personal finance assistant built with FastAPI, Next.js, and LangChain.

## 🌟 Features
- **AI Financial Copilot**: Chat with your data to get deep insights, spending analysis, and custom budgeting using RAG.
- **Automated Categorization**: Machine learning classification of transactions with high accuracy.
- **Predictive Forecasting**: Projects your 6-12 month financial trajectory.
- **Health Scoring Engine**: A dynamic FICO-style financial health score.
- **Bank-level Security**: AES-256 field-level encryption for sensitive data, JWT, and TOTP MFA.

## 🏗 Tech Stack
- **Backend**: FastAPI (Python 3.12), PostgreSQL (AsyncPG), SQLAlchemy 2.0, Celery, Redis
- **Frontend**: Next.js 15, React 19, Tailwind CSS, ShadCN UI, Zustand, TanStack Query, Recharts
- **AI Layer**: LangChain, OpenAI, ChromaDB
- **Infrastructure**: Docker Compose, Kubernetes, NGINX, GitHub Actions CI/CD

## 🚀 Quick Start
You can spin up the entire application stack via Docker Compose.

1. **Setup Environment Variables**:
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY to the .env file
   ```

2. **Start the Stack**:
   ```bash
   docker-compose up --build -d
   ```

3. **Access the App**:
   - Web App: [http://localhost:3000](http://localhost:3000)
   - API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

For detailed deployment instructions to AWS/GCP Kubernetes, refer to `DEPLOYMENT.md`.

## 📂 Project Structure
```
├── backend/                  # FastAPI Application
│   ├── app/                  # Application code (API, Core, Models, Services)
│   ├── tests/                # Unit & Integration Tests
│   └── alembic/              # Database Migrations
├── frontend/                 # Next.js Application
│   ├── src/app/              # App Router Pages
│   └── src/components/       # UI Components
└── infrastructure/           # DevOps configs (Docker, K8s, NGINX, Monitoring)
```
