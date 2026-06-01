namespace API.DTOs
{
    public class PhotoForApprovalDto
    {
        public int Id { get; set; }
        public required string Url { get; set; }
        public required string UserId { get; set; }
        public bool IsApproved { get; set; }
        public required string DisplayName { get; set; }
        public DateTime PhotoCreated { get; set; }
        public DateTime? MemberLastActive { get; set; }
    }
}
