# Astro-Auth (Project)

This repository contains a Node.js/Express frontend/proxy and a Python FastAPI backend used for AI-driven chat and text-to-speech features. The project includes authentication, database integrations, static pages, and an AI proxy layer.

> Use `./setup.sh` (Git Bash / WSL / macOS / Linux) or `.\setup.ps1` (Windows PowerShell) to create missing files, folders, and install dependencies in one command.

---

## Quick start

1. Clone the repository:

```bash
git clone <REPO_URL>
cd <REPO_NAME>
```

2. Run the one-command setup:

**Unix/macOS (bash/zsh):**

```bash
chmod +x setup.sh
./setup.sh
```

**Windows PowerShell:**

```powershell
.\setup.ps1
```

(If PowerShell prevents execution, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` first.)

### Requirements (added)

- Python 3.8 or newer is required for the Python backend. `setup.sh` will attempt to detect a suitable Python interpreter (`python3` or `python`) and create a `venv/` automatically. If you have multiple Python versions installed, ensure `python3` points to a 3.8+ interpreter before running the script.
- Node.js (LTS, e.g. 18.x or later) and `npm` are required for the Node server and dependencies.
- PostgreSQL if you plan to use the database features (ensure it is running and reachable from `.env`).

Activation and start commands (after running `setup.sh`):

Unix/macOS (bash):

```bash
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

Windows PowerShell (activate):

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

Windows CMD (activate):

```cmd
venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

Start Node proxy:

```bash
npm install
node server.js
```

---

## What the `setup.sh` does

- Verifies basic tools (`git`, `node`, `npm`, `python3`/`python`).
- Creates default folders: `data/`, `models/`, `config/`, `src/`, `uploads/profile-pictures/`.
- Creates missing files with safe defaults: `.env`, `requirements.txt`, `package.json`.
- Creates Python `venv/` and installs `requirements.txt`.
- Runs `npm install` if `npm` is available.

`setup.sh` will not overwrite existing files.

---

## Configuration files

- `.env` (root): environment variables used by Node and Python backends. Edit this file after running setup. Example values are created by `setup.sh`.
- `config/db.js`: Node DB connection - ensure it reads from `.env` or update it to match your DB host/port.
- `package.json`: Node dependencies and scripts.
- `requirements.txt`: Python dependencies for the FastAPI backend.

Common `.env` variables:

```
PORT=5500
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USER=youruser
DATABASE_PASS=yourpass
DATABASE_NAME=yourdb
SESSION_SECRET=please-change-me
AI_BACKEND_URL=http://127.0.0.1:8000/api/chat
AI_BACKEND_TIMEOUT_MS=300000
```

---

## Folder structure

```
.
├─ .env
├─ README.md
├─ package.json
├─ requirements.txt
├─ setup.sh
├─ server.js
├─ config/
├─ controllers/
├─ routes/
├─ middleware/
├─ public/
├─ src/
├─ data/
├─ models/
├─ uploads/
└─ venv/
```

---

## How to run the project

1. Ensure the database is running and reachable at the host/port set in `.env`. For PostgreSQL default is 5432. If you changed the DB port, update `.env` and restart Node.

2. Node server (Express / proxy):
   - From repo root (after running `setup.sh` or manual setup):
     - Start in development:
       - Unix/Git Bash:
         ```bash
         # ensure node modules are installed
         npm install
         node server.js
         ```
       - Use nodemon (if installed):
         ```bash
         npx nodemon server.js
         ```

     - Windows PowerShell:
       ```powershell
       npm install
       node server.js
       ```

3. Python backend (if present)
   - Activate venv and run uvicorn:
     ```bash
     source venv/bin/activate       # or .\venv\Scripts\Activate.ps1 on Windows
     pip install -r requirements.txt
     uvicorn server:app --host 127.0.0.1 --port 8000 --reload
     ```

4. End-to-end
   - Start the Python backend first (so Node can proxy to it), then start Node server.
   - Use the frontend static `index.html` or `chat.html` to send requests to `http://localhost:5500/api/chat`, which will proxy to `AI_BACKEND_URL`.

---

## Activating environments

Unix / macOS:

```bash
python -m venv venv
source venv/bin/activate
```

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

To deactivate:

```bash
deactivate
```

---

## Common troubleshooting

- Error: `connect ECONNREFUSED 127.0.0.1:5433`
  - Cause: The Node app is trying to connect to Postgres on port 5433 but DB is not listening there.
  - Fix:
    - Ensure Postgres is running on the port in `.env` or `config/db.js`.
    - If you changed the port in `.env`, restart Node so the new env is picked up.
    - Check `config/db.js` for hardcoded ports and update to use env vars (recommended).
    - Example: `psql -h 127.0.0.1 -p 5433 -U username -d dbname` to verify connectivity.

- Error: `EADDRINUSE: address already in use :::5500`
  - Cause: Port 5500 is already used by another process.
  - Fix:
    - Kill the process using the port (Windows PowerShell):
      ```powershell
      netstat -ano | Select-String ":5500"
      # Find PID and then:
      taskkill /PID <pid> /F
      ```
    - Or change `PORT` in `.env`.

- Error: `Failed to fetch` in the browser console when contacting the Node proxy
  - Cause: CORS or server not running.
  - Fix:
    - Ensure Node server is running at the same origin or adjust `app.use(cors({...}))` in `server.js`.
    - Open browser devtools -> Network to inspect the request and response headers.

- 504 Gateway Timeout from Node proxy
  - Cause: Upstream AI backend took longer than Node proxy timeout.
  - Fix:
    - Increase `AI_BACKEND_TIMEOUT_MS` in `.env` (and restart Node).
    - Confirm FastAPI responds by testing directly against it with a longer curl timeout: `curl -m 600 ...`

- JSON parse errors when sending payloads from PowerShell
  - PowerShell treats `@` and quotes differently. Use `curl.exe` or `Invoke-RestMethod` with `-Body (Get-Content -Raw tmp_payload.json)` to send raw JSON.

---

## Default file contents (snippets)

If files are missing, `setup.sh` will create files similar to below:

`.env` (example)
```
PORT=5500
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USER=youruser
DATABASE_PASS=yourpass
DATABASE_NAME=yourdb
SESSION_SECRET=please-change-me
AI_BACKEND_URL=http://127.0.0.1:8000/api/chat
AI_BACKEND_TIMEOUT_MS=300000
```

`requirements.txt` (example)
```
fastapi==0.95.0
uvicorn[standard]==0.22.0
requests==2.31.0
python-dotenv==1.0.0
```

`package.json` (minimal)
```json
{
  "name": "astro-auth",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.10.0",
    "node-fetch": "^2.6.7",
    "express-session": "^1.17.3",
    "passport": "^0.6.0",
    "dotenv": "^16.0.0"
  }
}
```

---

## Security & next steps

- Do not commit `.env` with real secrets.
- Use a secrets manager or environment variables on the host for production.
- Add a `.env.example` checked-in file with placeholder values.
- Add a `docker-compose.yml` (recommended) to orchestrate Postgres + Python + Node for local reproducible dev.
- Add tests and CI workflow to validate start-up and API health checks.

---

## Final notes

- The `setup.sh` provides a one-command developer-friendly setup. After running it, start the Python backend (if present) and the Node server and the system should be wired to proxy calls from the frontend to the AI backend.
- If you'd like, I can:
  - Generate `setup.sh` in the repo next (it will create the files/folder structure and install dependencies),
  - Or produce a `setup.ps1` for native PowerShell users.

If you want the `setup.sh` created now, tell me and I will add it and run quick validations.