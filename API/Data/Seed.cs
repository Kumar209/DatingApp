using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace API.Data
{
    public class Seed
    {
        public static async Task SeedUsers(UserManager<AppUser> userManager)
        {
            if (await userManager.Users.AnyAsync()) return;

            var memberData = await File.ReadAllTextAsync("Data/UserSeedData.json");
            var members = JsonSerializer.Deserialize<List<SeedUserDto>>(memberData);

            if (members == null)
            {
                Console.WriteLine("No members in seed data.");
                return;
            }

            foreach (var member in members)
            {
                var user = new AppUser
                {
                    Id = member.Id,
                    Email = member.Email,
                    UserName = member.Email,
                    DisplayName = member.DisplayName,
                    ImageUrl = member.ImageUrl,
                    Member = new Member
                    {
                        Id = member.Id,
                        DisplayName = member.DisplayName,
                        Description = member.Description,
                        DateOfBirth = member.DateOfBirth,
                        ImageUrl = member.ImageUrl,
                        Gender = member.Gender,
                        City = member.City,
                        Country = member.Country,
                        LastActive = member.LastActive,
                        Created = member.Created
                    }
                };

                user.Member.Photos.Add(new Photo
                {
                    Url = member.ImageUrl!,
                    IsApproved = true,
                    MemberId = member.Id,
                    Created = DateTime.UtcNow
                });

                //This line saves data to the database, and it also hashes the password and saves the hash and salt to the database as well.
                var result = await userManager.CreateAsync(user, "Pa$$w0rd");
                if (!result.Succeeded)
                {
                    Console.WriteLine(result.Errors.First().Description);
                }


                await userManager.AddToRoleAsync(user, "Member");

            }

            var admin = new AppUser
            {
                UserName = "crimsondeveloper@gmail.com",
                Email = "crimsondeveloper@gmail.com",
                DisplayName = "Crimson Admin",
                ImageUrl = "https://randomuser.me/api/portraits/women/53.jpg",
            };

            var res = await userManager.CreateAsync(admin, "Crimson@123");

            if (res.Succeeded)
            {
                admin.Member = new Member
                {
                    Id = admin.Id, // now populated
                    DisplayName = "Crimson Admin",
                    Description = "Crimson Admin",
                    DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-30)),
                    ImageUrl = "https://randomuser.me/api/portraits/women/53.jpg",
                    Gender = "Male",
                    City = "Admin City",
                    Country = "Admin Country",
                    LastActive = DateTime.UtcNow,
                    Created = DateTime.UtcNow
                };

                admin.Member.Photos.Add(new Photo
                {
                    Url = "https://randomuser.me/api/portraits/women/53.jpg",
                    IsApproved = true,
                    MemberId = admin.Id,
                    Created = DateTime.UtcNow
                });

                await userManager.UpdateAsync(admin);
                await userManager.AddToRolesAsync(admin, new[] { "Admin", "Moderator" });

            }
        }
    }
}
