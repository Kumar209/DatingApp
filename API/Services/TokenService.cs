using API.Entities;
using API.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

namespace API.Services
{
    public class TokenService(IConfiguration config, UserManager<AppUser> userManager) : ITokenService   
    {

        public async Task<string> CreateToken(AppUser user)
        {
            var tokenkey = config["TokenKey"] ?? throw new Exception("TokenKey is missing in configuration");

            if (tokenkey?.Length < 64)
            {
                throw new Exception("TokenKey must be at least 64 characters long");
            }

            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(tokenkey));

            var claims = new List<Claim>
            {
                new (ClaimTypes.Email, user.Email),
                new (ClaimTypes.NameIdentifier, user.Id)
            };

            var roles = await userManager.GetRolesAsync(user);

            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor); 
            
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(randomBytes);
        }
    }
}
