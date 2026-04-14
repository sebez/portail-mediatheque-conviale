# Story 1.3: Global Exception Handling Middleware

Status: ready-for-dev

## Story

As a developer,
I want a global exception handler that returns RFC 7807 ProblemDetails responses without stack traces in production,
So that NFR9 is satisfied and all future API errors follow a consistent, safe format.

## Acceptance Criteria

1. **Given** any unhandled exception is thrown in a controller or service, **when** the environment is `Production`, **then** the API returns HTTP 500 with a ProblemDetails body (`type`, `title`, `status`, `detail`) and no stack trace, **and** the response `Content-Type` is `application/problem+json`.

2. **Given** an unhandled exception occurs, **when** the environment is `Development`, **then** the full exception detail (message + stack trace) is visible in the `detail` field of the ProblemDetails response for debugging.

3. **Given** a request is made to an `[Authorize]`-protected route without a token, **when** the middleware pipeline processes it, **then** HTTP 401 is returned — confirming the `[Authorize]` + middleware pipeline ordering is correct and the exception middleware does not interfere with normal auth flow.

## Tasks / Subtasks

- [ ] Task 1: Replace stub middleware with full implementation (AC: #1, #2)
  - [ ] Replace the passthrough body of `backend/Middleware/ExceptionHandlingMiddleware.cs` with the full implementation (see Dev Notes for exact code)
  - [ ] Inject `IHostEnvironment` via constructor
  - [ ] On exception: set `Content-Type: application/problem+json`, status 500, write ProblemDetails JSON
  - [ ] Production: `detail` field is `null` (no stack trace, no exception message)
  - [ ] Development: `detail` field contains `exception.ToString()` (full trace)

- [ ] Task 2: Register middleware in `Program.cs` pipeline (AC: #1, #3)
  - [ ] Add `using PortailMediatheque.Api.Middleware;` at the top of `Program.cs`
  - [ ] Add `app.UseMiddleware<ExceptionHandlingMiddleware>();` as the **first** middleware after `app.Build()`, before `app.UseSwagger()` and `app.UseCors()` (see Dev Notes for exact placement)

- [ ] Task 3: Write tests in `backend.Tests/Middleware/ExceptionHandlingMiddlewareTests.cs` (AC: #1, #2)
  - [ ] `InvokeAsync_UnhandledException_Production_Returns500WithNoProblemDetails` — production env, verify status 500, `application/problem+json` content type, no exception type string in body
  - [ ] `InvokeAsync_UnhandledException_Development_Returns500WithExceptionDetail` — development env, verify `detail` field contains exception info
  - [ ] `InvokeAsync_NoException_PassesThroughToNextMiddleware` — no exception thrown, verify next delegate was called

- [ ] Task 4: Final validation
  - [ ] `dotnet build` — 0 errors, 0 warnings
  - [ ] `dotnet run` — backend starts without errors; trigger a deliberate exception via a test route to verify 500 ProblemDetails response (or use Swagger)
  - [ ] `dotnet test` — all tests pass (14/14 expected after adding 3 new tests)

## Dev Notes

### What Already Exists — DO NOT Recreate

| File | Current state | Action for this story |
|------|---------------|----------------------|
| `backend/Middleware/ExceptionHandlingMiddleware.cs` | Passthrough stub — `InvokeAsync` just calls `await _next(context)` | REPLACE the stub body — keep the file, add `IHostEnvironment` constructor param and real try/catch |
| `backend/Program.cs` | Full pipeline from Story 1.2; no middleware registration for exceptions yet | ADD `using PortailMediatheque.Api.Middleware;` and `app.UseMiddleware<ExceptionHandlingMiddleware>();` before `app.UseCors()` |
| `backend.Tests/Services/DatabaseSetupTests.cs` | 3 tests passing (11/11 total) | No change needed |
| NuGet packages | All already installed (`Microsoft.AspNetCore.Mvc.Core` is part of `Microsoft.AspNetCore.App` framework) | No `dotnet add` needed — `ProblemDetails` is available without extra packages |

### ExceptionHandlingMiddleware.cs — Full Replacement (EXACT)

Replace the entire file content with:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System.Text.Json;

namespace PortailMediatheque.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, IHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        var problemDetails = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc7807",
            Title = "An unexpected error occurred.",
            Status = StatusCodes.Status500InternalServerError,
            Detail = _env.IsProduction() ? null : exception.ToString()
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, jsonOptions));
    }
}
```

**Key design points:**
- Inject `IHostEnvironment` (not `IWebHostEnvironment`) — sufficient for environment check; easier to fake in tests without extra interfaces
- `_env.IsProduction()` extension method from `Microsoft.Extensions.Hosting` — requires that `using` to be present
- `exception.ToString()` in Development: gives full type, message AND stack trace in one call
- Explicit `JsonSerializerOptions` with `CamelCase` — ensures JSON fields (`type`, `title`, `status`, `detail`) are lowercase, consistent with the rest of the API and RFC 7807
- Do NOT inject `ILogger` in this story — logging is out of scope for this story

### Program.cs — Middleware Registration (EXACT CHANGE)

**Add using statement** at the top of `Program.cs` (after existing usings):

```csharp
using PortailMediatheque.Api.Middleware;
```

**Add middleware registration** — insert BEFORE the existing `if (app.Environment.IsDevelopment())` Swagger block:

```csharp
// ─── Global exception handling — MUST be first to catch exceptions from all middleware ─
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

