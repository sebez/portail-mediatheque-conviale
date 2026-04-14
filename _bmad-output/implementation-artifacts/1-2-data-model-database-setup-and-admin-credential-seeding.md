# Story 1.2: Data Model, Database Setup & Admin Credential Seeding

Status: review

## Story

As a developer,
I want the complete book and admin user data model created in SQLite with EF Core migrations auto-applied on startup and admin credentials seeded from environment variables,
So that all subsequent epics have a stable database foundation and the first admin account is ready without a manual setup step.

## Acceptance Criteria

1. **Given** the backend starts with `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables set, **when** the application initializes, **then** EF Core migrations run automatically (`MigrateAsync()`) and the `Books` and `AdminUsers` tables are created, **and** if no `AdminUser` exists one is created with the BCrypt-hashed password from `ADMIN_PASSWORD`, **and** subsequent restarts do not create duplicate admin users (idempotent).

2. **Given** the `Books` table exists, **when** inspecting the schema, **then** it has all FR34 fields: `Id`, `Isbn`, `Title`, `Author`, `Genre`, `PublicationYear`, `CoverImageUrl`, `CuratorNote`, `DateAdded`, `IsSelectionDuMois`, `Status`, **and** `DateAdded` is `DateTime`, `IsSelectionDuMois` is `bool`, `Status` is `string` defaulting to `"available"`.

3. **Given** the JWT middleware is configured, **when** the backend starts, **then** JWT authentication with 8-hour expiry is registered in the DI pipeline and ready for use by Epic 4 stories.

## Tasks / Subtasks

- [x] Task 1: Complete `AppDbContext` — add `OnModelCreating` with DB-level default for `Status = "available"` (AC: #2)

- [x] Task 2: Update `Program.cs` — three changes in one file (AC: #1, #3)
  - [x] Add EF Core / SQLite `AddDbContext<AppDbContext>` registration (read connection string from `IConfiguration`)
  - [x] Replace the `AddAuthentication()` stub with full `JwtBearerDefaults.AuthenticationScheme` configuration (exact pattern in Dev Notes)
  - [x] Add post-`Build()` migration + admin seed block (exact pattern in Dev Notes)

- [x] Task 3: Update configuration files (AC: #1, #3)
  - [x] Add `ConnectionStrings:DefaultConnection` to `appsettings.json` (empty — set via env var in production)
  - [x] Add `ConnectionStrings:DefaultConnection: "Data Source=Data/mediatheque.db"` to `appsettings.Development.json`
  - [x] Add `Jwt:Secret` dev value to `appsettings.Development.json`

- [x] Task 4: Generate EF Core migration (AC: #1, #2)
  - [x] Run `dotnet ef migrations add InitialCreate` from `backend/` directory
  - [x] Verify the generated migration creates `Books` and `AdminUsers` tables with the correct columns

- [x] Task 5: Write tests in `backend.Tests/Services/DatabaseSetupTests.cs` (AC: #1, #2)
  - [x] `Books_TableExists_WithAllFR34Fields` — insert a Book and verify defaults
  - [x] `AdminUsers_TableExists_AndCanStoreBCryptHash` — insert admin and verify BCrypt round-trip
  - [x] `AdminSeed_IsIdempotent_WhenAdminAlreadyExists` — simulate seed logic, verify count stays at 1

- [x] Task 6: Final validation
  - [x] `dotnet build` — 0 errors, 0 warnings
  - [x] `dotnet run` starts without errors (with `ADMIN_USERNAME` + `ADMIN_PASSWORD` set or in Development)
  - [x] Verify `Data/mediatheque.db` is created on first run in Development
  - [x] Restart backend — verify no duplicate admin is created
  - [x] `dotnet test` — all tests pass (11/11)

## Dev Notes

### What Already Exists from Story 1.1 — DO NOT Recreate

| File | What's there | Action for this story |
|------|-------------|----------------------|
| `backend/Models/Book.cs` | All FR34 fields (correct types + defaults) | OPTIONALLY add `[Required]` data annotations — do not change property types/names |
| `backend/Models/AdminUser.cs` | `Id`, `Username`, `PasswordHash` | No change needed |
| `backend/Data/AppDbContext.cs` | `DbSet<Book>` + `DbSet<AdminUser>` stub | ADD `OnModelCreating` — do not remove DbSets |
| `backend/Program.cs` | CORS, Swagger, `AddAuthentication()` stub, `AddAuthorization()` | MODIFY — replace auth stub, add DbContext + seed |
| `backend/appsettings.json` | `Jwt: { Secret: "", ExpiryHours: 8 }` | ADD `ConnectionStrings` section |
| `backend/appsettings.Development.json` | CORS config | ADD `ConnectionStrings` + `Jwt:Secret` dev value |
| NuGet packages | Sqlite 10.0.5, Design 10.0.5, BCrypt.Net-Next 4.1.0, JwtBearer 10.0.5 | All already installed — no `dotnet add` needed |
| `backend/Services/Interfaces/` | `IBookService`, `IAuthService`, `IIsbnService` | No change — implemented in later stories |
| `backend/Middleware/ExceptionHandlingMiddleware.cs` | Passthrough stub | No change — implemented in Story 1.3 |

### AppDbContext.cs — Add OnModelCreating

Add `OnModelCreating` to the existing class (keep the existing constructor and DbSets):

```csharp
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Models;

