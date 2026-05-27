using Microsoft.AspNetCore.Identity;

namespace API.Entities
{
    public class AppUser : IdentityUser
    {
        public required string DisplayName { get; set; }
        public string? ImageUrl { get; set; }
/*        public required byte[] PasswordHash { get; set; }
        public required byte[] PasswordSalt { get; set; }*/
/*
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }*/


        // Nav property
        public Member Member { get; set; } = null!;
    }
}
