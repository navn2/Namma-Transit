# Namma Transit Backend API

The backend for Namma Transit is built using FastAPI and Python. It manages user authentication, transit route planning with TRS, live vehicle tracking, crowd-sourced telemetry, reward economy, IVR voice lookups, and SMS alert subscriptions.

## Technologies Used

*   **FastAPI**: Modern, fast web framework for building APIs.
*   **SQLAlchemy**: Database ORM.
*   **Uvicorn**: Lightning-fast ASGI server.
*   **Pydantic**: Data validation and settings management.

## Setup Instructions

### 1. Prerequisites
Ensure you have Python 3.10 or higher.

### 2. Install Dependencies
Set up your virtual environment and install the required Python packages:
```bash
python -m venv .venv
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure your settings:
```bash
copy .env.example .env
```

### 4. Running the server
Start the live reload server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).