namespace PortailMediatheque.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>()
            .Property(b => b.Status)
            .HasDefaultValue("available"); // DB-level default (FR26)
    }
}
```

### Program.cs — Three Changes (EXACT Patterns)

**Required `using` statements to add at the top of `Program.cs`:**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;
```

**Change 1 — Add DbContext registration** (add after the existing `builder.Services.AddControllers()` line):

```csharp
// ─── EF Core + SQLite ─────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=Data/mediatheque.db"));
```

**Change 2 — Replace `AddAuthentication()` stub** (find and replace this block):

```csharp
// BEFORE (Story 1.1 stub — delete these two lines):
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

// AFTER (replace with):
// ─── Authentication — JWT Bearer ──────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret) && builder.Environment.IsProduction())
    throw new InvalidOperationException("Jwt:Secret must be configured in production.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret ?? "dev-only-secret-replace-in-production")),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero // no drift — exactly 8h expiry (NFR7)
        };
    });
builder.Services.AddAuthorization();
```

**Change 3 — Add migration + admin seed block** (add AFTER `var app = builder.Build()`, BEFORE `app.UseCors()`):

```csharp
// ─── Database migration + admin credential seed ───────────────────────────────
// MigrateAsync: auto-applies pending EF Core migrations on startup
// Admin seed: idempotent — creates admin only if AdminUsers table is empty (AC #1)
await using (var scope = app.Services.CreateAsyncScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.MigrateAsync();

    if (!await context.AdminUsers.AnyAsync())
    {
        var adminUsername = app.Configuration["ADMIN_USERNAME"]
            ?? (app.Environment.IsDevelopment() ? "admin"
                : throw new InvalidOperationException("ADMIN_USERNAME env var required in production."));
        var adminPassword = app.Configuration["ADMIN_PASSWORD"]
            ?? (app.Environment.IsDevelopment() ? "admin"
                : throw new InvalidOperationException("ADMIN_PASSWORD env var required in production."));

        context.AdminUsers.Add(new AdminUser
        {
            Username = adminUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword)
        });
        await context.SaveChangesAsync();
    }
}
```

### appsettings.json — Add ConnectionStrings Section

The full updated file (preserve all existing keys):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Urls": "http://0.0.0.0:5000",
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Cors": {
    "AllowedOrigins": ""
  },
  "Jwt": {
    "Secret": "",
    "ExpiryHours": 8
  }
}
```

**Production environment variables (Docker Compose `.env` file):**
```dotenv
ConnectionStrings__DefaultConnection=Data Source=/data/mediatheque.db
Jwt__Secret=replace-with-at-least-32-char-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-secure-password
```

Note: `__` (double underscore) maps to `:` in .NET configuration (ASP.NET Core convention).

### appsettings.Development.json — Add ConnectionStrings + JWT Secret

The full updated file (preserve existing Cors config):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=Data/mediatheque.db"
  },
  "Cors": {
    "AllowedOrigins": "http://localhost:4200"
  },
  "Jwt": {
    "Secret": "dev-only-secret-do-not-use-in-production-needs-32chars"
  }
}
```

The dev SQLite file will be created at `backend/Data/mediatheque.db` (relative to the working directory when `dotnet run` is invoked from `backend/`).

### EF Core Migration Command (EXACT)

Run from the `backend/` directory:

```bash
# Install dotnet-ef global tool if not already installed:
dotnet tool install --global dotnet-ef

# Generate the initial migration:
dotnet ef migrations add InitialCreate
```

