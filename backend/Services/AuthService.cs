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
