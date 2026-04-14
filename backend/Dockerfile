# Backend Dockerfile — multi-stage build

# Stage 1: SDK build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["PortailMediatheque.Api.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Create /data directory for the SQLite Docker volume mount point
# Without this, Docker auto-creates it as root which can cause permission issues
RUN mkdir -p /data

COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "PortailMediatheque.Api.dll"]
