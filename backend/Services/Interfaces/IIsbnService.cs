using PortailMediatheque.Api.Models.DTOs;

namespace PortailMediatheque.Api.Services.Interfaces;

// Open Library → Google Books fallback chain; NEVER throw on API failure; NEVER return null
public interface IIsbnService
{
    Task<IsbnLookupDto> LookupAsync(string isbn);
}
