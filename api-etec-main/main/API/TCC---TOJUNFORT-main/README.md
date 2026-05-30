# ToJunFort API Setup Guide

This document explains exactly what you need to do to make the backend work and connect the frontend to it.

> This project uses Node.js, Express, and Prisma. The frontend sends requests to the API at `http://localhost:3000`.

---

## 1. What this backend is supposed to do

Current API endpoints:

- `POST /api/users` — create a new user
- `POST /api/login` — validate login credentials
- `GET /api/users` — list all users

The frontend registration page must call `POST /api/users`.
The login page must call `POST /api/login`.

---

## 2. Requirements

You need the following installed on your machine:

- Node.js (recommend version 18 or newer)
- npm
- A terminal/PowerShell

If you want the simplest setup, use SQLite as the database. That does not require a separate database server.

---

## 3. Install backend dependencies

Go to the backend folder:

```bash
cd main\API\TCC---TOJUNFORT-main
```

Then install packages:

```bash
npm install
```

This installs:

- `express`
- `cors`
- `@prisma/client`
- `prisma`

---

## 4. Create Prisma database schema and configure connection

The backend currently uses Prisma, but this project does not include `prisma/schema.prisma` and `.env` yet.

### 4.1 Create Prisma files

Run:

```bash
npx prisma init --datasource-provider sqlite
```

This creates `prisma/schema.prisma` and `.env`.

### 4.2 Update `prisma/schema.prisma`

Replace the contents of `prisma/schema.prisma` with this exact model:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Voluntario {
  id        Int      @id @default(autoincrement())
  nome      String
  usuario   String   @unique
  email     String   @unique
  senha     String
  createdAt DateTime @default(now())
}

model Diretoria {
  id           Int      @id @default(autoincrement())
  nome         String
  usuario      String   @unique
  email        String   @unique
  senha        String
  rgFuncional  String?  @unique
  createdAt    DateTime @default(now())
}
```

This adds a `role` field for every user. If the frontend does not send a role, Prisma will save `VOLUNTARIO` by default.

> Use `ADMIN`, `VOLUNTARIO`, or `DIRETORIA` exactly as the role value.

### RG Funcional (novo)

We added an optional `rgFuncional` field to the `User` model. Purpose: an additional identifier used to restrict or verify `DIRETORIA` signups.

- Stored normalized (DB): `F1234567890` (no dots or hyphen)
- Display/format: `F123.456.789-0`
- Regex (normalized): `/^F\d{10}$/`
- The frontend director signup page includes a single `input#rg` which auto-formats while typing; the value is normalized before sending.

If the frontend sends an invalid `rgFuncional`, the API will respond with `400` and an explanatory message.

### Testing RG and director signup (quick commands)

Follow these exact steps to reproduce and test the new RG flow locally.

1. Ensure backend dependencies are installed and Prisma is in sync:

```bash
cd main/API/TCC---TOJUNFORT-main
npm install
npx prisma db push
npx prisma generate
```

2. Start the backend server:

```bash
npm --prefix "c:\\Users\\User\\Downloads\\tecec3-main\\main\\API\\TCC---TOJUNFORT-main" start
```

3. Serve the frontend (from `main` folder) so `fetch()` works:

```bash
cd main
npx http-server . -p 5500
```

4. Test director signup with a formatted RG (examples):

- Using `curl.exe` (PowerShell on Windows):

```bash
curl.exe -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"DirTeste\",\"usuario\":\"dirteste\",\"email\":\"dir@teste.com\",\"senha\":\"12345678\",\"role\":\"DIRETORIA\",\"rgFuncional\":\"F123.456.789-1\"}"
```

- Using PowerShell `Invoke-WebRequest`:

