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
