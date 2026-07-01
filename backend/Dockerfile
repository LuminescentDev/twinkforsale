FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY TwinkForSale.Api/TwinkForSale.Api.csproj TwinkForSale.Api/
RUN dotnet restore TwinkForSale.Api/TwinkForSale.Api.csproj

COPY TwinkForSale.Api TwinkForSale.Api
RUN dotnet publish TwinkForSale.Api/TwinkForSale.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runner

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

EXPOSE 5000

ENTRYPOINT ["dotnet", "TwinkForSale.Api.dll"]
