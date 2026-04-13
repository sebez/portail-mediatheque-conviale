namespace PortailMediatheque.Api.Models;

// EF Core entity for admin accounts
// Passwords stored as BCrypt hashes — NEVER plain text (NFR6)
// Multiple admins can hold active accounts (FR18)
public class AdminUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // BCrypt.Net-Next hash
}