**Expected output — three generated files in `backend/Data/Migrations/`:**
- `<timestamp>_InitialCreate.cs` — `Up()` creates `Books` and `AdminUsers` tables; `Down()` drops them
- `<timestamp>_InitialCreate.Designer.cs` — snapshot metadata (auto-generated)
- `AppDbContextModelSnapshot.cs` — current model snapshot (auto-generated)

**NEVER hand-edit any file in `Data/Migrations/`.**

If `dotnet ef` reports the tool is not found: ensure `~/.dotnet/tools` is in `PATH`, or use `dotnet tool run dotnet-ef`.

### Testing Pattern — In-Memory SQLite

Use SQLite in-memory via `EnsureCreated()` (faster than `MigrateAsync()` for unit tests):

```csharp
// backend.Tests/Services/DatabaseSetupTests.cs
using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Models;

namespace backend.Tests.Services;

public class DatabaseSetupTests : IDisposable
{
    private readonly AppDbContext _context;

    public DatabaseSetupTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;
        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task Books_TableExists_WithAllFR34Fields()
    {
        var book = new Book
        {
            Isbn = "978-0-13-235088-4",
            Title = "An Elegant Puzzle",
            Author = "Will Larson",
            Genre = "Management",
            PublicationYear = 2019,
            DateAdded = DateTime.UtcNow
        };
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Books.FindAsync(book.Id);
        Assert.NotNull(retrieved);
        Assert.Equal("available", retrieved.Status); // default applied (FR26)
        Assert.False(retrieved.IsSelectionDuMois);   // bool default
        Assert.Null(retrieved.CoverImageUrl);        // nullable
        Assert.Null(retrieved.CuratorNote);          // nullable
    }

    [Fact]
    public async Task AdminUsers_TableExists_AndCanStoreBCryptHash()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("test-password");
        _context.AdminUsers.Add(new AdminUser { Username = "admin", PasswordHash = hash });
        await _context.SaveChangesAsync();

        var retrieved = await _context.AdminUsers.FindAsync(1);
        Assert.NotNull(retrieved);
        Assert.True(BCrypt.Net.BCrypt.Verify("test-password", retrieved.PasswordHash));
    }

    [Fact]
    public async Task AdminSeed_IsIdempotent_WhenAdminAlreadyExists()
    {
        // Simulate first startup — seed admin
        _context.AdminUsers.Add(new AdminUser { Username = "admin", PasswordHash = "hash1" });
        await _context.SaveChangesAsync();

        // Simulate second startup — seed logic must not add a second admin
        if (!await _context.AdminUsers.AnyAsync())
        {
            _context.AdminUsers.Add(new AdminUser { Username = "admin", PasswordHash = "hash2" });
            await _context.SaveChangesAsync();
        }

        var count = await _context.AdminUsers.CountAsync();
        Assert.Equal(1, count); // AC #1: idempotent
    }

    public void Dispose() => _context.Dispose();
}
```

Note: `Microsoft.EntityFrameworkCore.Sqlite` is available in the test project through the project reference to the backend — no extra NuGet package needed for the test project.

### NFRs Addressed

| NFR | Implementation |
|-----|----------------|
| NFR6 | `BCrypt.Net.BCrypt.HashPassword()` — never plain text |
| NFR7 | `ClockSkew = TimeSpan.Zero` + `ExpiryHours: 8` in `appsettings.json` (Story 4.1 reads this when generating tokens) |

### Anti-Patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| Injecting `AppDbContext` directly in controllers | This story sets up DI — controllers must use service classes (implemented later) |
| Hardcoding JWT secret | Read from `builder.Configuration["Jwt:Secret"]` |
| Hand-editing `Data/Migrations/` files | Let `dotnet ef` generate them exclusively |
| Using `EnsureCreated()` in `Program.cs` | Only in tests; production uses `MigrateAsync()` |
| Admin password stored as plain text | `BCrypt.Net.BCrypt.HashPassword()` always |
| Seeding without `AnyAsync()` guard | Always check first — must be idempotent across restarts |
| Using `scope.ServiceProvider.GetService<>()` (nullable) | Use `GetRequiredService<>()` — fail fast if not registered |

### Cross-Story Dependencies

