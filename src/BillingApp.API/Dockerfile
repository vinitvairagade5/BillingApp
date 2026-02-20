# Final Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0

# Install native dependencies required by SkiaSharp (QuestPDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the pre-built publish output
# GitHub Actions will build this into src/publish
COPY publish/ .

# Export Port 8080 (Common for cloud hosts)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BillingApp.API.dll"]
