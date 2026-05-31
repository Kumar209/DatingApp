using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class AdminRepository(UserManager<AppUser> userManager, AppDbContext context) : IAdminRepository
    {
        public async Task<PaginatedResult<ManagedUserDto>> GetUsersAsync(ManagedUserParams managedUserParams)
        {
            IQueryable<AppUser> query;

            // If role is provided, fetch only users in that role
            if (!string.IsNullOrEmpty(managedUserParams.Role))
            {
                // UserManager.GetUsersInRoleAsync returns a List, not IQueryable
                // So we need to query directly from context if we want SQL-side filtering
                query = from user in userManager.Users
                        join userRole in context.UserRoles on user.Id equals userRole.UserId
                        join role in context.Roles on userRole.RoleId equals role.Id
                        where role.Name == managedUserParams.Role
                        select user;
            }
            else
            {
                query = userManager.Users;
            }

            // Apply ordering in SQL
            query = managedUserParams.OrderBy switch
            {
                "createdAsc" => query.OrderBy(u => u.Created),
                "createdDesc" => query.OrderByDescending(u => u.Created),
                "nameAsc" => query.OrderBy(u => u.DisplayName),
                "nameDesc" => query.OrderByDescending(u => u.DisplayName),
                _ => query.OrderByDescending(u => u.DisplayName)
            };

            // Paginate AppUser query
            var pagedUsers = await PaginationHelper.CreateAsync(
                query,
                managedUserParams.PageNumber,
                managedUserParams.PageSize
            );

            // Build DTOs with roles
            var userDtos = new List<ManagedUserDto>();
            foreach (var user in pagedUsers.Items)
            {
                var roles = await userManager.GetRolesAsync(user);
                userDtos.Add(new ManagedUserDto
                {
                    Id = user.Id,
                    DisplayName = user.DisplayName,
                    Email = user.Email,
                    ImageUrl = user.ImageUrl,
                    Roles = roles.ToList()
                });
            }

            return new PaginatedResult<ManagedUserDto>
            {
                Metadata = pagedUsers.Metadata,
                Items = userDtos
            };
        }

    }
}
