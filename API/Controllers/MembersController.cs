using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfacess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class MembersController(IMemberRepository memberRespository, IUnitOfWork uow) : BaseApiController
    {
        [Authorize]
        [HttpGet("getmembers")]
        public async Task<ActionResult<IReadOnlyList<Member>>> GetMembers([FromQuery] MemberParams memberParams)
        {
            //Extract userId from the token and assign it to the memberParams so that we can exclude the current user from the list of members returned by the API.
            memberParams.CurrentMemberId = User.GetMemberId();

            return Ok(await uow.MemberRepository.GetMembersAsync(memberParams));
        }


        [Authorize]
        [HttpGet("getmember/{id}")]
        public async Task<ActionResult<Member>> GetMember(string id)
        {
            var member = await memberRespository.GetMemberByIdAsync(id);

            if(member == null)
            {
                return NotFound("No matching member found.");
            }

            return Ok(member);
        }

        [Authorize]
        [HttpGet("getmember/{id}/photos")]
        public async Task<ActionResult<IReadOnlyList<Photo>>> GetMemberPhotos(string id)
        {
            var isCurrentUser = User.GetMemberId() == id;
            return Ok(await uow.MemberRepository.GetPhotosForMemberAsync(id, isCurrentUser));
        }
    }
}
