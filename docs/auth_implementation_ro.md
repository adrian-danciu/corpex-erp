# Ghid de Implementare a Autentificării

## Prezentare Generală

Acest sistem ERP folosește autentificare JWT (JSON Web Token) cu backend NestJS și frontend React. Implementarea include:

- Autentificare securizată cu token-uri JWT
- Control de acces bazat pe roluri (RBAC)
- Mecanism de reîmprospătare a token-urilor
- Rute protejate pe frontend
- Stare de autentificare persistentă

## Arhitectură

### Backend (NestJS)

**Stack Tehnologic:**
- `@nestjs/passport` - Middleware de autentificare
- `@nestjs/jwt` - Generare/validare token-uri JWT
- `passport-jwt` - Strategie JWT pentru Passport
- `bcrypt` - Hash-uire parole

**Componente Cheie:**
- `AuthModule` - Modul principal de autentificare
- `AuthService` - Logică login, generare token-uri, validare
- `AuthResolver` - Mutații/interogări GraphQL pentru autentificare
- `JwtStrategy` - Strategie JWT Passport
- `JwtAuthGuard` - Guard de protecție rute
- `RolesGuard` - Guard de control acces bazat pe roluri

### Frontend (React)

**Stack Tehnologic:**
- Apollo Client - Client GraphQL cu auth link
- Zustand - Management stare pentru autentificare
- React Router - Rute protejate
- React useState - Management simplu al stării formularului

**Componente Cheie:**
- `auth.store.ts` - Store Zustand pentru starea de autentificare
- `ProtectedRoute.tsx` - Wrapper pentru pagini protejate
- `LoginForm.tsx` - UI login cu stare React simplă (fără librării de formulare)
- `apollo-client.ts` - Apollo Client cu injectare headere JWT

## Cum Funcționează

### 1. Fluxul de Login al Utilizatorului

```
Utilizatorul trimite credențiale → LoginForm
  ↓
GraphQL LOGIN_MUTATION → Backend AuthResolver
  ↓
AuthService validează credențialele
  ↓
Generează accessToken (15min) + refreshToken (7 zile)
  ↓
Returnează token-uri + date utilizator
  ↓
Frontend stochează în Zustand + localStorage
  ↓
Apollo Client adaugă token-ul la toate cererile viitoare
  ↓
Utilizatorul este redirecționat către ruta protejată
```

### 2. Management Token-uri

**Access Token:**
- De scurtă durată (15 minute)
- Trimis în header Authorization: `Bearer <token>`
- Folosit pentru toate cererile autentificate

**Refresh Token:**
- De lungă durată (7 zile)
- Folosit pentru a obține token-uri de acces noi
- Stocat securizat în localStorage

### 3. Rute Protejate

Rutele pot fi protejate cu cerințe de rol:

```tsx
<ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
  <UserCreatePage />
</ProtectedRoute>
```

### 4. Protecție Rute Backend

Protejează resolver-ele GraphQL cu guard-uri:

```typescript
@Query(() => User)
@UseGuards(JwtAuthGuard)
async me(@CurrentUser() user: User) {
  return user;
}

// Cu cerințe de rol
@Mutation(() => User)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
async createUser(@Args('input') input: CreateUserInput) {
  // Doar ADMIN și MANAGER pot accesa
}
```

## Configurare & Setup

### Configurare Backend

1. **Variabile de Mediu** (`.env`):
```bash
JWT_SECRET=cheia-ta-secreta-sigura
PORT=3000
DATABASE_URL=url-baza-de-date
```

**IMPORTANT:** Generează un secret JWT securizat:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Baza de Date**: Asigură-te că utilizatorii există în baza de date cu parole hash-uite

3. **Pornește serverul**:
```bash
cd apps/api
bun run start:dev
```

**Notă:** Acest proiect folosește Bun ca runtime JavaScript, nu npm.

### Configurare Frontend

1. **Variabile de Mediu** (`.env`):
```bash
VITE_API_URL=http://localhost:3000/graphql
```

2. **Pornește serverul de dev**:
```bash
cd apps/web
bun run dev
```

**Notă:** Acest proiect folosește Bun ca runtime JavaScript, nu npm.

## Exemple de Utilizare

### Crearea Primului Utilizator Admin

Înainte de a te putea autentifica, trebuie să creezi primul utilizator admin. Folosește GraphQL Playground:

