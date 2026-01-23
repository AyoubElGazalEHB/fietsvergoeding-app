# 🚴 Fietsvergoeding Applicatie

Een professionele applicatie voor het registreren en berekenen van fietsvergoedingen voor werknemers in België en Nederland, met volledige naleving van de wettelijke belastingvrije regels.

## 📋 Business Case

Deze applicatie automatiseert het proces van fietsvergoeding registratie en berekening volgens de wettelijke regels:

### 🇧🇪 België
- **Tarief**: €0.01 - €0.35 per kilometer (werkgever bepaalt)
- **Maximum**: €3,160 per jaar (belastingvrij)
- **Blocking**: Werknemers kunnen niet meer registreren na overschrijding (tenzij werkgever toestaat)
- **Deadline**: Configureerbaar (standaard: 15e van volgende maand)

### 🇳🇱 Nederland
- **Tarief**: Maximum €0.23 per kilometer (werkgever bepaalt)
- **Voorwaarde**: Eigen fiets of geleend geld voor aankoop
- **Geen blocking**: Geen automatische blokkering bij limiet
- **Deadline**: Configureerbaar (standaard: 12e van volgende maand)

## ✨ Features

### Voor Werknemers
- ✅ **Trajecten aanmaken** met verklaring op eer
- ✅ **Ritten registreren** met automatische berekening
- ✅ **Richting kiezen**: Heen, Terug, of Heen & Terug
- ✅ **Type kiezen**: Volledig of Gedeeltelijk per fiets
- ✅ **Maximum 2 ritten per dag** (database enforced)
- ✅ **Maandelijks overzicht** van geregistreerde ritten
- ✅ **Real-time status check** (deadline, limiet bereikt)

### Voor HR
- ✅ **Dashboard** met maandelijkse statistieken
- ✅ **Werknemers overzicht** met totalen
- ✅ **Config management** (tarieven, deadlines, limieten)
- ✅ **CSV export** voor payroll systeem
- ✅ **Maandelijkse automatische export** (cron job: 1e van maand @ 02:00)

## 🏗️ Technische Architectuur

### Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL 14+
- **Authentication**: JWT met role-based access control (employee/hr/admin)

### Database Schema
```
employees (id, name, email, password_hash, land, role, custom_tariff, is_active, created_at)
trajectories (id, employee_id, name, start_location, end_location, km_single_trip,
              declaration_signed, declaration_signed_at, created_at)
rides (id, employee_id, trajectory_id, ride_date, direction, portion, km_total, amount_euro,
       declaration_confirmed, declaration_date, created_at)
config (id, land, tariff_per_km, max_per_year, max_per_month, deadline_day, allow_above_tax_free)
```

### Key Features
- **ENUM types** voor data integriteit (land_enum, direction_enum, portion_enum, type_enum, status_enum, role_enum)
- **Database triggers** voor business rules (max_two_rides_per_day)
- **Services layer** voor business logic (validationService, calculationService, exportService)
- **Role-based access** met middleware (authenticate, requireHR)
- **Audit trail** (created_at timestamps, declaration dates)

## 📋 Projectstructuur

```
fietsvergoeding-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── ride.routes.js
│   │   │   └── hr.routes.js
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── services/
│   │   │   ├── validationService.js
│   │   │   ├── calculationService.js
│   │   │   └── exportService.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── jobs/
│   │   │   └── monthlyExport.job.js
│   │   └── server.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── migrations/
│   │       └── 002_seed_data.sql
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── employee/
│   │   │   │   ├── RideRegistration.jsx
│   │   │   │   └── MonthOverview.jsx
│   │   │   ├── hr/
│   │   │   │   └── ConfigManagement.jsx
│   │   │   └── shared/
│   │   │       └── Login.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm of yarn

### **1. Database Setup (PostgreSQL)**

```bash
# Create database
createdb -U postgres fietsvergoeding

# Run schema and migrations
psql -U postgres -d fietsvergoeding -f backend/database/schema.sql
psql -U postgres -d fietsvergoeding -f backend/database/migrations/002_seed_data.sql
psql -U postgres -d fietsvergoeding -f backend/database/migrations/004_update_schema_complete.sql
```

### **2. Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials:
# DB_USER=postgres
# DB_HOST=localhost
# DB_NAME=fietsvergoeding
# DB_PASSWORD=your_password
# DB_PORT=5432
# JWT_SECRET=your_secret_key_here
# JWT_EXPIRES_IN=7d
# PORT=3001
# FRONTEND_URL=http://localhost:5173

# Start server
npm start
```

Server draait op: `http://localhost:3001`

### **3. Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (if not exists)
# VITE_API_URL=http://localhost:3001

# Start development server
npm run dev
```

Frontend draait op: `http://localhost:5173`

