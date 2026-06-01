using API.DTOs;
using API.Entities;

namespace API.Interfaces
{
    public interface IPhotoRepository
    {
        Task<IReadOnlyList<PhotoForApprovalDto>> GetUnapprovedPhotos();
        Task<Photo?> GetPhotoById(int id);
        Task<string?> GetMainPhotoByMemberId(string memberId);
        void RemovePhoto(Photo photo);
        Task<bool> IsMainPhotoApproved(string memberId, string imageUrl);

    }
}
