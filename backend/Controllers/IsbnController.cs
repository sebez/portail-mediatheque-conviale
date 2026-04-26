using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortailMediatheque.Api.Models.DTOs;
using PortailMediatheque.Api.Services.Interfaces;

namespace PortailMediatheque.Api.Controllers;

[ApiController]
[Route("[controller]")]  // → /isbn  (nginx strips /api prefix; Angular dev calls :5000/isbn directly)
[Authorize]              // ALL endpoints require JWT — IsbnController is admin-only (FR27–FR33)
public class IsbnController : ControllerBase
{
    private readonly IIsbnService _isbnService;

    public IsbnController(IIsbnService isbnService)
    {
        _isbnService = isbnService;
    }

    // GET /isbn/{isbn}  →  200 with IsbnLookupDto (always — never 404 or 500 for API failures)
    [HttpGet("{isbn}")]
    public async Task<ActionResult<IsbnLookupDto>> GetByIsbnAsync(string isbn)
    {
        var result = await _isbnService.LookupAsync(isbn);
        return Ok(result);
    }
}
