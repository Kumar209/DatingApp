using API.Entities;
using API.Helpers;

namespace API.Interfacess
{
    public interface IMemberRepository
    {
        void Update(Member memeber);
        Task<bool> SaveAllAsync();
        Task<PaginatedResult<Member>> GetMembersAsync(MemberParams memberParams);
        Task<Member?> GetMemberByIdAsync(string id);
        Task<IReadOnlyList<Photo>> GetPhotosForMemberAsync(string memberId, bool isCurrentUser);
    }
}
