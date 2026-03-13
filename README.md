# AmiranetCode 🎓
 
> Source code and CI pipeline for the Amiranet AI exam simulation application.  
> For the infrastructure and GitOps configuration, see 👉 [AmiranetGitOps](https://github.com/NoyLevi24/AmiranetGitOps)
 
---
 
## Overview
 
Amiranet is a Flask-based AI application that simulates an Amiranet English proficiency exam. It uses the Gemini API to dynamically generate full-length exams with vocabulary, restatement, and reading comprehension sections — each time with randomly selected topics.
 
---
 
## Application
 
**Stack:** Python · Flask · Gunicorn · Google Gemini API
 
**Exam Structure (44 questions):**
 
| Section | Type | Questions |
|---|---|---|
| 1 & 2 | Sentence Completion | 10 each |
| 3 & 4 | Restatement | 6 each |
| 5 & 6 | Reading Comprehension | 6 each + passage |
 
Each exam is generated fresh on demand — topics are randomly selected from categories including Biology, History, Philosophy, Literature, Economics, and more.
 
---
 
## Repository Structure
 
```
.
├── app.py                  # Flask application + Gemini API integration
├── Dockerfile              # Container image definition
├── docker-compose.yml      # Local development
├── requirements.txt
├── static/
│   ├── script.js
│   └── style.css
└── templates/
    └── index.html
```
 
---
 
## Local Development
 
```bash
# Clone the repo
git clone https://github.com/NoyLevi24/AmiranetCode.git
cd AmiranetCode
 
# Set your Gemini API key
export GEMINI_API_KEY=your_key_here
 
# Run with Docker Compose
docker compose up
```
 
App will be available at `http://localhost:5000`
 
---
 
## CI Pipeline
 
The pipeline is triggered manually via **GitHub Actions** (`workflow_dispatch`).
 
### Build & Push
 
**Workflow:** `.github/workflows/push-dockerhub.yaml`
 
1. Builds the Docker image from the root `Dockerfile`
2. Pushes to Docker Hub as `<username>/amiranet:<tag>`
3. Checks out [AmiranetGitOps](https://github.com/NoyLevi24/AmiranetGitOps) and updates `qa-values.yaml` with the new image tag
4. Commits and pushes the change — Argo CD detects it and deploys automatically

 
## Required Secrets
 
Configure these in **GitHub → Settings → Secrets and variables → Actions:**
 
| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `GITOPS_TOKEN` | GitHub PAT with `repo` scope on AmiranetGitOps |
