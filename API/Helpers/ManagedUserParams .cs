namespace API.Helpers
{
    public class ManagedUserParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? OrderBy { get; set; } = "nameDesc"; // default
        public string? Role { get; set; } // e.g. "Admin", "Member", "Moderator"
    }
}
