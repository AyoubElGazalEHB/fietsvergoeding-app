# 🚴 Fietsvergoeding Applicatie - PoC

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

### **1. Database Setup (PostgreSQL)**

```bash
# Create database
createdb fietsvergoeding

# Run schema
psql -U postgres -d fietsvergoeding -f backend/database/schema.sql

# Run seed data
psql -U postgres -d fietsvergoeding -f backend/database/migrations/002_seed_data.sql
```

**⚠️ Update passwords in seed data:**
De seed data heeft placeholder passwords. Voor demo purposes kun je deze aanpassen:

```sql
-- In 002_seed_data.sql, vervang 'hashed_password_X' met echte bcrypt hashes
-- Of voeg dit toe aan de seed data voor demo:
UPDATE employees SET password_hash = '$2a$10$...bcrypt.hash("password123")...' WHERE id = 1;
```

Voor snelle demo, run dit in psql:
```bash
npm install -g bcryptjs
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password123', 10));"
```

---

### **2. Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Configure .env file (already exists, verify values)
# DB_USER, DB_PASSWORD, JWT_SECRET, etc.

# Start server
npm run dev
```

Server draait op: `http://localhost:5000`

---

### **3. Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Configure .env file (already exists)
# VITE_API_URL=http://localhost:5000

# Start development server
npm run dev
```

Frontend draait op: `http://localhost:5173`

---

## 🧪 Demo Credentials

**Voor testing (na database setup):**

| Email | Password | Land | Role |
|-------|----------|------|------|
| jan.jansen@example.com | password123 | BE | Employee |
| marie.dupont@example.com | password123 | BE | Employee |
| pieter.de.vries@example.com | password123 | NL | Employee |
est Account 1:

Email: jan.jansen@example.com
Password: Password123!
Test Account 2:

Email: marie.dupont@example.com
Password: SecurePass456!
Test Account 3:

Email: pieter.de.vries@example.com
Password: MyPassword789!
Test Account 4:

Email: sophie.van.dijk@example.com
Password:   
Test Account 5:

Email: kurt.meijer@example.com
Password: HashMe345!

**HR Access:** Maak een account met email containing "hr" or "admin" voor HR functies.

---

## ✅ Functionele Test Checklist

### **Employee Flow:**
1. ✅ Login met employee account
2. ✅ Registreer een rit (heen/terug/beide)
3. ✅ Probeer 3e rit op dezelfde dag → moet blokkeren
4. ✅ Bekijk maandoverzicht met totalen
5. ✅ Probeer rit registreren na deadline → moet blokkeren

### **België-specifieke Tests:**
1. ✅ Registreer ritten tot max €2200/jaar
2. ✅ Probeer daarna nog een rit → moet blokkeren
3. ✅ (Als HR) Verander `allow_above_tax_free` naar TRUE
4. ✅ Registreer rit boven max → moet nu lukken

### **HR Flow:**
1. ✅ Login met HR account
2. ✅ Bekijk configuratie voor BE en NL
3. ✅ Wijzig tarief per km
4. ✅ Wijzig deadline
5. ✅ Genereer maandelijkse export (CSV download)

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

**Database connection error:**
```bash
# Check PostgreSQL is running
pg_isready

# Verify credentials in backend/.env
```

**Port already in use:**
```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill

# Frontend (port 5173)
lsof -ti:5173 | xargs kill
```

**CORS errors:**
- Verify `FRONTEND_URL` in backend/.env matches frontend URL
- Check axios baseURL in `frontend/src/services/api.js`

---

## 📝 PoC Demo Scenario

### **Presentatie Flow (10 min):**

1. **Login** (1 min)
   - Toon login scherm
   - Login als employee

2. **Rit Registreren** (2 min)
   - Selecteer datum
   - Kies traject
   - Selecteer heen+terug
   - Toon real-time berekening
   - Submit → succes bericht

3. **Validaties Tonen** (3 min)
   - Registreer 2e rit op dezelfde dag → succes
   - Probeer 3e rit → foutmelding "max 2 per dag"
   - Toon deadline indicator
   - (Als België) Toon blokkering bij max

4. **Maandoverzicht** (2 min)
   - Toon tabel met alle ritten
   - Toon totalen (km + bedrag)
   - Toon grafiek

5. **HR Functionaliteit** (2 min)
   - Login als HR
   - Toon config scherm
   - Wijzig tarief → save
   - Genereer CSV export

---

## 🎯 Scope Afbakening

**✅ IN SCOPE (werkend in PoC):**
- Rit registratie met validaties
- Automatische berekening vergoeding
- Land-specifieke regels (BE/NL)
- Deadline enforcement
- Maandelijks overzicht
- HR configuratie
- CSV export

**❌ OUT OF SCOPE:**
- Echte payroll integratie
- Fiscale rapportage
- GPS tracking
- Approval workflow
- Email notificaties
- PDF rapporten

---

## 👥 Team

**Groep:** [Jullie namen]  
**Datum:** [Demo datum]  
**Vak:** Business IT Development

---

## 📚 Documentatie

- **Functionele Analyse:** Zie `Functionele Analyse - Fietsvergoeding.pdf`
- **Technische Analyse:** Zie `Technische Analyse - Fietsvergoeding.pdf`
- **API Endpoints:** Zie `backend/src/routes/*.js` voor details

---

## 🏆 Success Criteria

De PoC is succesvol als:
1. ✅ Alle validatieregels werken (max 2/dag, deadline, maxima)
2. ✅ Berekeningen correct zijn volgens tarieven
3. ✅ Land-specifieke logica werkt (BE vs NL)
4. ✅ HR kan configuratie aanpassen
5. ✅ CSV export kan gegenereerd worden
6. ✅ Demo kan uitgevoerd worden zonder crashes

**Veel succes met jullie presentatie! 🚀**