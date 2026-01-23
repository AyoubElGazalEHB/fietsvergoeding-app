# 📡 API Documentatie - Fietsvergoeding Applicatie

## Base URL
```
http://localhost:3001/api
```

## Authenticatie

Alle endpoints (behalve `/auth/register` en `/auth/login`) vereisen een JWT token in de Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Registreer een nieuwe gebruiker.

**Request Body:**
```json
{
  "name": "Jan Jansen",
  "email": "jan.jansen@example.com",
  "password": "Password123!",
  "land": "BE"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jan Jansen",
    "email": "jan.jansen@example.com",
    "land": "BE",
    "role": "employee"
  }
}
```

**Validatie:**
- `name`: Required, min 2 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 8 characters
- `land`: Required, must be "BE" or "NL"

---

### POST /auth/login
Login met email en wachtwoord.

**Request Body:**
```json
{
  "email": "jan.jansen@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jan Jansen",
    "email": "jan.jansen@example.com",
    "land": "BE",
    "role": "employee"
  }
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials

---

### GET /auth/profile
Haal huidige gebruiker op (vereist authenticatie).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Jan Jansen",
  "email": "jan.jansen@example.com",
  "land": "BE",
  "role": "employee",
  "custom_tariff": null,
  "is_active": true
}
```

---

## 🚴 Trajectory Endpoints

### GET /trajectories
Haal alle trajecten van de ingelogde gebruiker op.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "employee_id": 1,
    "name": "Huis - Kantoor",
    "start_location": "Leuven",
    "end_location": "Brussel",
    "km_single_trip": "12.80",
    "declaration_signed": true,
    "declaration_signed_at": "2026-01-15T10:30:00.000Z",
    "created_at": "2026-01-15T10:30:00.000Z"
  }
]
```

---

### POST /trajectories
Maak een nieuw traject aan.

**Request Body:**
```json
{
  "name": "Huis - Kantoor",
  "start_location": "Leuven",
  "end_location": "Brussel",
  "km_single_trip": 12.8,
  "declaration_signed": true
}
```

**Response (201 Created):**
```json
{
  "message": "Trajectory created successfully",
  "trajectory": {
    "id": 1,
    "employee_id": 1,
    "name": "Huis - Kantoor",
    "start_location": "Leuven",
    "end_location": "Brussel",
    "km_single_trip": "12.80",
    "declaration_signed": true,
    "declaration_signed_at": "2026-01-23T14:25:00.000Z",
    "created_at": "2026-01-23T14:25:00.000Z"
  }
}
```

**Validatie:**
- `name`: Required
- `start_location`: Required
- `end_location`: Required
- `km_single_trip`: Required, must be > 0
- `declaration_signed`: Required, must be true

**Errors:**
- `400`: Validation error (missing fields, invalid values)
- `400`: "Declaration must be signed"

---

### PUT /trajectories/:id
Update een bestaand traject.

**Request Body:**
```json
{
  "name": "Huis - Nieuw Kantoor",
  "start_location": "Leuven",
  "end_location": "Antwerpen",
  "km_single_trip": 15.5
}
```

**Response (200 OK):**
```json
{
  "message": "Trajectory updated successfully"
}
```

**Errors:**
- `403`: Not authorized (trajectory belongs to another user)
- `404`: Trajectory not found

---

### DELETE /trajectories/:id
Verwijder een traject (alleen als er geen ritten aan gekoppeld zijn).

**Response (200 OK):**
```json
{
  "message": "Trajectory deleted successfully"
}
```

**Errors:**
- `400`: "Cannot delete trajectory with existing rides"
- `403`: Not authorized
- `404`: Trajectory not found

---

## 🚲 Ride Endpoints

### GET /rides/month/:yearMonth
Haal alle ritten van een specifieke maand op voor de ingelogde gebruiker.

**Parameters:**
- `yearMonth`: Format "YYYY-MM" (bijv. "2026-01")

**Example:**
```
GET /api/rides/month/2026-01
```

**Response (200 OK):**
```json
{
  "rides": [
    {
      "id": 1,
      "employee_id": 1,
      "trajectory_id": 1,
      "ride_date": "2026-01-23",
      "direction": "heen_terug",
      "portion": "volledig",
      "km_total": "25.60",
      "amount_euro": "6.91",
      "declaration_confirmed": true,
      "declaration_date": "2026-01-23T14:30:00.000Z",
      "created_at": "2026-01-23T14:30:00.000Z",
      "trajectory_name": "Huis - Kantoor",
      "start_location": "Leuven",
      "end_location": "Brussel"
    }
  ],
  "summary": {
    "total_rides": 1,
    "total_km": "25.60",
    "total_amount": "6.91"
  }
}
```

---

### POST /rides
Registreer een nieuwe rit.

**Request Body:**
```json
{
  "trajectory_id": 1,
  "ride_date": "2026-01-23",
  "direction": "heen_terug",
  "portion": "volledig",
  "declaration_confirmed": true
}
```

**Response (201 Created):**
```json
{
  "message": "Ride registered successfully",
  "ride": {
    "id": 1,
    "employee_id": 1,
    "trajectory_id": 1,
    "ride_date": "2026-01-23",
    "direction": "heen_terug",
    "portion": "volledig",
    "km_total": "25.60",
    "amount_euro": "6.91",
    "declaration_confirmed": true,
    "declaration_date": "2026-01-23T14:30:00.000Z",
    "created_at": "2026-01-23T14:30:00.000Z"
  }
}
```

**Validatie:**
- `trajectory_id`: Required, must exist and belong to user
- `ride_date`: Required, cannot be in future
- `direction`: Required, must be "heen", "terug", or "heen_terug"
- `portion`: Required, must be "volledig" or "gedeeltelijk"
- `declaration_confirmed`: Required, must be true

**Business Rules:**
- Maximum 2 ritten per dag (enforced by database trigger)
- Deadline check (configurable per land)
- België: Blocking bij €3,160/jaar limiet (tenzij allow_above_tax_free)

**Errors:**
- `400`: Validation error
- `400`: "Declaration must be confirmed"
- `400`: "Cannot register rides after deadline"
- `400`: "Annual limit reached"
- `400`: "Maximum 2 rides per day exceeded" (database trigger)

---

### GET /check-status
Check of gebruiker nog ritten kan registreren (deadline, limiet).

**Response (200 OK):**
```json
{
  "can_register": true,
  "deadline_passed": false,
  "limit_reached": false,
  "current_year_total": "150.50",
  "max_per_year": "3160.00",
  "remaining": "3009.50",
  "deadline_day": 15,
  "land": "BE"
}
```

**Response (200 OK) - Blocked:**
```json
{
  "can_register": false,
  "deadline_passed": false,
  "limit_reached": true,
  "current_year_total": "3160.00",
  "max_per_year": "3160.00",
  "remaining": "0.00",
  "deadline_day": 15,
  "land": "BE",
  "message": "Annual limit of €3160.00 reached"
}
```

---

## 👥 Employee Endpoints

### GET /employees
Haal alle actieve werknemers op.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Jan Jansen",
    "email": "jan.jansen@example.com",
    "land": "BE",
    "role": "employee",
    "is_active": true
  }
]
```

