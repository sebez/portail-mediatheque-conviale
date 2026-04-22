# Story 4.1: Admin Login & Logout API

Status: ready-for-dev

## Story

As the library admin system,
I want a login endpoint that validates credentials and issues a JWT, and a logout endpoint,
so that authenticated admins can access protected resources and securely end their session.

## Acceptance Criteria

1. **Given** `POST /api/auth/login` is called with valid `username` and `password`, **when** the backend validates against the `AdminUsers` table using BCrypt comparison, **then** HTTP 200 is returned with a `TokenResponse` containing a signed JWT valid for 8 hours, and the JWT payload includes the admin username as a claim.

2. **Given** `POST /api/auth/login` is called with invalid credentials, **when** the backend processes the request, **then** HTTP 401 with a ProblemDetails body is returned — no detail revealing whether username or password was wrong.

3. **Given** `POST /api/auth/logout` is called with a valid JWT in the `Authorization` header, **when** the backend processes the request, **then** HTTP 200 is returned (stateless logout — client deletes the token).

4. **Given** any admin API endpoint decorated with `[Authorize]`, **when** called without a JWT or with an expired JWT, **then** HTTP 401 is returned — never a redirect to a login page.

5. **Given** multiple admin accounts exist in `AdminUsers`, **when** each logs in with their own credentials, **then** each receives a valid JWT.

## Tasks / Subtasks

