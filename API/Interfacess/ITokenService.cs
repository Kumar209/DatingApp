using API.Entities;

namespace API.Interfacess
{
    public interface ITokenService
    {
        string CreateToken(AppUser user);
    }
}
