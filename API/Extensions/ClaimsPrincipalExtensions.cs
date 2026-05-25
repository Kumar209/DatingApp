using System;
using System.Security.Claims;

namespace API.Extensions;

public static class ClaimsPrincipalExtensions
{
    /*
     * ClaimsPrincipal extension helpers.
     *
     * ASP.NET automatically creates the User (ClaimsPrincipal) object
     * from the authenticated JWT token after app.UseAuthentication().
     *
     * This lets us easily read values stored in token claims
     * (like user id, email, roles) anywhere in authorized controllers.
     *
     * Example:
     * JWT contains NameIdentifier claim -> User.GetMemberId()
    */

    public static string GetMemberId(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new Exception("Cannot get memberId from token");
    }
}