**Resulting middleware order after this change:**

```csharp
// ─── App ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ─── Database migration + admin credential seed ───────────────────────────────
await using (var scope = app.Services.CreateAsyncScope()) { /* ... unchanged ... */ }

// ─── Global exception handling — MUST be first ──────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();  // ← ADD THIS

// Swagger UI — development only (AC #6)
if (app.Environment.IsDevelopment())              // ← unchanged
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();                // ← unchanged
app.UseAuthentication();      // ← unchanged
app.UseAuthorization();       // ← unchanged
app.MapControllers();         // ← unchanged

app.Run();
```

**Why first in pipeline:** The exception middleware must wrap all subsequent middleware. If it is placed after `UseCors()`, exceptions thrown in controllers will be caught but exceptions from auth middleware will not be.

**Why NOT using `app.UseExceptionHandler()`:** The built-in `UseExceptionHandler` requires an error handling endpoint and has more complexity than needed. The custom middleware gives exact control over the ProblemDetails format and environment-based detail visibility required by NFR9.

### Testing Pattern — IHostEnvironment Fake (No Moq Needed)

Create `backend.Tests/Middleware/ExceptionHandlingMiddlewareTests.cs`:

```csharp
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using PortailMediatheque.Api.Middleware;
using System.Text.Json;

namespace backend.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    // Fake IHostEnvironment — no Moq dependency needed
    private class FakeHostEnvironment : IHostEnvironment
    {
        public FakeHostEnvironment(string environmentName) => EnvironmentName = environmentName;
        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; } = "Test";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    [Fact]
    public async Task InvokeAsync_UnhandledException_Production_Returns500WithNoProblemDetails()
    {
        var env = new FakeHostEnvironment("Production");
        RequestDelegate next = _ => throw new InvalidOperationException("Secret internal error");
        var middleware = new ExceptionHandlingMiddleware(next, env);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        Assert.Equal(500, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // Production: no exception type, message, or stack trace visible
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.DoesNotContain("Secret internal error", body);

        // ProblemDetails structure present
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal(500, json.GetProperty("status").GetInt32());
        Assert.True(json.TryGetProperty("title", out _));
    }

    [Fact]
    public async Task InvokeAsync_UnhandledException_Development_Returns500WithExceptionDetail()
    {
        var env = new FakeHostEnvironment("Development");
        RequestDelegate next = _ => throw new InvalidOperationException("Something went wrong in dev");
        var middleware = new ExceptionHandlingMiddleware(next, env);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context);

        Assert.Equal(500, context.Response.StatusCode);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();

        // Development: exception type and message visible for debugging
        Assert.Contains("InvalidOperationException", body);
        Assert.Contains("Something went wrong in dev", body);
    }

    [Fact]
    public async Task InvokeAsync_NoException_PassesThroughToNextMiddleware()
    {
        var env = new FakeHostEnvironment("Production");
        var nextCalled = false;
        RequestDelegate next = _ => { nextCalled = true; return Task.CompletedTask; };
        var middleware = new ExceptionHandlingMiddleware(next, env);

        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        Assert.True(nextCalled); // Exception middleware is transparent when no error
    }
}
```