```powershell
$body = '{"nome":"DirTeste","usuario":"dirteste","email":"dir@teste.com","senha":"12345678","role":"DIRETORIA","rgFuncional":"F123.456.789-1"}'
Invoke-WebRequest -Uri 'http://localhost:3000/api/users' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

If the request succeeds you will get HTTP `201` and the created user (the API stores `rgFuncional` normalized as `F1234567891`). Check the backend console for logs if something fails.

### Make `rgFuncional` required for `DIRETORIA` (optional)

If you want to enforce that director signups always include a valid `rgFuncional`, change the validation logic in `index.js` to return `400` when `role === 'DIRETORIA'` and `rgFuncional` is missing or invalid. Example snippet:

```js
if (role === 'DIRETORIA' && !rgFuncional) {
  return res.status(400).json({ error: 'RG funcional é obrigatório para cadastro de diretoria.' });
}
```

Add that check before normalizing `rgFuncional`.

### 4.3 Update `.env`

Set the database URL to use SQLite:

```bash
DATABASE_URL="file:./dev.db"
```

If `.env` already exists, update it. If not, create it in the same folder as `package.json`.

### 4.4 Create the database

Run one of these commands:

```bash
npx prisma migrate dev --name init
```

or, if you want a simpler setup without migrations:

```bash
npx prisma db push
```

This creates the SQLite database file `dev.db` and applies the `User` model.

---

## 5. Run the backend server

Start the API with:

```bash
npm start
```

The backend should print:

```text
🚀 API rodando na porta 3000
```

If it fails, the most likely problems are:

- missing `prisma/schema.prisma`
- missing or wrong `DATABASE_URL`
- `node_modules` not installed

---

## 6. Confirm the API works

### 6.1 Test registration endpoint

Use curl or Postman to test:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","usuario":"teste","email":"teste@teste.com","senha":"12345678"}'
```

If it succeeds, the response should return the created user object.

### 6.2 Test login endpoint

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"teste","email":"teste@teste.com","senha":"12345678"}'
```

If login is correct, this should return the user data without the password field.

---

## 7. What the frontend must do

Your current frontend must send actual HTTP requests to the backend.

### Registration page

The file `main/JS/Paginas/cadastro/CadastroVoluntario.js` must send a `POST` to:

```text
http://localhost:3000/api/users
```

with JSON body:

```json
{
  "nome": "...",
  "usuario": "...",
  "email": "...",
  "senha": "...",
  "role": "VOLUNTARIO"
}
```

The backend supports these `role` values:

- `ADMIN`
- `VOLUNTARIO`
- `DIRETORIA`

If the frontend omits `role`, Prisma will default the user to `VOLUNTARIO`.

### How the frontend decides the role

Right now, the registration script chooses the role based on the signup page used:

- `cadastroVoluntario.html` → `VOLUNTARIO`
- `cadastroDiretoria.html` → `DIRETORIA`

If you want to add an admin signup page, the same script can be extended to send `ADMIN`.

If you prefer a single signup form, you can also add a `<select>` or radio buttons to let the user pick the role explicitly and send that value in the request body.

### Login page

The file `main/JS/Paginas/login/loginValidation.js` must send a `POST` to:

```text
http://localhost:3000/api/login
```

with JSON body:

```json
{
  "usuario": "...",
  "email": "...",
  "senha": "..."
}
```

The login response now includes the user's `role` field too.

### Important note about the frontend

Do not open HTML files directly with `file://` in the browser. The frontend must be served by a web server so `fetch()` requests work reliably.

Use one of these options:

- Install the Live Server extension in VS Code and open the HTML from there.
- Run a simple static server from the project folder.

Example using `npx` from the `main` folder:

```bash
cd c:\Users\User\Downloads\tecec3-main\main
npx http-server . -p 5500
```

Then open:

```text
http://127.0.0.1:5500/Paginas/login\ voluntario/loginVoluntario.html
```

and

```text
http://127.0.0.1:5500/Paginas/login\ voluntario/cadastroVol/cadastroVoluntario.html
```

---

## 8. Troubleshooting

### Common problems

- `fetch` fails with network error:
  - backend not running
  - wrong URL in frontend
  - browser opened through `file://`

- `PrismaClient` error or schema missing:
  - create `prisma/schema.prisma`
  - run `npx prisma db push`
  - make sure `.env` contains `DATABASE_URL="file:./dev.db"`

- port `3000` already in use:
  - stop the process using port 3000
  - or change the port in `index.js` and update frontend URL accordingly

### How to confirm the backend is connected to the database

- after `npx prisma db push`, there should be a file called `dev.db` in the backend folder.
- if the file does not exist, Prisma was not configured or the path is wrong.

### If you want a faster test flow

1. Start backend:
   ```bash
   npm start
   ```
2. Start frontend server with Live Server or `http-server`.
3. Open the registration page and submit.
4. Check backend terminal for request logs or errors.

---

## 9. Notes for your group

- You are not wrong to ask for help here � the backend and frontend were not connected yet.
- The current site front end only becomes useful once the API is actually running and the database exists.
- This `.md` is intended to be a step-by-step setup guide for the backend and the connection path.
- If your team wants, I can also add a second document that explains the exact files to keep and the exact commands to use in a shared `README.md` in the project root.
