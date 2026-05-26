using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class MembersController(IMemberRepository memberRespository, IUnitOfWork uow, IPhotoService photoService) : BaseApiController
    {
        [HttpGet("getmembers")]
        public async Task<ActionResult<IReadOnlyList<Member>>> GetMembers([FromQuery] MemberParams memberParams)
        {
            //Extract userId from the token and assign it to the memberParams so that we can exclude the current user from the list of members returned by the API.
            memberParams.CurrentMemberId = User.GetMemberId();

            return Ok(await uow.MemberRepository.GetMembersAsync(memberParams));
        }


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

        [HttpGet("getmember/{id}/photos")]
        public async Task<ActionResult<IReadOnlyList<Photo>>> GetMemberPhotos(string id)
        {
            var isCurrentUser = User.GetMemberId() == id;
            return Ok(await uow.MemberRepository.GetPhotosForMemberAsync(id, isCurrentUser));
        }
        
        [HttpPut("update-member")]
        public async Task<ActionResult> UpdateMember(MemberUpdateDto memberUpdateDto)
        {
            var memberId = User.GetMemberId();

            var member = await uow.MemberRepository.GetMemberForUpdate(memberId);

            if (member == null) return BadRequest("Could not get member");

            member.DisplayName = memberUpdateDto.DisplayName ?? member.DisplayName;
            member.Description = memberUpdateDto.Description ?? member.Description;
            member.City = memberUpdateDto.City ?? member.City;
            member.Country = memberUpdateDto.Country ?? member.Country;

            member.User.DisplayName = memberUpdateDto.DisplayName ?? member.User.DisplayName;

            uow.MemberRepository.Update(member); // optional

            if (await uow.Complete()) return NoContent();

            return BadRequest("Failed to update member");
        }

        [HttpPost("add-photo")]
        public async Task<ActionResult<Photo>> AddPhoto([FromForm] PhotoUploadDto dto)
        {
            var member = await uow.MemberRepository.GetMemberForUpdate(User.GetMemberId());

            if (member == null) return BadRequest("Cannot update member");

            var result = await photoService.UploadPhotoAsync(dto.File);

            if (result.Error != null) return BadRequest(result.Error.Message);

            var photo = new Photo
            {
                Url = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId,
                MemberId = User.GetMemberId(),
                IsApproved = true
            };

            if (member.ImageUrl == null)
            {
                member.ImageUrl = photo.Url;
                member.User.ImageUrl = photo.Url;
            }

            member.Photos.Add(photo);

            if (await uow.Complete()) return photo;

            return BadRequest("Problem adding photo");
        }

        [HttpPut("set-main-photo/{photoId}")]
        public async Task<ActionResult> SetMainPhoto(int photoId)
        {
            var member = await uow.MemberRepository.GetMemberForUpdate(User.GetMemberId());

            if (member == null) return BadRequest("Cannot get member from token");

            var photo = member.Photos.SingleOrDefault(x => x.Id == photoId);

            if (member.ImageUrl == photo?.Url || photo == null)
            {
                return BadRequest("Cannot set this as main image");
            }

            member.ImageUrl = photo.Url;
            member.User.ImageUrl = photo.Url;

            if (await uow.Complete()) return NoContent();

            return BadRequest("Problem setting main photo");
        }

        [HttpDelete("delete-photo/{photoId}")]
        public async Task<ActionResult> DeletePhoto(int photoId)
        {
            var member = await uow.MemberRepository.GetMemberForUpdate(User.GetMemberId());

            if (member == null) return BadRequest("Cannot get member from token");

            var photo = member.Photos.SingleOrDefault(x => x.Id == photoId);

            if (photo == null || photo.Url == member.ImageUrl)
            {
                return BadRequest("Photo cannot be deleted due to main image");
            }

            if (photo.PublicId != null)
            {
                var result = await photoService.DeletePhotoAsync(photo.PublicId);
                if (result.Error != null) return BadRequest(result.Error.Message);
            }

            member.Photos.Remove(photo);

            if (await uow.Complete()) return Ok();

            return BadRequest("Problem deleting the photo");
        }
    }
}
