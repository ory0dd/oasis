# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["Oasis.Backend.csproj", "./"]
RUN dotnet restore "Oasis.Backend.csproj"
COPY . .
RUN dotnet publish "Oasis.Backend.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5046
EXPOSE 5046
ENTRYPOINT ["dotnet", "Oasis.Backend.dll"]
