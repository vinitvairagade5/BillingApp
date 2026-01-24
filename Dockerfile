# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["BillingApp.API/BillingApp.API.csproj", "BillingApp.API/"]
RUN dotnet restore "BillingApp.API/BillingApp.API.csproj"
COPY . .
WORKDIR "/src/BillingApp.API"
RUN dotnet build "BillingApp.API.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "BillingApp.API.csproj" -c Release -o /app/publish

# Final Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
# Install native dependencies required by SkiaSharp (QuestPDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=publish /app/publish .
# Export Port 8080 (Common for cloud hosts)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "BillingApp.API.dll"]
