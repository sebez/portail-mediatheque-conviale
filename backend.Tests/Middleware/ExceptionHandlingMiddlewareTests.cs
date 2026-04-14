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

        // ProblemDetails structure present with correct fields
        var json = JsonSerializer.Deserialize<JsonElement>(body);
        Assert.Equal(500, json.GetProperty("status").GetInt32());
        Assert.True(json.TryGetProperty("title", out _));
        Assert.True(json.TryGetProperty("type", out _));
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
