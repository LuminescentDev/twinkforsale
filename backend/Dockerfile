# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["src/TwinkForSale.Api/TwinkForSale.Api.csproj", "src/TwinkForSale.Api/"]

# Restore dependencies
RUN dotnet restore "src/TwinkForSale.Api/TwinkForSale.Api.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
RUN dotnet build "src/TwinkForSale.Api/TwinkForSale.Api.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "src/TwinkForSale.Api/TwinkForSale.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install libgdiplus for ImageSharp
RUN apt-get update && apt-get install -y libgdiplus && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=publish /app/publish .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD dotnet-health-check || exit 1

# Set environment
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "TwinkForSale.Api.dll"]
