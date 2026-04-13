using System.ComponentModel.DataAnnotations;

namespace PortailMediatheque.Api.Models.DTOs;

public class UpdateBookRequest
{
    [Required] public string Isbn { get; set; } = string.Empty;
    [Required] public string Title { get; set; } = string.Empty;
    [Required] public string Author { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int PublicationYear { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? CuratorNote { get; set; }
    public bool IsSelectionDuMois { get; set; }
    public string Status { get; set; } = "available";
}
