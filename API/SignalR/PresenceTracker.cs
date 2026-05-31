using System;
using System.Collections.Concurrent;

namespace API.SignalR;

/// <summary>
/// Tracks currently online users and their active SignalR connections.
///
/// Why do we need this?
/// --------------------
/// A single user can have multiple active SignalR connections:
///
/// - Multiple browser tabs
/// - Multiple browser windows
/// - Mobile + desktop simultaneously
/// - Multiple devices
///
/// Therefore we cannot simply track "UserId -> Online".
/// We must track all connection ids associated with a user.
///
/// Structure:
/// ----------
/// OnlineUsers
/// ├── user-1
/// │   ├── connection-1
/// │   └── connection-2
/// │
/// ├── user-2
/// │   └── connection-3
/// │
/// └── user-3
///     ├── connection-4
///     ├── connection-5
///     └── connection-6
///
/// ConcurrentDictionary is used because SignalR hubs are highly concurrent
/// and multiple users may connect/disconnect simultaneously.
/// </summary>
public class PresenceTracker
{
    /// <summary>
    /// Stores all currently online users and their active connection ids.
    ///
    /// Key   = UserId
    /// Value = Dictionary of connection ids belonging to that user
    ///
    /// Example:
    /// {
    ///     "user1" : ["conn1", "conn2"],
    ///     "user2" : ["conn3"]
    /// }
    /// </summary>
    private static readonly ConcurrentDictionary<string,
        ConcurrentDictionary<string, byte>> OnlineUsers = new();


    /// <summary>
    /// Registers a newly connected SignalR client.
    ///
    /// If the user does not already exist in the tracker,
    /// a new connection collection is created.
    ///
    /// If the user already exists (multiple tabs/devices),
    /// the connection id is added to the existing collection.
    /// </summary>
    /// <param name="userId">
    /// Authenticated user id.
    /// </param>
    /// <param name="connectionId">
    /// SignalR connection id.
    /// </param>
    public Task UserConnected(string userId, string connectionId)
    {
        // Get existing connection collection for this user
        // or create a new one if it doesn't exist.
        var connections = OnlineUsers.GetOrAdd(userId, _ =>
            new ConcurrentDictionary<string, byte>());

        // Add the new connection id.
        connections.TryAdd(connectionId, 0);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Removes a disconnected SignalR connection.
    ///
    /// If this was the user's last active connection,
    /// the user is removed completely from the online users list.
    /// </summary>
    /// <param name="userId">
    /// Authenticated user id.
    /// </param>
    /// <param name="connectionId">
    /// SignalR connection id being disconnected.
    /// </param>
    public Task UserDisconnected(string userId, string connectionId)
    {
        if (OnlineUsers.TryGetValue(userId, out var connections))
        {
            // Remove this specific connection.
            connections.TryRemove(connectionId, out _);

            // If no connections remain, the user is fully offline.
            if (connections.IsEmpty)
            {
                OnlineUsers.TryRemove(userId, out _);
            }
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Returns a sorted list of currently online user ids.
    ///
    /// Used when broadcasting the online users list
    /// to all connected clients.
    /// </summary>
    /// <returns>
    /// Array of online user ids.
    /// </returns>
    public Task<string[]> GetOnlineUsers()
    {
        return Task.FromResult(OnlineUsers.Keys.OrderBy(k => k).ToArray());
    }

    /// <summary>
    /// Retrieves all active SignalR connection ids
    /// belonging to a specific user.
    ///
    /// Useful when sending targeted notifications
    /// to all devices/tabs owned by a user.
    ///
    /// Example:
    /// User opens 3 tabs.
    ///
    /// Returns:
    /// [
    ///   "conn1",
    ///   "conn2",
    ///   "conn3"
    /// ]
    /// </summary>
    /// <param name="userId">
    /// User whose connections should be retrieved.
    /// </param>
    /// <returns>
    /// List of SignalR connection ids.
    /// Empty list if user is offline.
    /// </returns>
    public static Task<List<string>> GetConnectionsForUser(string userId)
    {
        if (OnlineUsers.TryGetValue(userId, out var connections))
        {
            return Task.FromResult(connections.Keys.ToList());
        }

        return Task.FromResult(new List<string>());
    }
}