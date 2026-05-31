using System;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Primitives;

namespace API.SignalR;

/// <summary>
/// SignalR hub responsible for real-time messaging between users.
///
/// Responsibilities:
/// - Create/join conversation groups.
/// - Load existing message threads.
/// - Send real-time messages.
/// - Mark messages as read when recipient is viewing conversation.
/// - Send message notifications to online users.
///
/// Example:
///
/// User A opens chat with User B
///     -> Connection joins group "A-B"
///     -> Previous messages loaded
///
/// User A sends message
///     -> Message saved to DB
///     -> Message pushed instantly to User B
///
/// User B is online but not inside chat
///     -> Notification toast sent
///
/// User B is inside chat
///     -> Message automatically marked as read
/// </summary>
[Authorize]
public class MessageHub(IUnitOfWork uow, IHubContext<PresenceHub> presenceHub) : Hub
{
    /// <summary>
    /// Called automatically when a client connects to MessageHub.
    ///
    /// Example:
    /// User A opens:
    /// /members/UserB/messages
    ///
    /// Steps:
    /// 1. Determine conversation group name.
    /// 2. Add connection to SignalR group.
    /// 3. Persist connection in database.
    /// 4. Load conversation history.
    /// 5. Send message thread to connected clients.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        // Retrieve user id from query string.
        // Example:
        // ?userId=recipient-id
        var httpContext = Context.GetHttpContext();
        var otherUser = httpContext?.Request?.Query["userId"].ToString()
            ?? throw new HubException("Other user not found");

        // Generate unique conversation group.
        // Example:
        // UserA + UserB -> UserA-UserB
        var groupName = GetGroupName(GetUserId(), otherUser);

        // Add current SignalR connection to group.
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        // Save connection inside database group.
        await AddToGroup(groupName);

        // Load previous conversation history.
        var messages = await uow.MessageRepository.GetMessageThread(GetUserId(), otherUser);

        // Send entire message thread to group.
        await Clients.Group(groupName).SendAsync("ReceiveMessageThread", messages);
    }

    /// <summary>
    /// Sends a new message.
    ///
    /// Flow:
    ///
    /// User A
    ///     -> SendMessage()
    ///     -> Save message
    ///     -> Broadcast to conversation group
    ///
    /// If User B is online:
    ///     -> Notification toast sent
    ///
    /// If User B is currently viewing chat:
    ///     -> Message automatically marked as read
    /// </summary>
    public async Task SendMessage(CreateMessageDto createMessageDto)
    {
        var sender = await uow.MemberRepository.GetMemberByIdAsync(GetUserId());
        var recipient = await uow.MemberRepository.GetMemberByIdAsync(createMessageDto.RecipientId);

        if (recipient == null || sender == null || sender.Id == createMessageDto.RecipientId)
            throw new HubException("Cannot send message");

        var message = new Message
        {
            SenderId = sender.Id,
            RecipientId = recipient.Id,
            Content = createMessageDto.Content
        };

        var groupName = GetGroupName(sender.Id, recipient.Id);
        var group = await uow.MessageRepository.GetMessageGroup(groupName);


        // Determine whether recipient is actively
        // viewing this conversation.
        var userInGroup = group != null && group.Connections.Any(x =>
             x.UserId == message.RecipientId);

        // Auto mark as read if recipient is inside chat.
        if (userInGroup)
        {
            message.DateRead = DateTime.UtcNow;
        }

        // Add message to repository.
        uow.MessageRepository.AddMessage(message);

        if (await uow.Complete())
        {
            // Send new message instantly to all clients viewing this conversation.
            await Clients.Group(groupName).SendAsync("NewMessage", message.ToDto());

            // Get all active SignalR connection belonging to recipient.
            var connections = await PresenceTracker.GetConnectionsForUser(recipient.Id);

            // Recipient online but not currently viewing this chat.
            if (connections != null && connections.Count > 0 && !userInGroup)
            {
                await presenceHub.Clients.Clients(connections)
                    .SendAsync("NewMessageReceived", message.ToDto());
            }
        }
    }


    /// <summary>
    /// Called automatically when client disconnects.
    ///
    /// Example:
    /// - User closes browser tab.
    /// - User navigates away from chat.
    /// - Internet connection lost.
    ///
    /// Removes SignalR connection from group.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await uow.MessageRepository.RemoveConnection(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Adds current SignalR connection to a conversation group.
    ///
    /// Database representation:
    ///
    /// Group
    ///     UserA-UserB
    ///
    /// Connections
    ///     conn-123
    ///     conn-456
    ///
    /// This allows tracking which users are actively
    /// viewing a conversation.
    /// </summary>
    private async Task<bool> AddToGroup(string groupName)
    {
        var group = await uow.MessageRepository.GetMessageGroup(groupName);
        var connection = new Connection(Context.ConnectionId, GetUserId());

        // Create group if first conversation connection.
        if (group == null)
        {
            group = new Group(groupName);
            uow.MessageRepository.AddGroup(group);
        }

        // Add current connection.
        group.Connections.Add(connection);

        return await uow.Complete();
    }

    /// <summary>
    /// Generates a consistent conversation group name.
    ///
    /// Example:
    ///
    /// UserA + UserB
    /// => UserA-UserB
    ///
    /// UserB + UserA
    /// => UserA-UserB
    ///
    /// This guarantees both users always join
    /// the exact same SignalR group.
    /// </summary>
    private static string GetGroupName(string? caller, string? other)
    {
        var stringCompare = string.CompareOrdinal(caller, other) < 0;
        return stringCompare ? $"{caller}-{other}" : $"{other}-{caller}";
    }

    /// <summary>
    /// Extract authenticated user's Member Id
    /// from JWT claims.
    ///
    /// Used throughout the hub whenever the
    /// current user identity is required.
    /// </summary>
    private string GetUserId()
    {
        return Context.User?.GetMemberId()
            ?? throw new HubException("Cannot get member id");
    }
}