using PortailMediatheque.Api.Models.DTOs;

namespace PortailMediatheque.Api.Services.Interfaces;

// Implemented in Story 4.1
public interface IAuthService
{
    Task<TokenResponse?> LoginAsync(LoginRequest request);
}
