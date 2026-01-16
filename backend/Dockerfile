# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore
COPY ["src/TwinkForSale.Api/TwinkForSale.Api.csproj", "src/TwinkForSale.Api/"]
RUN dotnet restore "src/TwinkForSale.Api/TwinkForSale.Api.csproj"

# Copy everything else and publish
COPY . .
RUN dotnet publish "src/TwinkForSale.Api/TwinkForSale.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "TwinkForSale.Api.dll"]