**Pasul 1:** Deschide GraphQL Playground la `http://localhost:3000/graphql`

**Pasul 2:** Rulează această mutație pentru a crea un utilizator admin:

```graphql
mutation CreateAdminUser {
  createUser(createUserInput: {
    firstName: "Admin"
    lastName: "User"
    email: "admin@corpex.com"
    password: "Admin123!"
    role: ADMIN
  }) {
    id
    email
    role
  }
}
```

**Pasul 3:** Salvează aceste credențiale:
- **Email:** `admin@corpex.com`
- **Parolă:** `Admin123!`

Parola va fi automat hash-uită cu bcrypt înainte de a fi stocată în baza de date.

### Login

Navighează la `http://localhost:5173/` și introdu credențialele.

**Credențiale de Test:**
- Email: `admin@corpex.com`
- Parolă: `Admin123!`

După autentificarea reușită, vei fi redirecționat către `/it/user-create`.

### Accesarea Utilizatorului Curent

```typescript
// Frontend - folosind interogarea ME
import { useQuery } from "@apollo/client";
import { ME_QUERY } from "@/graphql/mutations/auth.mutations";

function Profile() {
  const { data, loading } = useQuery(ME_QUERY);

  if (loading) return <div>Se încarcă...</div>;

  return (
    <div>
      <h1>Bun venit {data.me.firstName}!</h1>
      <p>Rol: {data.me.role}</p>
    </div>
  );
}
```

### Logout

```typescript
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout(); // Șterge token-urile și starea din localStorage și Zustand
    navigate("/");
  };

  return <button onClick={handleLogout}>Deconectare</button>;
}
```

### Reîmprospătare Token

```typescript
// Reîmprospătare automată când token-ul de acces expiră
import { REFRESH_TOKEN_MUTATION } from "@/graphql/mutations/auth.mutations";

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  const result = await apolloClient.mutate({
    mutation: REFRESH_TOKEN_MUTATION,
    variables: { refreshToken }
  });

  const newAccessToken = result.data.refreshToken;
  useAuthStore.getState().updateToken(newAccessToken);
};
```

## Roluri Utilizator

Sistemul suportă 4 roluri (definite în schema Prisma):

- `USER` - Acces utilizator de bază
- `MANAGER` - Permisiuni manager
- `FINANCE` - Acces departament financiar
- `ADMIN` - Acces complet la sistem

## Considerații de Securitate

### Checklist Producție:

- [ ] Schimbă `JWT_SECRET` cu un șir aleatoriu criptografic securizat
- [ ] Folosește HTTPS în producție
- [ ] Setează flag-uri securizate pentru cookie-uri dacă folosești cookie-uri
- [ ] Implementează rate limiting pe endpoint-ul de login
- [ ] Adaugă protecție CSRF
- [ ] Implementează blocare cont după încercări eșuate
- [ ] Adaugă 2FA pentru conturi admin
- [ ] Rotește regulat secretele JWT
- [ ] Monitorizează și înregistrează încercările de autentificare
- [ ] Implementează revocare/blacklisting token-uri

### Funcții de Securitate Curente:

✅ Parole hash-uite cu bcrypt (10 runde)
✅ Token-uri JWT cu expirare
✅ CORS configurat pentru originea frontend
✅ Control de acces bazat pe roluri
✅ Prevenire injecție SQL (Prisma ORM)

## Depanare

### Eroare "Invalid email or password"
- Verifică că utilizatorul există în baza de date folosind GraphQL Playground
- Verifică că parola este corectă
- Asigură-te că parola este hash-uită în baza de date (nu text simplu)
- Verifică că serverul backend rulează pe portul 3000

### "Unauthorized" pe rute protejate
- Verifică că token-ul de acces este trimis în headere (inspectează tab-ul Network)
- Verifică că token-ul nu a expirat (durată de viață 15min)
- Verifică că `JWT_SECRET` din `.env` se potrivește între cereri
- Asigură-te că backend-ul rulează și este accesibil

### Token-ul nu persistă după refresh
- Verifică localStorage în browser DevTools (tab Application)
- Verifică că middleware-ul persist Zustand funcționează
- Șterge cache-ul browser-ului/localStorage și încearcă din nou
- Verifică erorile în consolă

