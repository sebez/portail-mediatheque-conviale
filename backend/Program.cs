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

// ─── Swagger (development only — AC #6, #7) ──────────────────────────────────
// CRITICAL: Never register or expose Swagger in production
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

// ─── Authentication / Authorization (stub — fully configured in Story 1.2) ───
// JWT middleware registered here so Story 1.2 can configure it without Program.cs changes
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

// ─── App ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

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
