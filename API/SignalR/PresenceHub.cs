using API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR;

/// <summary>
/// SignalR hub responsible for tracking users' online/offline presence.
///
/// Every authenticated user that opens the application establishes a SignalR
/// connection to this hub. The hub keeps track of active connections and
/// notifies connected clients when users come online or go offline.
///
/// Example:
/// - User A logs in → UserOnline event is sent.
/// - User A closes browser → UserOffline event is sent.
/// - All clients receive an updated online users list.
/// </summary>
[Authorize]
public class PresenceHub(PresenceTracker presenceTracker) : Hub
{
    /// <summary>
    /// Called automatically by SignalR whenever a client successfully
    /// establishes a connection to the hub.
    ///
    /// Responsibilities:
    /// 1. Register the user as online.
    /// 2. Notify other users that this user is online.
    /// 3. Broadcast the updated online users list.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        // Add this connection to the presence tracker.
        // A single user may have multiple connections
        // (multiple tabs, devices, browsers, etc.).
        await presenceTracker.UserConnected(GetUserId(), Context.ConnectionId);
        // Notify all OTHER connected clients that this user came online.
        await Clients.Others.SendAsync("UserOnline", GetUserId());

        // Retrieve the current list of online users.
        var currentUsers = await presenceTracker.GetOnlineUsers();
        // Broadcast the updated online users list to everyone.
        await Clients.All.SendAsync("GetOnlineUsers", currentUsers);
    }

    /// <summary>
    /// Called automatically by SignalR whenever a client disconnects.
    ///
    /// This can happen when:
    /// - Browser tab closes
    /// - User loses internet connection
    /// - User logs out
    /// - SignalR connection is terminated
    ///
    /// Responsibilities:
    /// 1. Remove the connection from tracking.
    /// 2. Notify others that the user went offline.
    /// 3. Broadcast the updated online users list.
    /// </summary>
    /// <param name="exception">
    /// Exception that caused the disconnect, if any.
    /// </param>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Remove this connection from the tracker.
        await presenceTracker.UserDisconnected(GetUserId(), Context.ConnectionId);
        // Notify all OTHER users that this user is now offline.
        await Clients.Others.SendAsync("UserOffline", GetUserId());

        // Get the updated list of online users.
        var currentUsers = await presenceTracker.GetOnlineUsers();
        // Broadcast the updated online users list.
        await Clients.All.SendAsync("GetOnlineUsers", currentUsers);

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Extracts the authenticated user's Member Id from the JWT claims.
    ///
    /// This helper is used throughout the hub whenever we need to identify
    /// the currently connected user.
    ///
    /// Throws a HubException if the claim is missing because PresenceHub
    /// requires an authenticated user.
    /// </summary>
    /// <returns>The current authenticated user's id.</returns>
    /// <exception cref="HubException">
    /// Thrown when the user id cannot be extracted from claims.
    /// </exception>
    private string GetUserId()
    {
        return Context.User?.GetMemberId()
            ?? throw new HubException("Cannot get member id");
    }
}