### Input-urile formularului nu funcționează
- Componenta Input trebuie să folosească `React.forwardRef` pentru compatibilitate
- Folosește props-uri simple `value` și `onChange` cu useState
- Evită librăriile complexe de formulare dacă ai probleme

## Referință API

### Mutații GraphQL

#### login
```graphql
mutation Login($loginInput: LoginInput!) {
  login(loginInput: $loginInput) {
    accessToken
    refreshToken
    user {
      id
      email
      firstName
      lastName
      role
    }
  }
}
```

#### refreshToken
```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken)
}
```

### Interogări GraphQL

#### me (Protejată)
```graphql
query Me {
  me {
    id
    email
    firstName
    lastName
    role
    createdAt
    updatedAt
  }
}
```

## Structură Fișiere

### Backend
```
apps/api/src/
├── auth/
│   ├── auth.module.ts              # Configurare modul auth
│   ├── auth.service.ts             # Login, generare token, validare
│   ├── auth.resolver.ts            # Mutații GraphQL login/refresh
│   ├── dto/
│   │   ├── login.input.ts          # Validare input login
│   │   └── auth-response.ts        # Tip răspuns auth
│   ├── strategies/
│   │   └── jwt.strategy.ts         # Strategie JWT Passport
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # Guard autentificare JWT
│   │   └── roles.guard.ts          # Guard acces bazat pe roluri
│   └── decorators/
│       ├── roles.decorator.ts      # Decorator @Roles
│       └── current-user.decorator.ts  # Decorator @CurrentUser
├── users/
│   ├── users.module.ts
│   ├── users.service.ts            # Helper verificare parole
│   └── users.resolver.ts
└── .env                            # Configurare JWT_SECRET
```

### Frontend
```
apps/web/src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx           # Formular cu stare React simplă (fără react-hook-form)
│   │   └── ProtectedRoute.tsx      # Wrapper protecție rute
│   └── ui/
│       ├── input.tsx               # Componentă Input cu forwardRef
│       ├── button.tsx
│       └── ...
├── stores/
│   └── auth.store.ts               # Stare auth Zustand + localStorage
├── graphql/
│   └── mutations/
│       └── auth.mutations.ts       # LOGIN_MUTATION, ME_QUERY
├── types/
│   └── auth.types.ts               # Tipuri User, AuthResponse
├── lib/
│   └── apollo-client.ts            # Apollo Client cu headere auth
└── App.tsx                         # Rute cu ProtectedRoute
```

## Note de Implementare

### De Ce Fără React Hook Form?

Implementarea inițială folosea `react-hook-form`, dar am trecut la stare React simplă (`useState`) pentru simplitate și fiabilitate. Problema era că componenta `Input` nu forwarda corect ref-urile, cauzând eșecuri la înregistrarea formularului.

**Abordarea curentă:**
- `useState` simplu pentru email și parolă
- Props-uri directe `value` și `onChange`
- Funcție manuală de validare
- Funcționează fiabil cu componentele shadcn/ui

### Implementare LoginForm

```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

// Validare simplă
const validateForm = () => {
  const newErrors = { email: "", password: "" };
  if (!email) newErrors.email = "Email obligatoriu";
  else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email invalid";
  if (!password) newErrors.password = "Parolă obligatorie";
  else if (password.length < 6) newErrors.password = "Minim 6 caractere";
  return isValid;
};

// Handler submit simplu
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  await loginMutation({ variables: { loginInput: { email, password } } });
};
```

## Pași Următori

Consideră implementarea:

1. **Flux Resetare Parolă** - Resetare parolă bazată pe email
2. **Verificare Email** - Verifică email-urile utilizatorilor la înregistrare
3. **2FA/MFA** - Autentificare cu doi factori pentru admini
4. **Management Sesiuni** - Vizualizare/revocare sesiuni active
5. **Logging Audit** - Urmărește toate evenimentele de autentificare
6. **Blacklisting Token-uri** - Revocă token-uri înainte de expirare
7. **Integrare OAuth** - SSO Google/Microsoft
8. **Remember Me** - Opțiune sesiune extinsă

## Suport

Pentru probleme sau întrebări, consultă:
- Documentație NestJS Passport: https://docs.nestjs.com/security/authentication
- Autentificare Apollo Client: https://www.apollographql.com/docs/react/networking/authentication/
- Best practices JWT: https://tools.ietf.org/html/rfc8725
- Documentație Bun: https://bun.sh/docs
