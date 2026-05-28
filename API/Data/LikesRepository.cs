using System;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class LikesRepository(AppDbContext context) : ILikesRepository
{
    // Add a new like relationship to EF change tracker
    // Example:
    // Prashant likes Sarah
    //
    // Note:
    // This only stages the insert in memory.
    // Actual database save happens when UnitOfWork.Complete() calls SaveChanges().
    public void AddLike(MemberLike like)
    {
        context.Likes.Add(like);
    }

    // Remove an existing like relationship
    // Example:
    // Prashant unlikes Sarah
    public void DeleteLike(MemberLike like)
    {
        context.Likes.Remove(like);
    }

    // Get IDs of all members liked by the current member
    //
    // Example:
    // If Prashant liked:
    // Sarah
    // Emma
    // Olivia
    //
    // Returns:
    // ["SarahId", "EmmaId", "OliviaId"]
    //
    // Useful for:
    // - checking mutual likes
    // - filtering members already liked
    public async Task<IReadOnlyList<string>> GetCurrentMemberLikeIds(string memberId)
    {
        return await context.Likes
            .Where(x => x.SourceMemberId == memberId)
            .Select(x => x.TargetMemberId)
            .ToListAsync();
    }

    // Find a specific like relationship between two members
    //
    // Example:
    // "Did Prashant already like Sarah?"
    //
    // Returns:
    // MemberLike object if exists
    // null if not found
    //
    // Uses FindAsync because MemberLike has composite primary key:
    // (SourceMemberId + TargetMemberId)
    public async Task<MemberLike?> GetMemberLike(string sourceMemberId, string targetMemberId)
    {
        return await context.Likes.FindAsync(sourceMemberId, targetMemberId);
    }


    // Get paginated member list based on like relationship type
    //
    // Supported predicates:
    // "liked"   -> members current user liked
    // "likedBy" -> members who liked current user
    // "mutual"  -> members who liked current user AND current user liked them back
    //
    // Returns paginated member results for UI listing
    public async Task<PaginatedResult<Member>> GetMemberLikes(LikesParams likesParams)
    {
        var query = context.Likes.AsQueryable();
        IQueryable<Member> result;

        // Predicate tells us WHAT kind of like relationship to fetch
        //
        // Think of it as a filter mode for the query.
        //
        // Possible values:
        // "liked"   -> members current user liked
        // "likedBy" -> members who liked current user
        // "mutual"  -> members who liked current user AND current user liked them back
        //
        // Example:
        // Current user = Prashant
        //
        // "liked"
        // Returns people Prashant liked
        //
        // "likedBy"
        // Returns people who liked Prashant
        //
        // "mutual"
        // Returns only matches where both liked each other
        switch (likesParams.Predicate)
        {
            case "liked":
                result = query
                    .Where(like => like.SourceMemberId == likesParams.MemberId)
                    .Select(like => like.TargetMember);
                break;
            case "likedBy":
                result = query
                    .Where(like => like.TargetMemberId == likesParams.MemberId)
                    .Select(like => like.SourceMember);
                break;
            default: // mutual
                var likeIds = await GetCurrentMemberLikeIds(likesParams.MemberId);

                // Find members who:
                // 1. liked current user
                // 2. are also in current user's liked list
                //
                // Example:
                // Sarah liked Prashant
                // and Prashant liked Sarah
                //
                // Returns:
                // Sarah
                result = query
                    .Where(x => x.TargetMemberId == likesParams.MemberId
                        && likeIds.Contains(x.SourceMemberId))
                    .Select(x => x.SourceMember);
                break;
        }

        return await PaginationHelper.CreateAsync(result,
            likesParams.PageNumber, likesParams.PageSize);
    }
}