---

## 🧪 Demo Credentials

### Werknemers

| Email | Password | Land | Role |
|-------|----------|------|------|
| jan.jansen@example.com | Password123! | 🇧🇪 België | Employee |
| marie.dupont@example.com | Password123! | 🇧🇪 België | Employee |
| pieter.de.vries@example.com | Password123! | 🇳🇱 Nederland | Employee |
| sophie.van.dijk@example.com | Password123! | 🇳🇱 Nederland | Employee |
| kurt.meijer@example.com | Password123! | 🇳🇱 Nederland | Employee |

### HR Admin

| Email | Password | Land | Role |
|-------|----------|------|------|
| hr@company.com | Password123! | 🇧🇪 België | HR Admin |

---

## 📖 User Guide

### Werknemer Flow

1. **Login** met je credentials (bijv. jan.jansen@example.com / Password123!)

2. **Traject Aanmaken** (eerste keer)
   - Ga naar "Trajecten"
   - Klik "Nieuw Traject"
   - Vul in:
     - Naam (bijv. "Huis - Kantoor")
     - Startlocatie (bijv. "Leuven")
     - Eindlocatie (bijv. "Brussel")
     - Afstand enkele reis in km (bijv. 12.8)
   - ✅ Bevestig verklaring op eer
   - Klik "Opslaan"

3. **Rit Registreren**
   - Ga naar "Rit Registreren"
   - Selecteer traject uit dropdown
   - Kies datum
   - Kies richting:
     - **Heen**: Alleen heenreis (1x afstand)
     - **Terug**: Alleen terugreis (1x afstand)
     - **Heen & Terug**: Beide richtingen (2x afstand)
   - Kies type:
     - **Volledig per fiets**: Hele traject (1x bedrag)
     - **Gedeeltelijk per fiets**: Deel van traject (0.5x bedrag)
   - ✅ Bevestig verklaring op eer
   - Bekijk automatische berekening
   - Klik "Registreer Rit"

4. **Overzicht Bekijken**
   - Ga naar "Overzicht"
   - Zie alle ritten van huidige maand
   - Bekijk totalen (km + bedrag)
   - Wissel van maand met dropdown

### HR Flow

1. **Login** als HR admin (hr@company.com / Password123!)

2. **Dashboard**
   - Bekijk maandelijkse statistieken per werknemer
   - Zie totaal aantal ritten, km en bedragen
   - Wissel van maand met datepicker

3. **Werknemers Beheer**
   - Ga naar "Werknemers"
   - Zie overzicht van alle actieve werknemers
   - Klik "View Rides" om ritten van specifieke werknemer te zien
   - Sorteer op datum en tijd

4. **Configuratie Beheer**
   - Ga naar "HR Config"
   - Pas aan per land (BE/NL):
     - Tarief per km
     - Maximum per jaar
     - Maximum per maand
     - Deadline dag (van volgende maand)
     - Allow above tax-free (ja/nee)
   - Klik "Update Config"

5. **CSV Export**
   - Ga naar "Dashboard"
   - Selecteer maand
   - Klik "📥 Exporteer als CSV"
   - Bestand wordt gedownload: `rides_YYYY_MM.csv`
   - Bevat: ritten details + samenvatting per werknemer

## ✅ Functionele Test Checklist

### **Employee Flow:**
1. ✅ Login met employee account
2. ✅ Maak een traject aan met verklaring op eer
3. ✅ Registreer een rit (heen/terug/heen_terug)
4. ✅ Registreer 2e rit op dezelfde dag → moet lukken
5. ✅ Probeer 3e rit op dezelfde dag → moet blokkeren (database trigger)
6. ✅ Bekijk maandoverzicht met totalen
7. ✅ Wissel van maand in overzicht

### **België-specifieke Tests:**
1. ✅ Registreer ritten tot bijna €3,160/jaar
2. ✅ Probeer rit boven limiet → moet blokkeren
3. ✅ (Als HR) Verander `allow_above_tax_free` naar TRUE
4. ✅ Registreer rit boven max → moet nu lukken
5. ✅ Check deadline enforcement (na 15e van maand)

### **Nederland-specifieke Tests:**
1. ✅ Registreer ritten met €0.23/km tarief
2. ✅ Geen automatische blokkering bij limiet
3. ✅ Check deadline enforcement (na 12e van maand)

### **HR Flow:**
1. ✅ Login met HR account
2. ✅ Bekijk dashboard met maandelijkse data
3. ✅ Bekijk werknemers overzicht
4. ✅ Bekijk ritten van specifieke werknemer
5. ✅ Wijzig configuratie (tarief, deadline, max)
6. ✅ Genereer CSV export
7. ✅ Verifieer CSV inhoud (ritten + samenvatting)

---

