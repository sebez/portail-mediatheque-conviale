using PortailMediatheque.Api.Models.DTOs;
using Xunit;

namespace backend.Tests.Controllers;

// Story 1.1 — verifies that the DTO models are correctly defined for the API
public class ProgramConfigTests
{
    [Fact]
    public void LoginRequest_HasUsernameAndPassword()
    {
        var request = new LoginRequest
        {
            Username = "admin",
            Password = "secure-password"
        };

        Assert.Equal("admin", request.Username);
        Assert.Equal("secure-password", request.Password);
    }

    [Fact]
    public void TokenResponse_HasTokenField()
    {
        var response = new TokenResponse
        {
            Token = "eyJhbGciOiJIUzI1NiJ9.test.signature"
        };

        Assert.NotEmpty(response.Token);
    }

    [Fact]
    public void CreateBookRequest_HasRequiredFields()
    {
        var request = new CreateBookRequest
        {
            Isbn = "978-0-13-235088-4",
            Title = "An Elegant Puzzle",
            Author = "Will Larson"
        };

        Assert.Equal("978-0-13-235088-4", request.Isbn);
        Assert.Equal("An Elegant Puzzle", request.Title);
        Assert.Equal("Will Larson", request.Author);
    }

    [Fact]
    public void UpdateBookRequest_HasStatusField()
    {
        // FR26: status field for forward-compat
        var request = new UpdateBookRequest
        {
            Isbn = "978-0-13-235088-4",
            Title = "Test",
            Author = "Test Author"
        };

        Assert.Equal("available", request.Status);
    }
}
