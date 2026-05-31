namespace API.DTOs
{
    public class ManagedUserDto
    {
        public string Id { get; set; } = default!;
        public string DisplayName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? ImageUrl { get; set; }
        public List<string> Roles { get; set; } = new();
    }
}