## 📊 Database Schema

### **Belangrijkste Tabellen:**

**employees** - Werknemers
- id, name, email, password_hash, land (BE/NL), is_active

**trajectories** - Woon-werk trajecten
- id, employee_id, km_single_trip, type

**rides** - Geregistreerde ritten
- id, employee_id, trajectory_id, ride_date, direction, portion, km_total, amount_euro

**config** - Landspecifieke configuratie
- land, tariff_per_km, max_per_year, deadline_day, allow_above_tax_free

**monthly_summaries** - Maandelijkse bundeling
- employee_id, year_month, total_km, total_amount, status, exported_at

---

## 🔧 Troubleshooting

### Database connection error
```bash
# Check PostgreSQL is running
pg_isready

# Verify database exists
psql -U postgres -l | grep fietsvergoeding

# Check credentials in backend/.env
cat backend/.env | grep DB_
```

### Port already in use
```bash
# Backend (port 3001)
lsof -ti:3001 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### CORS errors
- Verify `FRONTEND_URL` in backend/.env matches frontend URL (http://localhost:5173)
- Check axios baseURL in `frontend/src/services/api.js`

### Login niet werkend
- Zorg dat je de juiste wachtwoorden gebruikt: `Password123!`
- Check of de database migrations zijn uitgevoerd
- Verifieer JWT_SECRET in backend/.env

### HR functionaliteit niet zichtbaar
- Logout en login opnieuw om nieuwe JWT token te krijgen
- Verifieer dat user.role = 'hr' of 'admin' in database

---

## 📝 Demo Scenario

### **Presentatie Flow (10-15 min):**

**1. Introductie (1 min)**
- Toon applicatie overzicht
- Leg business case uit (België vs Nederland regels)

**2. Employee Flow - Traject Aanmaken (2 min)**
- Login als werknemer (jan.jansen@example.com)
- Ga naar "Trajecten"
- Maak nieuw traject aan:
  - Naam: "Huis - Kantoor"
  - Start: "Leuven", Eind: "Brussel"
  - Afstand: 12.8 km
  - ✅ Verklaring op eer
- Toon succesbericht

**3. Employee Flow - Rit Registreren (3 min)**
- Ga naar "Rit Registreren"
- Selecteer traject
- Kies datum (vandaag)
- Kies "Heen & Terug" (2x afstand)
- Kies "Volledig per fiets" (1x bedrag)
- ✅ Verklaring op eer
- **Toon automatische berekening**: 25.6 km × €0.27 = €6.91
- Klik "Registreer Rit"
- Toon succesbericht

**4. Validaties Demonstreren (3 min)**
- Registreer 2e rit op dezelfde dag → **Succes**
- Probeer 3e rit op dezelfde dag → **Error: "Maximum 2 ritten per dag"**
- Toon status indicator (deadline, limiet)
- (Optioneel) Toon België blokkering bij €3,160 limiet

**5. Maandoverzicht (2 min)**
- Ga naar "Overzicht"
- Toon tabel met alle ritten (datum, tijd, traject, km, bedrag)
- Toon totalen onderaan
- Wissel van maand met dropdown

**6. HR Functionaliteit (3 min)**
- Logout en login als HR (hr@company.com)
- **Dashboard**: Toon maandelijkse statistieken per werknemer
- **Werknemers**: Toon overzicht, klik "View Rides"
- **Config**: Toon configuratie BE/NL, wijzig tarief
- **CSV Export**: Download CSV, open in Excel/teksteditor
  - Toon ritten details
  - Toon samenvatting per werknemer

**7. Afsluiting (1 min)**
- Samenvatting features
- Vragen?

---

## 🎯 Scope Afbakening

### ✅ IN SCOPE (volledig geïmplementeerd)

**Kernfunctionaliteit:**
- ✅ Rit registratie met validaties
- ✅ Automatische berekening vergoeding
- ✅ Land-specifieke regels (België/Nederland)
- ✅ Deadline enforcement (configureerbaar per land)
- ✅ Maximum 2 ritten per dag (database trigger)
- ✅ Verklaring op eer (trajecten + ritten)

**Trajecten:**
- ✅ Aanmaken, bewerken, verwijderen
- ✅ Richting: heen, terug, heen_terug
- ✅ Type: volledig, gedeeltelijk per fiets
- ✅ Afstand in km

**België-specifieke regels:**
- ✅ Tarief: €0.01 - €0.35/km (validatie)
- ✅ Maximum: €3,160/jaar (€263/maand)
- ✅ Blocking na limiet (tenzij allow_above_tax_free)

**Nederland-specifieke regels:**
- ✅ Tarief: max €0.23/km
- ✅ Geen automatische blocking
- ✅ Configureerbare deadline

**HR Functionaliteit:**
- ✅ Dashboard met maandelijkse statistieken
- ✅ Werknemers overzicht met totalen
- ✅ Config management (tarieven, deadlines, limieten)
- ✅ CSV export voor payroll
- ✅ Maandelijkse automatische export (cron job)

**Technisch:**
- ✅ JWT authenticatie met role-based access
- ✅ PostgreSQL database met ENUM types en triggers
- ✅ Services layer (validation, calculation, export)
- ✅ Responsive UI met TailwindCSS
- ✅ Error handling en user feedback

### ❌ OUT OF SCOPE

**Niet geïmplementeerd (buiten PoC scope):**
- ❌ Echte payroll systeem integratie (API)
- ❌ Fiscale rapportage en belastingaangifte
- ❌ GPS tracking van fietsritten
- ❌ Approval workflow (manager goedkeuring)
- ❌ Email notificaties (deadline reminders)
- ❌ PDF rapporten generatie
- ❌ Multi-language support (alleen Nederlands)
- ❌ Mobile app (alleen web)
- ❌ Fiets van werk scenario (Nederland)
- ❌ Historische data migratie

---

## 📚 Documentatie

- **README.md**: Deze file - setup, features, user guide
- **API.md**: Volledige API documentatie (zie hieronder)
- **Database Schema**: `backend/database/schema.sql`
- **Migrations**: `backend/database/migrations/`

### API Endpoints Overzicht

**Authenticatie:**
- `POST /api/auth/register` - Nieuwe gebruiker registreren
- `POST /api/auth/login` - Inloggen (JWT token)
- `GET /api/auth/profile` - Huidige gebruiker ophalen

**Trajecten:**
- `GET /api/trajectories` - Alle trajecten van gebruiker
- `POST /api/trajectories` - Nieuw traject aanmaken
- `PUT /api/trajectories/:id` - Traject bijwerken
- `DELETE /api/trajectories/:id` - Traject verwijderen

**Ritten:**
- `GET /api/rides/month/:yearMonth` - Ritten van specifieke maand
- `POST /api/rides` - Nieuwe rit registreren
- `GET /api/check-status` - Check deadline en limiet status

**HR (alleen voor HR/admin):**
- `GET /api/hr/config` - Alle configs ophalen
- `PUT /api/config/:land` - Config bijwerken
- `GET /api/hr/employees` - Alle werknemers met totalen
- `GET /api/hr/dashboard/:year/:month` - Dashboard data
- `GET /api/hr/export-csv/:year/:month` - CSV export
- `DELETE /api/hr/trajectories/:id` - Traject verwijderen (HR)

**Employees:**
- `GET /api/employees` - Alle actieve werknemers
- `GET /api/employees/:id/rides` - Ritten van specifieke werknemer

Zie **API.md** voor gedetailleerde documentatie met request/response voorbeelden.

---

## 🏆 Success Criteria

De applicatie voldoet aan alle success criteria:

1. ✅ **Alle validatieregels werken**
   - Max 2 ritten per dag (database trigger)
   - Deadline enforcement (configureerbaar)
   - België: €3,160/jaar limiet met blocking
   - Nederland: €0.23/km maximum tarief
   - Tarief range validatie (BE: €0.01-€0.35)

2. ✅ **Berekeningen zijn correct**
   - Richting multiplier: heen_terug = 2x, heen/terug = 1x
   - Type multiplier: volledig = 1x, gedeeltelijk = 0.5x
   - Formule: `km_total × tarief × type_multiplier = bedrag`

3. ✅ **Land-specifieke logica werkt**
   - België: blocking, €3,160 max, allow_above_tax_free optie
   - Nederland: geen blocking, €0.23 max tarief
   - Configureerbare deadlines per land

4. ✅ **HR kan configuratie aanpassen**
   - Tarieven per km wijzigen
   - Deadlines aanpassen
   - Maxima (jaar/maand) wijzigen
   - Allow above tax-free toggle

5. ✅ **CSV export werkt**
   - Maandelijkse export met ritten details
   - Samenvatting per werknemer
   - Automatische cron job (1e van maand @ 02:00)

6. ✅ **Demo kan uitgevoerd worden**
   - Alle flows werken zonder crashes
   - User-friendly error messages
   - Responsive UI
   - Demo accounts beschikbaar

---

## 👥 Team

**Vak:** Business IT Development
**Academiejaar:** 2025-2026
**Case:** Fietsvergoeding Applicatie (België & Nederland)

---

## 📞 Support

Voor vragen of problemen:
1. Check deze README.md
2. Check API.md voor endpoint documentatie
3. Check troubleshooting sectie hierboven
4. Bekijk code comments in `backend/src/services/`

---

**Veel succes met jullie presentatie! 🚀🚴**