---

### GET /employees/:id/rides
Haal alle ritten van een specifieke werknemer op (gesorteerd op datum + tijd).

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "ride_date": "2026-01-23",
    "direction": "heen_terug",
    "portion": "volledig",
    "km_total": "25.60",
    "amount_euro": "6.91",
    "trajectory_name": "Huis - Kantoor",
    "created_at": "2026-01-23T14:30:00.000Z"
  }
]
```

---

## 🏢 HR Endpoints (Alleen voor HR/Admin)

Alle HR endpoints vereisen `role: 'hr'` of `role: 'admin'`.

### GET /hr/config
Haal alle configuraties op (BE en NL).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "land": "BE",
    "tariff_per_km": "0.27",
    "max_per_year": "3160.00",
    "max_per_month": "263.00",
    "deadline_day": 15,
    "allow_above_tax_free": false
  },
  {
    "id": 2,
    "land": "NL",
    "tariff_per_km": "0.23",
    "max_per_year": "1800.00",
    "max_per_month": "150.00",
    "deadline_day": 12,
    "allow_above_tax_free": false
  }
]
```

**Errors:**
- `403`: Not authorized (user is not HR/admin)

---

### PUT /config/:land
Update configuratie voor een land (BE of NL).

**Parameters:**
- `land`: "BE" or "NL"

**Request Body:**
```json
{
  "tariff_per_km": 0.30,
  "max_per_year": 3500,
  "max_per_month": 291.67,
  "deadline_day": 20,
  "allow_above_tax_free": true
}
```

**Response (200 OK):**
```json
{
  "message": "Config updated successfully"
}
```

**Validatie:**
- België: `tariff_per_km` moet tussen 0.01 en 0.35 zijn
- Nederland: `tariff_per_km` moet max 0.23 zijn
- `deadline_day` moet tussen 1 en 28 zijn

**Errors:**
- `400`: Invalid land parameter
- `400`: Validation error (tariff out of range)
- `403`: Not authorized

---

