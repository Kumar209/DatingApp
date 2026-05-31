using API.DTOs;
using API.Helpers;

namespace API.Interfaces
{
    public interface IAdminRepository
    {
        Task<PaginatedResult<ManagedUserDto>> GetUsersAsync(ManagedUserParams managedUserParams);
    }
}
