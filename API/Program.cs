using API.Data;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using API.Middleware;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
/*builder.Services.AddOpenApi();*/

//Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Register ASP.NET Identity core services for AppUser
// This gives us UserManager<AppUser>, password hashing, validation, etc.
builder.Services.AddIdentityCore<AppUser>(options =>
{
    // Allow simple passwords without special characters
    // Example: "test1234" instead of requiring "test@123"
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 4;
})
// Tell Identity to store users in our SQL database using AppDbContext
// Without this, UserManager won't know where to save/load users
.AddEntityFrameworkStores<AppDbContext>()
// Register SignInManager service
// Used for login-related operations like password sign-in checks
.AddSignInManager<SignInManager<AppUser>>();

builder.Services.AddCors();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddScoped<IPhotoRepository, PhotoRepository>();
builder.Services.AddScoped<IMemberRepository, MemberRepository>();
builder.Services.AddScoped<LogUserActivity>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.Configure<CloudinarySettings>(builder.Configuration
    .GetSection("CloudinarySettings"));

builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(
                builder.Configuration["TokenKey"] ?? throw new Exception("TokenKey is missing in configuration"))
            ),
            ClockSkew = TimeSpan.Zero
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    /*app.MapOpenApi();*/

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseDeveloperExceptionPage();
}

app.UseDeveloperExceptionPage();

app.UseMiddleware<ExceptionMiddleware>();

app.UseCors(
    x => x.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithOrigins("http://localhost:4200", "https://localhost:4200")
);

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();


// Create a temporary dependency injection scope
// Needed because scoped services (like DbContext, UserManager)
// cannot be resolved directly from the root container safely.
using var scope = app.Services.CreateScope();

// Get the service provider for this temporary scope
var services = scope.ServiceProvider;
try
{
    // Resolve database context from DI container
    // Used for migrations and database operations
    var context = services.GetRequiredService<AppDbContext>();

    // Resolve ASP.NET Identity UserManager
    // Used for creating/seeding users
    var userManager = services.GetRequiredService<UserManager<AppUser>>();

    // Apply any pending EF Core migrations automatically
    // Ensures database schema matches current entity models
    await context.Database.MigrateAsync();

    // Clear existing connection records
    // Useful when restarting app so stale SignalR/presence connections are removed
    //await context.Connections.ExecuteDeleteAsync();

    // Seed initial users into database if not already present
    // Helpful for development/testing/demo data
    await Seed.SeedUsers(userManager);

}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occured during migration");
}




app.Run();
