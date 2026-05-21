using API.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembersController(AppDbContext context) : ControllerBase
    {
        [HttpGet("getmembers")]
        public async Task<ActionResult> GetMembers() 
        {
            var members = await context.Users.ToListAsync();
            return Ok(members);
        }


        [HttpGet("getmember/{id}")]
        public async Task<ActionResult> GetMember(string id)
        {
            var member = await context.Users.FindAsync(id);

            if(member == null)
            {
                return NotFound("No matching member found.");
            }

            return Ok(member);
        }
    }
}