- **Story 1.3** (Global Exception Handling): Uses the same `Program.cs` middleware pipeline. This story's changes go BEFORE `app.UseCors()`. Story 1.3 will add `app.UseMiddleware<ExceptionHandlingMiddleware>()` after `app.UseHttpsRedirection()` — do not break middleware ordering.
- **Story 2.1** (Public Books API): `BookService.cs` will inject `AppDbContext` via the DI registration established in this story.
- **Story 4.1** (Admin Auth API): `AuthService.cs` will use `AppDbContext` for credential lookup and read `Jwt:Secret` + `Jwt:ExpiryHours` from `IConfiguration` as established here. The JWT scheme name (`JwtBearerDefaults.AuthenticationScheme`) is the anchor — do not change.

### Naming Conventions (MANDATORY per Architecture)

| Element | Rule | Example |
|---------|------|---------|
| Migration name | PascalCase verb + subject | `InitialCreate` |
| EF entity table | Plural of class (EF default via DbSet name) | `Books`, `AdminUsers` |
| Config key env var override | Double underscore separator | `Jwt__Secret`, `ConnectionStrings__DefaultConnection` |
| Async methods | PascalCase + `Async` suffix | `MigrateAsync()`, `AnyAsync()` |

### References

- Architecture — Data Architecture section: `_bmad-output/planning-artifacts/architecture.md`
- Architecture — Authentication & Security section: `_bmad-output/planning-artifacts/architecture.md`
- Epic 1 acceptance criteria: `_bmad-output/planning-artifacts/epics.md` (Story 1.2)
- Previous story patterns: `_bmad-output/implementation-artifacts/1-1-scaffold-frontend-and-backend-projects.md` (Dev Agent Record)

---

## Change Log

| Date | Change |
|------|--------|
| 2026-04-14 | Initial implementation — AppDbContext OnModelCreating, Program.cs JWT + EF Core + seed, config files, EF Core migration InitialCreate, DatabaseSetupTests (3 tests). All ACs satisfied, 11/11 tests pass. |

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- SQLite in-memory database test fix: `Data Source=:memory:` requires an explicit `SqliteConnection` to stay open for the entire test lifetime. EF Core opens/closes connections on each operation, destroying the in-memory DB between calls. Fix: create `SqliteConnection`, call `Open()`, pass it to `UseSqlite()` instead of passing the connection string directly, and dispose both context and connection in `Dispose()`.
- EF Core migrations generated to `backend/Migrations/` (default), not `backend/Data/Migrations/` as anticipated. This is the EF Core default when no `--output-dir` is specified and is correct.
- `dotnet ef` tools v9.0.3 (older than runtime v10.0.5) produced a warning but generated migrations correctly.

### Completion Notes List

- ✅ Task 1: `AppDbContext.OnModelCreating` added — DB-level `Status` default `"available"` (FR26). All FR34 fields confirmed in generated migration.
- ✅ Task 2: `Program.cs` updated with three changes: `AddDbContext<AppDbContext>` with SQLite, full JWT Bearer configuration (8h expiry, `ClockSkew.Zero`), post-Build migration + idempotent admin seed block.
- ✅ Task 3: `appsettings.json` has empty `ConnectionStrings:DefaultConnection`; `appsettings.Development.json` has dev SQLite path and 32-char dev JWT secret.
- ✅ Task 4: Migration `20260414095109_InitialCreate` generated — creates `AdminUsers` and `Books` tables; `Status` column has `DEFAULT 'available'`. Located at `backend/Migrations/`.
- ✅ Task 5: `DatabaseSetupTests.cs` — 3 tests, all passing (11/11 total). SQLite in-memory connection kept open explicitly to avoid DB destruction between EF Core operations.
- ✅ Task 6: `dotnet build` = 0 errors / 0 warnings; `dotnet run` applied migration and seeded admin on first start; `Data/mediatheque.db` created; `dotnet test` = 11/11 passed.

### File List

**Backend (`backend/`):**
- `Data/AppDbContext.cs` (modified — added `OnModelCreating`)
- `Migrations/20260414095109_InitialCreate.cs` (new — EF Core generated)
- `Migrations/20260414095109_InitialCreate.Designer.cs` (new — EF Core generated)
- `Migrations/AppDbContextModelSnapshot.cs` (new — EF Core generated)
- `Program.cs` (modified — added EF Core registration, replaced JWT auth stub, added seed block)
- `appsettings.json` (modified — added `ConnectionStrings` section)
- `appsettings.Development.json` (modified — added `ConnectionStrings` + `Jwt:Secret` dev value)

**Test project (`backend.Tests/`):**
- `Services/DatabaseSetupTests.cs` (new — 3 tests for schema, BCrypt, idempotent seed)