### GET /hr/employees
Haal alle werknemers op met hun totalen (jaar-to-date).

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Jan Jansen",
    "email": "jan.jansen@example.com",
    "land": "BE",
    "role": "employee",
    "is_active": true,
    "total_rides": "15",
    "total_km": "384.00",
    "total_amount": "103.68"
  }
]
```

---

### GET /hr/dashboard/:year/:month
Haal dashboard data op voor een specifieke maand.

**Parameters:**
- `year`: 4-digit year (bijv. 2026)
- `month`: 2-digit month (bijv. 01)

**Example:**
```
GET /api/hr/dashboard/2026/01
```

**Response (200 OK):**
```json
{
  "rides": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_name": "Jan Jansen",
      "ride_date": "2026-01-23",
      "direction": "heen_terug",
      "portion": "volledig",
      "km_total": "25.60",
      "amount_euro": "6.91",
      "trajectory_name": "Huis - Kantoor"
    }
  ],
  "summary": [
    {
      "id": 1,
      "name": "Jan Jansen",
      "email": "jan.jansen@example.com",
      "land": "BE",
      "ride_count": "1",
      "total_km": "25.60",
      "total_amount": "6.91"
    }
  ]
}
```

---

### GET /hr/export-csv/:year/:month
Download CSV export voor een specifieke maand.

**Parameters:**
- `year`: 4-digit year
- `month`: 2-digit month

**Example:**
```
GET /api/hr/export-csv/2026/01
```

**Response (200 OK):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="rides_2026_01.csv"

Werknemer,Datum,Afstand (km),Richting,Type,Bedrag (€)
Jan Jansen,23-1-2026,25.60,Heen & Terug,Volledig per fiets,6.91

SAMENVATTING PER WERKNEMER
Werknemer,Aantal ritten,Totaal km,Totaal bedrag (€)
Jan Jansen,1,25.60,6.91
```

**CSV Format:**
- **Ritten sectie**: Werknemer, Datum, Afstand (km), Richting, Type, Bedrag (€)
- **Samenvatting sectie**: Werknemer, Aantal ritten, Totaal km, Totaal bedrag (€)

---

### DELETE /hr/trajectories/:id
Verwijder een traject (HR kan alle trajecten verwijderen).

**Response (200 OK):**
```json
{
  "message": "Trajectory deleted successfully"
}
```

**Errors:**
- `400`: "Cannot delete trajectory with existing rides"
- `404`: Trajectory not found

---

## 📊 Data Models

### Employee
```typescript
{
  id: number
  name: string
  email: string (unique)
  password_hash: string
  land: 'BE' | 'NL'
  role: 'employee' | 'hr' | 'admin'
  custom_tariff: number | null
  is_active: boolean
  created_at: timestamp
}
```

### Trajectory
```typescript
{
  id: number
  employee_id: number
  name: string
  start_location: string
  end_location: string
  km_single_trip: decimal(10,2)
  declaration_signed: boolean
  declaration_signed_at: timestamp | null
  created_at: timestamp
}
```

### Ride
```typescript
{
  id: number
  employee_id: number
  trajectory_id: number
  ride_date: date
  direction: 'heen' | 'terug' | 'heen_terug'
  portion: 'volledig' | 'gedeeltelijk'
  km_total: decimal(10,2)
  amount_euro: decimal(10,2)
  declaration_confirmed: boolean
  declaration_date: timestamp | null
  created_at: timestamp
}
```

### Config
```typescript
{
  id: number
  land: 'BE' | 'NL'
  tariff_per_km: decimal(10,2)
  max_per_year: decimal(10,2)
  max_per_month: decimal(10,2)
  deadline_day: integer (1-28)
  allow_above_tax_free: boolean
}
```

---

## 🔢 Business Logic

### Berekening Rit Bedrag

```javascript
// 1. Bepaal km_total op basis van richting
const directionMultiplier = {
  'heen': 1,
  'terug': 1,
  'heen_terug': 2
};
const km_total = trajectory.km_single_trip * directionMultiplier[direction];

// 2. Bepaal bedrag op basis van type
const portionMultiplier = {
  'volledig': 1,
  'gedeeltelijk': 0.5
};
const amount_euro = km_total * tariff_per_km * portionMultiplier[portion];
```

**Voorbeeld:**
- Traject: 12.8 km (enkele reis)
- Richting: heen_terug (2x)
- Type: volledig (1x)
- Tarief: €0.27/km
- **Berekening**: 12.8 × 2 × 0.27 × 1 = €6.91

### Validatie Regels

**België:**
- Tarief: €0.01 - €0.35/km
- Maximum: €3,160/jaar
- Blocking: Ja (tenzij allow_above_tax_free = true)
- Deadline: Configureerbaar (standaard: 15e)

**Nederland:**
- Tarief: Max €0.23/km
- Maximum: Geen enforced limiet
- Blocking: Nee
- Deadline: Configureerbaar (standaard: 12e)

**Algemeen:**
- Max 2 ritten per dag (database trigger)
- Verklaring op eer verplicht (trajecten + ritten)
- Ritten niet in toekomst
- Deadline: Ritten van maand X kunnen tot dag Y van maand X+1

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. HR role required."
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## 🔒 Security

- **JWT Tokens**: Expire na 7 dagen (configureerbaar)
- **Password Hashing**: bcrypt met salt rounds = 10
- **Role-Based Access**: Middleware checks voor HR endpoints
- **Input Validation**: Alle inputs worden gevalideerd
- **SQL Injection**: Prepared statements (parameterized queries)
- **CORS**: Configured voor frontend URL

---

## 📝 Notes

- Alle bedragen zijn in Euro (€)
- Alle afstanden zijn in kilometers (km)
- Datums zijn in ISO 8601 format (YYYY-MM-DD)
- Timestamps zijn in UTC
- Decimals hebben 2 decimalen precisie

---

**Voor vragen of problemen, zie README.md of check de source code in `backend/src/routes/`**

