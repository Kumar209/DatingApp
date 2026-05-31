using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace API.Data
{
    // IdentityDbContext<AppUser> gives us all ASP.NET Identity tables
    // (Users, Roles, Claims, UserRoles, Tokens, Logins, etc.)
    // and uses our custom AppUser class as the user entity.
    // This allows us to combine Identity tables with our own tables
    // (Messages, Likes, Photos, etc.) in a single database context.
    public class AppDbContext(DbContextOptions options) : IdentityDbContext<AppUser>(options)
    {
        // IdentityDbContext already provides AspNetUsers and other Identity tables,
        // so no need to create a separate DbSet<AppUser>.
        /* public DbSet<AppUser> Users { get; set; } */
        public DbSet<Member> Members { get; set; }
        public DbSet<Photo> Photos { get; set; }
        public DbSet<MemberLike> Likes { get; set; }

        public DbSet<Message> Messages { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<Connection> Connections { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Photo>().HasQueryFilter(x => x.IsApproved);

            // Create default roles (Member, Moderator, Admin)
            // automatically during database migration
            modelBuilder.Entity<IdentityRole>()
                .HasData(
                    new IdentityRole { Id = "member-id", Name = "Member", NormalizedName = "MEMBER" },
                    new IdentityRole { Id = "moderator-id", Name = "Moderator", NormalizedName = "MODERATOR" },
                    new IdentityRole { Id = "admin-id", Name = "Admin", NormalizedName = "ADMIN" }
                );

            // Configure MemberLike entity (join table for "likes" between members)
            modelBuilder.Entity<MemberLike>()
                // Define composite primary key
                // Means one record is uniquely identified by BOTH:
                // SourceMemberId + TargetMemberId
                // Prevents duplicate likes like:
                // (UserA -> UserB) being inserted twice
                .HasKey(x => new { x.SourceMemberId, x.TargetMemberId });


            // Configure relationship: SourceMember -> liked members
            modelBuilder.Entity<MemberLike>()
                // One MemberLike record has ONE source member
                // Example:
                // Prashant likes Sarah
                // SourceMember = Prashant
                .HasOne(s => s.SourceMember)
                // One source member can have MANY liked members
                // Example:
                // Prashant likes Sarah, Emma, Olivia
                // So LikedMembers collection contains multiple MemberLike rows
                .WithMany(t => t.LikedMembers)
                // Tell EF which property acts as foreign key
                // SourceMemberId points to the member who initiated the like
                .HasForeignKey(s => s.SourceMemberId)
                // Cascade delete behavior:
                // If source member is deleted,
                // automatically delete all their outgoing likes
                // Example:
                // Delete Prashant
                // Delete:
                // Prashant -> Sarah
                // Prashant -> Emma
                .OnDelete(DeleteBehavior.Cascade);

            // Configure relationship: TargetMember -> members who liked them
            modelBuilder.Entity<MemberLike>()
                // One MemberLike record has ONE target member
                // Example:
                // Prashant likes Sarah
                // TargetMember = Sarah
                .HasOne(s => s.TargetMember)
                // One target member can be liked by MANY source members
                // Example:
                // Sarah liked by:
                // Prashant
                // Alex
                // John
                .WithMany(t => t.LikedByMembers)
                // Tell EF which property acts as foreign key
                // TargetMemberId points to the member being liked
                .HasForeignKey(s => s.TargetMemberId)
                // NoAction delete behavior:
                // Prevent SQL Server cascade conflict
                // If target member is deleted,
                // EF won't automatically delete related likes here
                // Why?
                // Because SourceMember relationship already has cascade delete.
                // SQL Server doesn't allow multiple cascade paths
                .OnDelete(DeleteBehavior.NoAction);

            // Configure relationship: Recipient -> messages received
            modelBuilder.Entity<Message>()
                // One Message has ONE recipient
                // Example:
                // Prashant sends message to Sarah
                // Recipient = Sarah
                .HasOne(x => x.Recipient)

                // One recipient member can receive MANY messages
                // Example:
                // Sarah received messages from:
                // Prashant
                // Alex
                // John
                .WithMany(m => m.MessagesReceived)

                // Restrict delete behavior:
                // Prevent automatic deletion of messages
                // if recipient member gets deleted
                // Why?
                // To avoid multiple cascade path issues in SQL Server
                // and preserve message history safely
                .OnDelete(DeleteBehavior.Restrict);


            // Configure relationship: Sender -> messages sent
            modelBuilder.Entity<Message>()
                // One Message has ONE sender
                // Example:
                // Prashant sends message to Sarah
                // Sender = Prashant
                .HasOne(x => x.Sender)

                // One sender member can send MANY messages
                // Example:
                // Prashant sent messages to:
                // Sarah
                // Emma
                // Alex
                .WithMany(m => m.MessagesSent)

                // Restrict delete behavior:
                // Prevent automatic deletion of messages
                // if sender member gets deleted
                // Why?
                // To avoid SQL Server cascade conflicts
                // and keep conversation records safe
                .OnDelete(DeleteBehavior.Restrict);


            var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
            );

            var nullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
                v => v.HasValue ? v.Value.ToUniversalTime() : null,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : null
            );

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(dateTimeConverter);
                    }
                    else if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(nullableDateTimeConverter);
                    }
                }
            }
        }
    }
}
