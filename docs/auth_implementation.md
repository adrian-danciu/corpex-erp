# Authentication Implementation Guide

## Overview

This ERP system now uses JWT (JSON Web Token) authentication with NestJS backend and React frontend. The implementation includes:

- Secure JWT token authentication
- Role-based access control (RBAC)
- Token refresh mechanism
- Protected routes on frontend
- Persistent authentication state

## Architecture

### Backend (NestJS)

**Tech Stack:**
- `@nestjs/passport` - Authentication middleware
- `@nestjs/jwt` - JWT token generation/validation
- `passport-jwt` - JWT strategy for Passport
- `bcrypt` - Password hashing

**Key Components:**
- `AuthModule` - Main authentication module
- `AuthService` - Login, token generation, validation logic
- `AuthResolver` - GraphQL mutations/queries for auth
- `JwtStrategy` - Passport JWT strategy
- `JwtAuthGuard` - Route protection guard
- `RolesGuard` - Role-based access control guard

### Frontend (React)

**Tech Stack:**
- Apollo Client - GraphQL client with auth link
- Zustand - State management for auth state
- React Router - Protected routes
- React useState - Simple form state management

**Key Components:**
- `auth.store.ts` - Zustand store for auth state
- `ProtectedRoute.tsx` - Route wrapper for protected pages
- `LoginForm.tsx` - Login UI with plain React state (no form libraries)
- `apollo-client.ts` - Apollo Client with JWT header injection

## How It Works

### 1. User Login Flow

```
User submits credentials → LoginForm
  ↓
GraphQL LOGIN_MUTATION → Backend AuthResolver
  ↓
AuthService validates credentials
  ↓
Generates accessToken (15min) + refreshToken (7d)
  ↓
Returns tokens + user data
  ↓
Frontend stores in Zustand + localStorage
  ↓
Apollo Client adds token to all future requests
  ↓
User redirected to protected route
```

### 2. Token Management

**Access Token:**
- Short-lived (15 minutes)
- Sent in Authorization header: `Bearer <token>`
- Used for all authenticated requests

**Refresh Token:**
- Long-lived (7 days)
- Used to obtain new access tokens
- Stored securely in localStorage

### 3. Protected Routes

Routes can be protected with role requirements:

```tsx
<ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
  <UserCreatePage />
</ProtectedRoute>
```

### 4. Backend Route Protection

Protect GraphQL resolvers with guards:

```typescript
@Query(() => User)
@UseGuards(JwtAuthGuard)
async me(@CurrentUser() user: User) {
  return user;
}

// With role requirements
@Mutation(() => User)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MANAGER')
async createUser(@Args('input') input: CreateUserInput) {
  // Only ADMIN and MANAGER can access
}
```

## Setup & Configuration

### Backend Setup

1. **Environment Variables** (`.env`):
```bash
JWT_SECRET=your-secure-secret-key
PORT=3000
DATABASE_URL=your-database-url
```

**IMPORTANT:** Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Database**: Ensure users exist in the database with hashed passwords

3. **Start the server**:
```bash
cd apps/api
bun run start:dev
```

**Note:** This project uses Bun as the JavaScript runtime, not npm.

### Frontend Setup

1. **Environment Variables** (`.env`):
```bash
VITE_API_URL=http://localhost:3000/graphql
```

2. **Start the dev server**:
```bash
cd apps/web
bun run dev
```

**Note:** This project uses Bun as the JavaScript runtime, not npm.

## Usage Examples

### Creating Your First Admin User

Before you can login, you need to create your first admin user. Use GraphQL Playground:

**Step 1:** Open GraphQL Playground at `http://localhost:3000/graphql`

**Step 2:** Run this mutation to create an admin user:

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

**Step 3:** Save these credentials:
- **Email:** `admin@corpex.com`
- **Password:** `Admin123!`

The password will be automatically hashed with bcrypt before storing in the database.

### Login

Navigate to `http://localhost:5173/` and enter your credentials.

**Test Credentials:**
- Email: `admin@corpex.com`
- Password: `Admin123!`

After successful login, you'll be redirected to `/it/user-create`.

### Accessing Current User

```typescript
// Frontend - using the ME query
import { useQuery } from "@apollo/client";
import { ME_QUERY } from "@/graphql/mutations/auth.mutations";

function Profile() {
  const { data, loading } = useQuery(ME_QUERY);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome {data.me.firstName}!</h1>
      <p>Role: {data.me.role}</p>
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
    logout(); // Clears tokens and state from localStorage and Zustand
    navigate("/");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Token Refresh

```typescript
// Automatic refresh when access token expires
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

## User Roles

The system supports 4 roles (defined in Prisma schema):

- `USER` - Basic user access
- `MANAGER` - Manager permissions
- `FINANCE` - Finance department access
- `ADMIN` - Full system access