**Note on test project folder:** Create `backend.Tests/Middleware/` directory (new — mirrors source `backend/Middleware/` structure). No new NuGet packages needed — `Microsoft.AspNetCore.Http` is available via the `Microsoft.AspNetCore.App` framework already referenced.

### NFRs Addressed

| NFR | Implementation |
|-----|----------------|
| NFR9 | `ExceptionHandlingMiddleware` returns ProblemDetails without stack trace when `_env.IsProduction()` |
| NFR8 | Middleware ordering preserved: `UseAuthentication()` + `UseAuthorization()` still handle 401 — exception middleware does not interfere |

### Anti-Patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| Placing `UseMiddleware<ExceptionHandlingMiddleware>()` after `UseCors()` | Must be FIRST after `app.Build()` to catch all downstream exceptions |
| Using `app.UseExceptionHandler("/error")` | Custom middleware gives precise control over ProblemDetails format; no separate error route needed |
| Calling `exception.Message` instead of `exception.ToString()` in Development | `exception.Message` omits the stack trace; use `ToString()` for the full diagnostic output |
| Setting `Content-Type` after writing the body | Set `context.Response.ContentType` BEFORE calling `WriteAsync()` |
| Leaving `Detail` as empty string in production | Explicitly assign `null` — RFC 7807 omits the field entirely when null, cleaner response |
| Catching only `Exception` and swallowing other error types | The base `Exception` catch is correct here — let the middleware handle everything; specific exceptions handled in controllers by returning appropriate ActionResult |

### Cross-Story Dependencies

- **Story 1.2** established the middleware pipeline in `Program.cs`. This story inserts one line before `app.UseCors()` — all other lines in `Program.cs` remain unchanged. Do NOT rearrange existing middleware.
- **Story 1.4** (Docker Compose): The `ASPNETCORE_ENVIRONMENT=Production` env var set in Docker Compose controls whether this middleware hides or shows exception details. Ensure the Docker Compose file includes `ASPNETCORE_ENVIRONMENT=Production` for the backend service.
- **All future stories**: Every controller action benefits from this middleware automatically. No additional configuration needed in controllers — unhandled exceptions surface as ProblemDetails 500 responses.

### Project Structure Notes

- `backend/Middleware/ExceptionHandlingMiddleware.cs` — already exists (stub created in Story 1.1); REPLACE body, keep namespace and class name
- `backend.Tests/Middleware/ExceptionHandlingMiddlewareTests.cs` — NEW file, NEW folder `Middleware/`
- `backend/Program.cs` — MINIMAL change: add one `using` statement and one `app.UseMiddleware<>()` call

### References

- Architecture — Cross-Cutting Concerns, Error Handling: `_bmad-output/planning-artifacts/architecture.md`
- Architecture — NFR9 coverage: `_bmad-output/planning-artifacts/architecture.md` (Requirements Coverage Validation)
- Architecture — Enforcement Guidelines (ProblemDetails for all errors): `_bmad-output/planning-artifacts/architecture.md`
- Epic 1, Story 1.3: `_bmad-output/planning-artifacts/epics.md`
- Previous story patterns: `_bmad-output/implementation-artifacts/1-2-data-model-database-setup-and-admin-credential-seeding.md`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
