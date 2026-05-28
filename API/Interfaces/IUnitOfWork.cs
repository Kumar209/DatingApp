using API.Data;

namespace API.Interfaces
{
    // Coordinates all repositories using the same DbContext instance
    // so multiple related database changes can be committed together
    // in a single SaveChanges call (single unit of work / transaction boundary).
    public interface IUnitOfWork
    {
        IMemberRepository MemberRepository { get; }
        IMessageRepository MessageRepository { get; }
        ILikesRepository LikesRepository { get; }
        IPhotoRepository PhotoRepository { get; }
        Task<bool> Complete();
        bool HasChanges();
    }
}
