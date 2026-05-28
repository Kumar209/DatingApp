using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class MessageRepository(AppDbContext context) : IMessageRepository
{
    // Group is usually created when two users open a chat connection
    public void AddGroup(Group group)
    {
        context.Groups.Add(group);
    }

    public void AddMessage(Message message)
    {
        context.Messages.Add(message);
    }

    public void DeleteMessage(Message message)
    {
        context.Messages.Remove(message);
    }

    // Get connection using connection id
    // Connection represents active SignalR/WebSocket connection
    // Example:
    // Find currently connected browser/tab/user connection
    public async Task<Connection?> GetConnection(string connectionId)
    {
        return await context.Connections.FindAsync(connectionId);
    }

    // Get group that contains a specific connection
    // Also include all connections inside that group
    // Example:
    // Find which chat room current connection belongs to
    public async Task<Group?> GetGroupForConnection(string connectionId)
    {
        return await context.Groups
            .Include(x => x.Connections)
            .Where(x => x.Connections.Any(c => c.ConnectionId == connectionId))
            .FirstOrDefaultAsync();
    }

    // Get single message using message id
    // Example:
    // Find specific message for edit/delete/details
    public async Task<Message?> GetMessage(string messageId)
    {
        return await context.Messages.FindAsync(messageId);
    }

    // Get chat group using group name
    // Also load all active connections in that group
    // Example:
    // Get conversation room between two users
    public async Task<Group?> GetMessageGroup(string groupName)
    {
        return await context.Groups
            .Include(x => x.Connections)
            .FirstOrDefaultAsync(x => x.Name == groupName);
    }

    // Get paginated messages for current member
    // Supports Inbox and Outbox filtering
    // Inbox:
    // Messages received by current user
    // Outbox:
    // Messages sent by current user
    public async Task<PaginatedResult<MessageDto>> GetMessagesForMember(MessageParams
        messageParams)
    {
        var query = context.Messages
            .OrderByDescending(x => x.MessageSent)
            .AsQueryable();

        query = messageParams.Container switch
        {
            "Outbox" => query.Where(x => x.SenderId == messageParams.MemberId
                && x.SenderDeleted == false),
            _ => query.Where(x => x.RecipientId == messageParams.MemberId
                && x.RecipientDeleted == false)
        };

        var messageQuery = query.Select(MessageExtensions.ToDtoProjection());

        return await PaginationHelper.CreateAsync(messageQuery, messageParams.PageNumber,
            messageParams.PageSize);
    }

    // Get full conversation thread between two members
    // Also automatically mark unread received messages as read
    // Example:
    // Current user opens Sarah chat
    // All unread messages from Sarah become "read"
    public async Task<IReadOnlyList<MessageDto>> GetMessageThread(string currentMemberId, string recipientId)
    {
        await context.Messages
            .Where(x => x.RecipientId == currentMemberId
                && x.SenderId == recipientId && x.DateRead == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.DateRead, DateTime.UtcNow));

        return await context.Messages
            .Where(x => (x.RecipientId == currentMemberId && x.RecipientDeleted == false
                && x.SenderId == recipientId)
                || (x.SenderId == currentMemberId
                && x.SenderDeleted == false && x.RecipientId == recipientId))
            .OrderBy(x => x.MessageSent)
            .Select(MessageExtensions.ToDtoProjection())
            .ToListAsync();
    }

    // Remove disconnected SignalR connection from database
    // Example:
    // User closes browser/tab or loses connection
    public async Task RemoveConnection(string connectionId)
    {
        await context.Connections
            .Where(x => x.ConnectionId == connectionId)
            .ExecuteDeleteAsync();
    }
}