using Microsoft.EntityFrameworkCore;
using PortailMediatheque.Api.Models;

namespace PortailMediatheque.Api.Data;

// EF Core DbContext — fully configured in Story 1.2
// SQLite provider; auto-apply migrations via context.Database.Migrate() on startup
// NEVER inject AppDbContext directly in controllers — always via Service classes (architecture rule)
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>()
            .Property(b => b.Status)
            .HasDefaultValue("available"); // DB-level default (FR26)
    }
}
