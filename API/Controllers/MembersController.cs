using API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    public class MembersController(AppDbContext context) : BaseApiController
    {
        [HttpGet("getmembers")]
        public async Task<ActionResult> GetMembers() 
        {
            var members = await context.Users.ToListAsync();
            return Ok(members);
        }


        [Authorize]
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
