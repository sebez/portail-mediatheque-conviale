using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PortailMediatheque.Api.Data;
using PortailMediatheque.Api.Middleware;
using PortailMediatheque.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// ─── CORS ────────────────────────────────────────────────────────────────────
// Origins driven by configuration — never hardcoded
// Development: http://localhost:4200 (Angular dev server)
// Production: set CORS_ORIGIN env var to production domain
var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',')
    ?? ["http://localhost:4200"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ─── Controllers ─────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ─── EF Core + SQLite ─────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=Data/mediatheque.db"));

// ─── Swagger (development only — AC #6, #7) ──────────────────────────────────
// CRITICAL: Never register or expose Swagger in production
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

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

// ─── App ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

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

// ─── Global exception handling — MUST be first to catch exceptions from all middleware ─
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger UI — development only (AC #6)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(); // Serves Swagger UI at /swagger
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