- [ ] Task 1: Implement `AuthService.cs` (AC: #1, #2, #5)
  - [ ] Create `backend/Services/AuthService.cs` implementing `IAuthService`
  - [ ] Inject `AppDbContext` and `IConfiguration` via constructor
  - [ ] `LoginAsync`: query `AdminUsers` by username → `BCrypt.Verify` password → generate JWT on success → return `null` on any failure
  - [ ] JWT: 8-hour expiry, `ClockSkew = TimeSpan.Zero` (already set in middleware), `Sub` claim = username, `Jti` claim = new Guid

- [ ] Task 2: Implement `AuthController.cs` (AC: #1, #2, #3, #4)
  - [ ] Create `backend/Controllers/AuthController.cs`
  - [ ] Route: `[Route("[controller]")]` → `/auth` (nginx adds `/api` prefix in production)
  - [ ] `POST /auth/login` — public, no `[Authorize]`, returns `TokenResponse` or 401 ProblemDetails
  - [ ] `POST /auth/logout` — `[Authorize]`, stateless, returns `Ok()`
  - [ ] Use `Problem()` helper for 401 error (not a raw `Unauthorized()`)

- [ ] Task 3: Register `IAuthService` in DI (AC: #1–#5)
  - [ ] Open `backend/Program.cs`
  - [ ] Add `builder.Services.AddScoped<IAuthService, AuthService>();` after the existing `IBookService` registration (line ~45)

- [ ] Task 4: Validation
  - [ ] `dotnet build` — 0 errors
  - [ ] Start backend with `dotnet run`, open Swagger at `http://localhost:5000/swagger`
  - [ ] POST `/auth/login` with `{"username":"admin","password":"admin"}` → expect `{"token":"eyJ..."}` (dev credentials from Program.cs seed)
  - [ ] POST `/auth/login` with wrong password → expect HTTP 401 ProblemDetails
  - [ ] POST `/auth/logout` with `Authorization: Bearer <token>` → expect HTTP 200
  - [ ] POST `/auth/logout` without token → expect HTTP 401
  - [ ] Decode JWT at jwt.io and verify: `sub` = "admin", expiry ~8h from now

## Dev Notes

### Scope: Backend only — 3 files to create, 1 line to add in Program.cs

This story is **backend-only**. No Angular changes. The Angular auth infrastructure is Story 4.2.

### What Already Exists — DO NOT Recreate

| Artifact | Location | Status |
|----------|----------|--------|
| `IAuthService` interface | `backend/Services/Interfaces/IAuthService.cs` | EXISTS — already defines `LoginAsync(LoginRequest) → Task<TokenResponse?>` |
| `LoginRequest` DTO | `backend/Models/DTOs/LoginRequest.cs` | EXISTS — Username + Password, both `[Required]` |
| `TokenResponse` DTO | `backend/Models/DTOs/TokenResponse.cs` | EXISTS — single `Token` string property |
| `AdminUser` entity | `backend/Models/AdminUser.cs` | EXISTS — Id, Username, PasswordHash |
| `AppDbContext` | `backend/Data/AppDbContext.cs` | EXISTS — `DbSet<AdminUser> AdminUsers` registered |
| JWT Bearer middleware | `backend/Program.cs` (lines 52–64) | EXISTS — validates `Jwt:Secret`, `ClockSkew = TimeSpan.Zero` |
| BCrypt.Net-Next | `PortailMediatheque.Api.csproj` | EXISTS v4.1.0 — `BCrypt.Net.BCrypt.Verify()` available |
| System.IdentityModel.Tokens.Jwt | Transitive via JwtBearer v10.0.5 | EXISTS — `JwtSecurityTokenHandler`, `JwtSecurityToken` available |
| `ExceptionHandlingMiddleware` | `backend/Middleware/ExceptionHandlingMiddleware.cs` | EXISTS — ProblemDetails, no stack traces in prod |

### Task 1: Full `AuthService.cs` Implementation

File to create: `backend/Services/AuthService.cs`

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<TokenResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _context.AdminUsers
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null; // null → controller returns 401 (AC #2: no hint about which field was wrong)

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Secret"] ?? "dev-only-secret-replace-in-production"));

        var token = new JwtSecurityToken(
            claims: [
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            ],
            expires: DateTime.UtcNow.AddHours(8), // NFR7: 8-hour expiry
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new TokenResponse { Token = new JwtSecurityTokenHandler().WriteToken(token) };
    }
}
```

**Key implementation notes:**
- Username lookup is **exact match** (not case-insensitive) — consistent with how credentials were seeded
- `BCrypt.Net.BCrypt.Verify(plainText, hash)` — always called even when user is `null` to avoid timing attacks is optional at this scale, but return `null` early after both checks for clarity
- Same `Jwt:Secret` key used here and in middleware validation (must match or tokens won't validate)
- `JwtRegisteredClaimNames.Sub` is the standard claim for the subject (username) — Angular Story 4.2 will read this
- No `ValidIssuer`/`ValidAudience` since middleware has `ValidateIssuer = false`, `ValidateAudience = false`

### Task 2: Full `AuthController.cs` Implementation

File to create: `backend/Controllers/AuthController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Controllers;

[ApiController]
[Route("[controller]")] // → /auth  (nginx strips /api prefix in production)
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /auth/login — no [Authorize] (public endpoint, AC #1, #2)
    [HttpPost("login")]
    public async Task<ActionResult<TokenResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result is null)
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Unauthorized",
                detail: "Invalid credentials."); // AC #2: no field-level hint

        return Ok(result);
    }

    // POST /auth/logout — [Authorize] required (AC #3, #4)
    // Stateless: client deletes localStorage token after 200
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok();
    }
}
```

**Key implementation notes:**
- `[Route("[controller]")]` → `/auth` exactly like `BooksController` → `/books`
- `Problem()` returns RFC 7807 ProblemDetails (consistent with existing `BooksController` 404 pattern)
- `Logout()` is synchronous (`IActionResult`, not `Task<IActionResult>`) — no async I/O needed
- The `[Authorize]` on `Logout` confirms JWT pipeline is working end-to-end (AC #4)

### Task 3: Program.cs Change

File: `backend/Program.cs`

Add **one line** after the existing `IBookService` registration (currently around line 45):

```csharp
// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IAuthService, AuthService>();  // ← ADD THIS LINE
```

That's the only change to `Program.cs`. All JWT middleware, BCrypt seeding, and DI infrastructure is already wired.

### Architecture Compliance

- **`[Route("[controller]")]`** — always, no hard-coded path strings. Results in `/auth` which nginx proxies to as `/api/auth`
- **Controller → Service → DbContext** — `AuthController` only knows `IAuthService`, never `AppDbContext` directly (architecture rule)
- **ProblemDetails for errors** — use `Problem()` helper, never raw `Unauthorized()` return (returns proper RFC 7807 format)
- **Async throughout** — `LoginAsync` returns `Task<TokenResponse?>`, controller action returns `Task<ActionResult<TokenResponse>>`; `Logout` is legitimately sync
- **No hardcoded secrets** — JWT secret from `IConfiguration["Jwt:Secret"]` with dev fallback (same pattern as existing `Program.cs`)
- **`IAuthService` scoped** — consistent with `IBookService` (DbContext is scoped, so services that use it must also be scoped)

### Previous Story Intelligence (from Stories 1–3)

1. **No `.component.ts` / `.controller.cs` suffix duplication** — class names already follow `AuthController` / `AuthService` pattern (no double suffix). `Controller` suffix on class, file named `AuthController.cs`.

2. **Namespace convention** — `PortailMediatheque.Api.Controllers` for controllers, `PortailMediatheque.Api.Services` for services. File-scoped namespaces (`namespace X;` not `namespace X { }`).

3. **C# 13 collection expression syntax** — `[new Claim(...), ...]` is valid C# 12+ primary constructor syntax used elsewhere (see Program.cs CORS: `["http://localhost:4200"]`). Use array initializers for claims list.

4. **`Problem()` helper** — used in `BooksController` for 404. Same pattern for 401 in `AuthController`. Do NOT return `Unauthorized()` alone (it won't include ProblemDetails body).

5. **`dotnet build` before running** — the `IAuthService` registration in Program.cs is required or DI will throw at runtime. Always verify `0 Error(s)` before testing.

6. **JWT secret in dev** — `Program.cs` already uses `"dev-only-secret-replace-in-production"` as fallback for `Jwt:Secret`. `AuthService` uses the same fallback so tokens sign and validate consistently in development without `.env` setup.

7. **BCrypt call pattern** — `BCrypt.Net.BCrypt.HashPassword(plainText)` for hashing (in seeding), `BCrypt.Net.BCrypt.Verify(plainText, hash)` for verification (in AuthService). Do NOT reverse the argument order.

### Security Requirements (NFR6–NFR9)

| NFR | Implementation |
|-----|----------------|
| NFR6: bcrypt passwords | `BCrypt.Net.BCrypt.Verify()` — never plain-text comparison |
| NFR7: JWT 8h expiry | `expires: DateTime.UtcNow.AddHours(8)` + `ClockSkew = TimeSpan.Zero` in middleware |
| NFR8: 401 for unauth | `[Authorize]` on `/logout` + JWT middleware returns 401 automatically for invalid/expired tokens |
| NFR9: No stack traces | `ExceptionHandlingMiddleware` handles unhandled exceptions — already in pipeline |

**Security anti-patterns to avoid:**
- Never compare password with `==` or string comparison — always BCrypt.Verify
- Never log the plain-text password anywhere
- Never return different error messages for "username not found" vs "wrong password" — always the same 401 (AC #2)

### Endpoints Summary

| Endpoint | Auth | Response success | Response failure |
|----------|------|-----------------|------------------|
| `POST /auth/login` | None | 200 `TokenResponse` | 401 ProblemDetails |
| `POST /auth/logout` | JWT Bearer | 200 (empty) | 401 (middleware) |

### Angular contract (for Story 4.2 reference)

Story 4.2 (`AuthService` + interceptor + guard) will call:
- `POST /api/auth/login` → stores `response.token` in `localStorage`
- `POST /api/auth/logout` → clears `localStorage`
- Interceptor attaches `Authorization: Bearer <token>` to all subsequent requests

The JWT claim `sub` contains the admin username — Story 4.2 may display it in the admin app bar.

### References

- `IAuthService` interface: [backend/Services/Interfaces/IAuthService.cs](backend/Services/Interfaces/IAuthService.cs)
- `LoginRequest` DTO: [backend/Models/DTOs/LoginRequest.cs](backend/Models/DTOs/LoginRequest.cs)
- `TokenResponse` DTO: [backend/Models/DTOs/TokenResponse.cs](backend/Models/DTOs/TokenResponse.cs)
- `AdminUser` entity: [backend/Models/AdminUser.cs](backend/Models/AdminUser.cs)
- `AppDbContext`: [backend/Data/AppDbContext.cs](backend/Data/AppDbContext.cs)
- `Program.cs` (JWT config + DI): [backend/Program.cs](backend/Program.cs)
- `BooksController` (reference pattern): [backend/Controllers/BooksController.cs](backend/Controllers/BooksController.cs)
- Architecture — Auth patterns, naming, anti-patterns: `_bmad-output/planning-artifacts/architecture.md` (sections: Authentication & Security, Naming Patterns, Anti-patterns)
- Epics — Epic 4 story 4.1 full acceptance criteria: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
