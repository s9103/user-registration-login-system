# User Registration & Login System

A full-stack authentication system with a Spring Boot REST API, a PostgreSQL
database, and a React Native (Expo) mobile app. Users can register, log in,
stay logged in across app restarts, and log out — with the app routing
between screens based on whether a valid session exists.

## Overview

This project demonstrates a complete, working JWT authentication flow:

- The **backend** (Spring Boot) exposes REST endpoints to register, log in,
  log out, and fetch the current user's profile. Passwords are hashed with
  BCrypt and never stored in plain text. Each successful login/registration
  issues a JWT, and every issued token is recorded in a `sessions` table so
  that logging out can immediately invalidate it.
- The **frontend** (React Native / Expo) provides Login and Register screens,
  stores the JWT on the device, and conditionally routes the user to the
  Home screen if a valid session is found — otherwise to the Login screen.

## Features

- User registration with server-side validation (name, email format,
  password length) and duplicate-email checking
- Secure password storage using BCrypt hashing
- JWT-based login with a 24-hour token expiry
- Session tracking in the database, so logout actually invalidates the token
  (not just a client-side "forget the token" logout)
- A protected `/api/auth/me` endpoint that the app calls to confirm the
  token is valid and to load the user's profile
- Conditional navigation on the mobile app: authenticated users see the
  Home screen, unauthenticated users see Login/Register
- Session persistence across app restarts using AsyncStorage
- Centralized error handling with clear, consistent JSON error responses

## Tech Stack

**Backend:** Java 17, Spring Boot 3, Spring Security, Spring Data JPA,
PostgreSQL, JJWT, Maven

**Frontend:** React Native, Expo, React Navigation, Axios, AsyncStorage

## Project Structure

```
user-registration-login-system/
├── backend/
│   ├── src/main/java/com/authapp/
│   │   ├── config/          # Spring Security + JWT filter setup
│   │   ├── controller/      # REST endpoints
│   │   ├── service/         # Business logic
│   │   ├── repository/      # Spring Data JPA repositories
│   │   ├── model/           # JPA entities (User, UserSession)
│   │   ├── dto/             # Request/response objects
│   │   ├── util/            # JWT generation/validation
│   │   └── exception/       # Custom exceptions + global handler
│   ├── src/main/resources/
│   │   └── application.properties.example
│   ├── schema.sql           # Reference SQL schema
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── screens/         # Login, Register, Home
│   │   ├── navigation/      # Conditional auth-based navigator
│   │   ├── context/         # AuthContext (global auth state)
│   │   ├── api/             # Axios instance + API calls
│   │   ├── utils/           # AsyncStorage helpers
│   │   └── config.js        # API base URL
│   ├── App.js
│   └── package.json
├── docs/screenshots/
└── README.md
```

## How It Works

### Registration & Login
1. The user fills the Register or Login form on the mobile app.
2. The app sends a `POST` request to `/api/auth/register` or
   `/api/auth/login`.
3. The backend validates the input, checks/creates the user record, and on
   success generates a JWT (`JwtUtil`) containing the user's ID and email.
4. The token is saved in the `sessions` table (`UserSession`) and returned
   to the app.
5. The app stores the token and user info in AsyncStorage and updates
   `AuthContext`, which flips `isAuthenticated` to `true`.

### Conditional Routing
`AppNavigator` reads `isAuthenticated` from `AuthContext`. If `true`, it
renders the Home stack; if `false`, it renders the Login/Register stack.
On app startup, `AuthContext` checks AsyncStorage for a saved token before
deciding which screen to show first, so a logged-in user isn't sent back to
the Login screen every time they reopen the app.

### Protected Requests
Every request made through the shared Axios instance (`authApi.js`)
automatically attaches `Authorization: Bearer <token>`. On the backend,
`JwtAuthFilter` reads that header, verifies the signature and expiry, and
also checks the `sessions` table to make sure the token hasn't been logged
out. Only then does the request reach the controller.

### Logout
Logging out calls `POST /api/auth/logout`, which marks the matching row in
`sessions` as `valid = false`. Even if someone captured the old token, it
can no longer pass `JwtAuthFilter`. The app then clears AsyncStorage and
`AuthContext` state, which routes the user back to Login.

## Installation

### Prerequisites
- Java 17+ and Maven
- PostgreSQL 13+
- Node.js 18+ and npm
- Expo Go app on your phone (or an Android/iOS emulator)

### Backend Setup
```bash
cd backend
createdb auth_db          # or create it via psql / a GUI client
cp src/main/resources/application.properties.example src/main/resources/application.properties
# Edit application.properties: set your DB password and a JWT secret
mvn spring-boot:run
```
The API will start on `http://localhost:8080`.

### Frontend Setup
```bash
cd frontend
npm install
# Edit src/config.js and set API_BASE_URL for your setup (see comments in the file)
npx expo start
```
Scan the QR code with Expo Go, or press `a`/`i` to launch an emulator.

## Configuration

| File | Purpose |
|---|---|
| `backend/src/main/resources/application.properties` | DB credentials, JWT secret, JWT expiry (git-ignored — copy from the `.example` file) |
| `frontend/src/config.js` | API base URL the app talks to |

Generate a JWT secret with:
```bash
openssl rand -base64 32
```

## Running the Project

1. Start PostgreSQL and make sure `auth_db` exists.
2. Run the backend: `mvn spring-boot:run` (from `backend/`)
3. Run the frontend: `npx expo start` (from `frontend/`)
4. Register a new account, then log out and log back in to verify the full
   flow end to end.

## API Endpoints

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a new account, returns a JWT |
| POST | `/api/auth/login` | No | Authenticate, returns a JWT |
| POST | `/api/auth/logout` | Yes | Invalidates the current token |
| GET | `/api/auth/me` | Yes | Returns the authenticated user's profile |

**Register / Login response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "fullName": "Jane Doe",
  "email": "jane@example.com"
}
```

**Error response shape:**
```json
{
  "status": 400,
  "message": "Validation failed",
  "details": ["email: Email must be a valid email address"],
  "timestamp": "2026-01-01T12:00:00"
}
```

## Future Improvements

These are intentionally left out of this version to keep the project
focused and understandable, but would be reasonable next steps:

- Refresh tokens (currently a single 24-hour access token)
- Password reset via email
- Rate limiting on login attempts
- Role-based authorization (currently every authenticated user has the
  same access level)
- Automated tests (unit tests for `AuthService`, integration tests for the
  controller)

## Author

Sharad Purohit
