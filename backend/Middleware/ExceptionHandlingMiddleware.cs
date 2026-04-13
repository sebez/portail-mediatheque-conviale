namespace PortailMediatheque.Api.Middleware;

// Placeholder — implemented in Story 1.3
// Returns RFC 7807 ProblemDetails without stack traces in production (NFR9)
// In development: full exception detail visible for debugging
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);
    }
}