## Security Considerations

### Production Checklist:

- [ ] Change `JWT_SECRET` to a cryptographically secure random string
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags if using cookies
- [ ] Implement rate limiting on login endpoint
- [ ] Add CSRF protection
- [ ] Implement account lockout after failed attempts
- [ ] Add 2FA for admin accounts
- [ ] Regularly rotate JWT secrets
- [ ] Monitor and log authentication attempts
- [ ] Implement token revocation/blacklisting

### Current Security Features:

✅ Passwords hashed with bcrypt (10 rounds)
✅ JWT tokens with expiration
✅ CORS configured for frontend origin
✅ Role-based access control
✅ SQL injection prevention (Prisma ORM)

## Troubleshooting

### "Invalid email or password" error
- Verify user exists in database using GraphQL Playground
- Check password is correct
- Ensure password is hashed in database (not plain text)
- Check backend server is running on port 3000

### "Unauthorized" on protected routes
- Check access token is being sent in headers (inspect Network tab)
- Verify token hasn't expired (15min lifetime)
- Check JWT_SECRET in `.env` matches between requests
- Ensure backend is running and accessible

### Token not persisting after refresh
- Check localStorage in browser DevTools (Application tab)
- Verify Zustand persist middleware is working
- Clear browser cache/localStorage and try again
- Check for console errors

### Form inputs not working
- The Input component must use `React.forwardRef` for compatibility
- Use simple `value` and `onChange` props with useState
- Avoid complex form libraries if having issues

## API Reference

### GraphQL Mutations

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

### GraphQL Queries

#### me (Protected)
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

## File Structure

### Backend
```
apps/api/src/
├── auth/
│   ├── auth.module.ts              # Auth module configuration
│   ├── auth.service.ts             # Login, token generation, validation
│   ├── auth.resolver.ts            # GraphQL login/refresh mutations
│   ├── dto/
│   │   ├── login.input.ts          # Login input validation
│   │   └── auth-response.ts        # Auth response type
│   ├── strategies/
│   │   └── jwt.strategy.ts         # Passport JWT strategy
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # JWT authentication guard
│   │   └── roles.guard.ts          # Role-based access guard
│   └── decorators/
│       ├── roles.decorator.ts      # @Roles decorator
│       └── current-user.decorator.ts  # @CurrentUser decorator
├── users/
│   ├── users.module.ts
│   ├── users.service.ts            # Password verification helper
│   └── users.resolver.ts
└── .env                            # JWT_SECRET configuration
```

### Frontend
```
apps/web/src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx           # Simple React state form (no react-hook-form)
│   │   └── ProtectedRoute.tsx      # Route protection wrapper
│   └── ui/
│       ├── input.tsx               # Input component with forwardRef
│       ├── button.tsx
│       └── ...
├── stores/
│   └── auth.store.ts               # Zustand auth state + localStorage
├── graphql/
│   └── mutations/
│       └── auth.mutations.ts       # LOGIN_MUTATION, ME_QUERY
├── types/
│   └── auth.types.ts               # User, AuthResponse types
├── lib/
│   └── apollo-client.ts            # Apollo Client with auth headers
└── App.tsx                         # Routes with ProtectedRoute
```

## Next Steps

Consider implementing:

1. **Password Reset Flow** - Email-based password reset
2. **Email Verification** - Verify user emails on signup
3. **2FA/MFA** - Two-factor authentication for admins
4. **Session Management** - View/revoke active sessions
5. **Audit Logging** - Track all authentication events
6. **Token Blacklisting** - Revoke tokens before expiration
7. **OAuth Integration** - Google/Microsoft SSO
8. **Remember Me** - Extended session option

## Implementation Notes

### Why No React Hook Form?

The initial implementation used `react-hook-form`, but we switched to plain React state (`useState`) for simplicity and reliability. The issue was that the `Input` component wasn't properly forwarding refs, causing form registration failures.

**Current approach:**
- Simple `useState` for email and password
- Direct `value` and `onChange` props
- Manual validation function
- Works reliably with shadcn/ui components

### LoginForm Implementation

```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

// Simple validation
const validateForm = () => {
  const newErrors = { email: "", password: "" };
  if (!email) newErrors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email";
  if (!password) newErrors.password = "Password is required";
  else if (password.length < 6) newErrors.password = "Min 6 characters";
  return isValid;
};

// Simple submit handler
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  await loginMutation({ variables: { loginInput: { email, password } } });
};
```

## Support

For issues or questions, refer to:
- NestJS Passport docs: https://docs.nestjs.com/security/authentication
- Apollo Client auth: https://www.apollographql.com/docs/react/networking/authentication/
- JWT best practices: https://tools.ietf.org/html/rfc8725
- Bun documentation: https://bun.sh/docs
