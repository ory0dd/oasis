using Microsoft.AspNetCore.Mvc;
using Oasis.Backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Text.Json;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Text.RegularExpressions;
using YoutubeExplode;
using YoutubeExplode.Videos.Streams;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text.Json.Serialization;

namespace Oasis.Backend.Controllers
{
    [ApiController]
    [Route("api/oasis")]
    public class OasisController : ControllerBase
    {
        private readonly IConfiguration _config;
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(300) };

        private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, LLMPscyhologyAnalysis> _analysisCache = new();

        public OasisController(IConfiguration config)
        {
            _config = config;
        }

        private string GetAuthenticatedUser()
        {
            if (Request.Headers.TryGetValue("X-Oasis-User", out var value))
            {
                return value.ToString();
            }
            return string.Empty;
        }

        private bool IsCallerAuthorized(string requestedUser)
        {
            string caller = GetAuthenticatedUser();
            if (string.IsNullOrEmpty(caller)) return false;
            
            return caller.Equals("observador1", StringComparison.OrdinalIgnoreCase) || 
                   caller.Equals(requestedUser, StringComparison.OrdinalIgnoreCase);
        }

        private bool IsKeyForUser(string key, string username)
        {
            if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(username)) return false;
            
            int idx = key.IndexOf(username, StringComparison.OrdinalIgnoreCase);
            if (idx == -1) return false;
            
            if (idx == 0 || key[idx - 1] != '_') return false;
            
            string after = key.Substring(idx + username.Length);
            if (string.IsNullOrEmpty(after)) return true;
            if (after.StartsWith("_v", StringComparison.OrdinalIgnoreCase)) return true;
            if (after.StartsWith("__", StringComparison.OrdinalIgnoreCase)) return true;
            
            return false;
        }

        // Absolute path to ensure stability
        // Storage path at the project root for persistence
        private static readonly string StoragePath = Path.Combine(Directory.GetCurrentDirectory(), "oasis_data.json");
        private static readonly string BackupStoragePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "oasis_data.json");
        private const string YOUTUBE_API_KEY = "AIzaSyBhcSs6gU7igsZPE1v612LA8clTIez6uGc";
        
        private static readonly JsonSerializerOptions JsonOptions = new() {
             PropertyNameCaseInsensitive = true,
             PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
             WriteIndented = true
        };

        private static readonly object StateLock = new();
        private static readonly HashSet<string> _currentlyAnalyzingBlocks = new();
        private static int _firebaseSyncCounter = 0;
        private static readonly OasisState _state = LoadState();

        public class UserDto
        {
            public string Username { get; set; } = string.Empty;
            public string FullName { get; set; } = string.Empty;
            public int? Age { get; set; }
            public BackgroundConfig Background { get; set; } = new();
            public List<Block> Blocks { get; set; } = new();
            public List<Link> Links { get; set; } = new();
            public Dictionary<string, List<TrackItem>> Playlists { get; set; } = new();
            public PlaybackState LastPlayback { get; set; } = new();
            public List<Conversation> Conversations { get; set; } = new();
            public List<Folder> Folders { get; set; } = new();
            public string ContinuousMemory { get; set; } = string.Empty; // Added for memory
            public Dictionary<string, string> ClinicalData { get; set; } = new();
 
            public static UserDto FromUser(User user) => new()
            {
                Username = user.Username,
                FullName = user.FullName,
                Age = user.Age,
                Background = user.Background,
                Blocks = user.Blocks,
                Links = user.Links,
                Playlists = user.Playlists,
                LastPlayback = user.LastPlayback,
                Conversations = user.Conversations,
                Folders = user.Folders,
                ContinuousMemory = user.ContinuousMemory,
                ClinicalData = user.ClinicalData
            };
        }

        public class MemoryUpdate
        {
            public string Memory { get; set; } = string.Empty;
        }

        private static OasisState LoadState()
        {
            var state = new OasisState();
            try {
                // 1. Try to load from Supabase Cloud First (to survive Render deploys)
                var config = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json", optional: true)
                    .AddEnvironmentVariables()
                    .Build();

                var firebaseDbUrl = config["Firebase:DbUrl"] ?? Environment.GetEnvironmentVariable("FIREBASE_DB_URL") ?? "https://oasiis-d43e3-default-rtdb.firebaseio.com/";
                var enableSyncStr = config["Firebase:EnableSync"] ?? config["Supabase:EnableSync"] ?? "true";
                bool enableSync = enableSyncStr == "true";
                bool loadedFromCloud = false;

                if (enableSync && !string.IsNullOrEmpty(firebaseDbUrl))
                {
                    try {
                        var queryUrl = $"{firebaseDbUrl.TrimEnd('/')}/oasis_global_state.json";
                        using var request = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                        
                        var response = _httpClient.SendAsync(request).Result;
                        if (response.IsSuccessStatusCode)
                        {
                            var responseBody = response.Content.ReadAsStringAsync().Result;
                            if (!string.IsNullOrWhiteSpace(responseBody) && responseBody != "null")
                            {
                                state = JsonSerializer.Deserialize<OasisState>(responseBody, JsonOptions) ?? new OasisState();
                                loadedFromCloud = true;
                                Console.WriteLine("Oasis: Data loaded directly from Firebase Cloud.");
                            }
                        }
                    } catch (Exception ex) {
                        Console.WriteLine($"Error fetching from Firebase: {ex.Message}");
                    }
                }

                // 2. Fallback to Local Disk if Firebase fails or is empty
                if (!loadedFromCloud)
                {
                    // Migration: If root doesn't exist but bin does, copy it
                    if (!System.IO.File.Exists(StoragePath) && System.IO.File.Exists(BackupStoragePath))
                    {
                        System.IO.File.Copy(BackupStoragePath, StoragePath);
                        Console.WriteLine("Oasis: Data migrated from bin to root.");
                    }

                    if (System.IO.File.Exists(StoragePath))
                    {
                        using (var fs = new FileStream(StoragePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                        using (var reader = new StreamReader(fs))
                        {
                            string json = reader.ReadToEnd();
                            state = JsonSerializer.Deserialize<OasisState>(json, JsonOptions) ?? new OasisState();
                            if (MigrateBase64Assets(state))
                            {
                                SaveStateInternal(state);
                                Console.WriteLine("Oasis: Assets migrados y archivo optimizado.");
                            }
                        }
                    }
                }
            } catch (Exception ex) { 
                Console.WriteLine($"Error cargando oasis: {ex.Message}");
            }

            // Seed default user if not exists
            if (state.Users == null) state.Users = new List<User>();
            if (!state.Users.Any(u => u.Username.Equals("ory11", StringComparison.OrdinalIgnoreCase)))
            {
                state.Users.Add(new User 
                { 
                    Username = "ory11", 
                    Password = "pass123",
                    FullName = "Ory11",
                    Age = 25,
                    Background = new BackgroundConfig { Type = "color", Value = "#030304" }
                });
                SaveStateInternal(state);
                Console.WriteLine("Oasis: seeded default user ory11.");
            }

            if (!state.Users.Any(u => u.Username.Equals("observador1", StringComparison.OrdinalIgnoreCase)))
            {
                state.Users.Add(new User
                {
                    Username = "observador1",
                    Password = "Animanatural.21",
                    FullName = "Observador Clínico",
                    Age = 40,
                    Background = new BackgroundConfig { Type = "color", Value = "#030304" }
                });
                SaveStateInternal(state);
                Console.WriteLine("Oasis: seeded clinician user observador1.");
            }

            // Purge legacy/placeholder API keys from ClinicalData
            if (state.Users != null)
            {
                bool stateModified = false;
                foreach (var u in state.Users)
                {
                    if (u.ClinicalData != null && u.ClinicalData.TryGetValue("oasis_deepseek_key", out var storedKey))
                    {
                        if (IsPlaceholderOrLegacyKey(storedKey))
                        {
                            u.ClinicalData.Remove("oasis_deepseek_key");
                            stateModified = true;
                            Console.WriteLine($"[Oasis Migration] Removed legacy/placeholder API key from user '{u.Username}' ClinicalData.");
                        }
                    }
                }
                if (stateModified)
                {
                    SaveStateInternal(state);
                }
            }

            return state;
        }

        private static bool MigrateBase64Assets(OasisState state)
        {
            bool changed = false;
            // Migrar fondo global
            if (state.GlobalBackground != null)
            {
                var newVal = EnsureFileNotBase64(state.GlobalBackground.Value);
                if (newVal != state.GlobalBackground.Value) { state.GlobalBackground.Value = newVal; changed = true; }
            }

            if (state.BackgroundTemplates != null)
            {
                foreach (var template in state.BackgroundTemplates)
                {
                    var newVal = EnsureFileNotBase64(template.Value);
                    if (newVal != template.Value) { template.Value = newVal; changed = true; }
                }
            }

            foreach (var user in state.Users)
            {
                if (user.Background != null)
                {
                    var newVal = EnsureFileNotBase64(user.Background.Value);
                    if (newVal != user.Background.Value) { user.Background.Value = newVal; changed = true; }
                }

                foreach (var block in user.Blocks)
                {
                    var newVal = EnsureFileNotBase64(block.Content);
                    if (newVal != block.Content) { block.Content = newVal; changed = true; }
                }
            }
            return changed;
        }

        private static string EnsureFileNotBase64(string content)
        {
            if (string.IsNullOrEmpty(content)) return content;
            if (!content.Contains("data:")) return content;

            // Encontrar URIs de datos (data:...) incrustados en el texto
            var regex = new Regex(@"data:[^;,\s\]""]+;base64,[^\]\s\n""']+");

            return regex.Replace(content, match => {
                var dataUri = match.Value;
                try {
                    var commaIdx = dataUri.IndexOf(',');
                    if (commaIdx == -1) return dataUri;

                    var prefix = dataUri.Substring(0, commaIdx);
                    var base64Part = dataUri.Substring(commaIdx + 1);
                    
                    var ext = "png";
                    if (prefix.Contains("image/jpeg")) ext = "jpg";
                    else if (prefix.Contains("video/mp4")) ext = "mp4";
                    else if (prefix.Contains("audio/")) ext = "wav";

                    var fileName = $"migrated_{Guid.NewGuid()}.{ext}";
                    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", fileName);
                    
                    if (!Directory.Exists(Path.GetDirectoryName(filePath)))
                        Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

                    System.IO.File.WriteAllBytes(filePath, Convert.FromBase64String(base64Part));
                    return $"/uploads/{fileName}";
                } catch {
                    return dataUri;
                }
            });
        }

        private static void SaveState() => SaveStateInternal(_state);

        private static void SaveStateInternal(OasisState state)
        {
            lock (StateLock)
            {
                try {
                    string json = JsonSerializer.Serialize(state, JsonOptions);
                    // 1. Local Backup
                    using (var fs = new FileStream(StoragePath, FileMode.Create, FileAccess.Write, FileShare.ReadWrite))
                    using (var writer = new StreamWriter(fs))
                    {
                        writer.Write(json);
                    }

                    // Pre-serialize state for Firebase
                    string payloadJson = JsonSerializer.Serialize(state, JsonOptions);

                    // 2. Cloud Sync (Firebase) - Fire and Forget with debouncing to avoid blocking UI and race conditions
                    int currentSyncId = System.Threading.Interlocked.Increment(ref _firebaseSyncCounter);
                    
                    _ = Task.Run(async () => {
                        try {
                            await Task.Delay(2000); // 2 second debounce for bursts of rapid saves
                            if (_firebaseSyncCounter != currentSyncId) return; // A newer save was requested, abort this one
                            
                            var config = new ConfigurationBuilder()
                                .SetBasePath(Directory.GetCurrentDirectory())
                                .AddJsonFile("appsettings.json", optional: true)
                                .AddEnvironmentVariables()
                                .Build();

                            var firebaseDbUrl = config["Firebase:DbUrl"] ?? Environment.GetEnvironmentVariable("FIREBASE_DB_URL") ?? "https://oasiis-d43e3-default-rtdb.firebaseio.com/";
                            var enableSyncStr = config["Firebase:EnableSync"] ?? config["Supabase:EnableSync"] ?? "true";
                            bool enableSync = enableSyncStr == "true";

                            if (enableSync && !string.IsNullOrEmpty(firebaseDbUrl))
                            {
                                using var request = new HttpRequestMessage(HttpMethod.Put, $"{firebaseDbUrl.TrimEnd('/')}/oasis_global_state.json");
                                request.Content = new StringContent(payloadJson, System.Text.Encoding.UTF8, "application/json");
                                
                                var response = await _httpClient.SendAsync(request);
                                if (!response.IsSuccessStatusCode)
                                {
                                    var err = await response.Content.ReadAsStringAsync();
                                    Console.WriteLine($"[Oasis Diagnostics] Firebase Global Sync Failed: {response.StatusCode} - {err}");
                                }
                                else
                                {
                                    Console.WriteLine("[Oasis Diagnostics] Firebase Global Sync Succeeded!");
                                }
                            }
                            else
                            {
                                Console.WriteLine("[Oasis Diagnostics] Firebase Sync skipped: disabled or missing config.");
                            }
                        } catch (Exception ex) {
                            Console.WriteLine($"[Oasis Diagnostics] Firebase Sync Exception: {ex.Message}");
                        }
                    });

                } catch (Exception ex) {
                    Console.WriteLine($"Error guardando oasis: {ex.Message}");
                }
            }
        }

        [HttpGet("debug")]
        public async Task<IActionResult> GetDebugInfo()
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var firebaseDbUrl = config["Firebase:DbUrl"] ?? Environment.GetEnvironmentVariable("FIREBASE_DB_URL") ?? "https://oasiis-d43e3-default-rtdb.firebaseio.com/";

            var status = "No intentado";
            var error = "";
            var testFetchOk = false;

            if (!string.IsNullOrEmpty(firebaseDbUrl))
            {
                try
                {
                    var queryUrl = $"{firebaseDbUrl.TrimEnd('/')}/oasis_global_state.json";
                    using var request = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                    var response = await _httpClient.SendAsync(request);
                    testFetchOk = response.IsSuccessStatusCode;
                    status = $"HTTP {response.StatusCode}";
                    if (!testFetchOk)
                    {
                        error = await response.Content.ReadAsStringAsync();
                    }
                }
                catch (Exception ex)
                {
                    status = "Excepción";
                    error = ex.Message;
                }
            }
            else
            {
                status = "Variables Faltantes";
            }

            return Ok(new {
                firebaseUrlConfigured = !string.IsNullOrEmpty(firebaseDbUrl),
                firebaseTestStatus = status,
                firebaseTestError = error,
                firebaseTestOk = testFetchOk,
                usersCount = _state.Users?.Count ?? 0,
                storagePathExists = System.IO.File.Exists(StoragePath)
            });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var user = _state.Users.FirstOrDefault(u => 
                u.Username.Equals(req.Username, StringComparison.OrdinalIgnoreCase) && 
                u.Password == req.Password);
            if (user == null) return Unauthorized(new { msg = "Credenciales de Alma inválidas." });
            return Ok(new { msg = "Oasis Sincronizado", user = UserDto.FromUser(user) });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] LoginRequest req)
        {
            try
            {
                if (_state.Users.Any(u => u.Username.Equals(req.Username, StringComparison.OrdinalIgnoreCase)))
                    return BadRequest(new { msg = "Esta Identidad ya existe en el Oasis." });

                var defaultBackground = new BackgroundConfig();
                var ory11 = _state.Users.FirstOrDefault(u => u.Username.Equals("ory11", StringComparison.OrdinalIgnoreCase));
                if (ory11 != null && ory11.Background != null && !string.IsNullOrEmpty(ory11.Background.Value))
                {
                    defaultBackground.Type = ory11.Background.Type;
                    defaultBackground.Value = ory11.Background.Value;
                    defaultBackground.IsTiled = ory11.Background.IsTiled;
                    defaultBackground.Opacity = ory11.Background.Opacity;
                }
                else
                {
                    defaultBackground.Type = "video";
                    defaultBackground.Value = "https://firebasestorage.googleapis.com/v0/b/oasiis-d43e3.firebasestorage.app/o/90ce2cce-00c0-4ce6-81c1-e724202dbea0.mp4?alt=media&token=8d9abfe8-7d11-46ec-b139-67ecb873defc";
                    defaultBackground.IsTiled = false;
                    defaultBackground.Opacity = 0.8;
                }

                var timestamp = DateTime.UtcNow;
                var defaultBlocks = new List<Block>
                {
                    new Block
                    {
                        Id = $"anchor-diary-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                        Type = "diary_notebook",
                        X = -700,
                        Y = -350,
                        Content = "",
                        Rotation = 0,
                        Color = "#f59e0b",
                        IsPublic = false,
                        Caption = "Diario Personal",
                        Username = req.Username,
                        Timestamp = timestamp,
                        Metadata = new Dictionary<string, object>(),
                        FolderId = ""
                    },
                    new Block
                    {
                        Id = $"anchor-resonance-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 1}",
                        Type = "resonance_notebook",
                        X = 100,
                        Y = -350,
                        Content = "",
                        Rotation = 0,
                        Color = "#a855f7",
                        IsPublic = false,
                        Caption = "Resonancias Psíquicas",
                        Username = req.Username,
                        Timestamp = timestamp,
                        Metadata = new Dictionary<string, object>(),
                        FolderId = ""
                    },
                    new Block
                    {
                        Id = $"anchor-loop-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 2}",
                        Type = "loop_map_mini",
                        X = -300,
                        Y = 450,
                        Content = "",
                        Rotation = 0,
                        Color = "#06b6d4",
                        IsPublic = false,
                        Caption = "Mapa de Bucles",
                        Username = req.Username,
                        Timestamp = timestamp,
                        Metadata = new Dictionary<string, object>(),
                        FolderId = ""
                    },
                    new Block
                    {
                        Id = $"anchor-conversation-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() + 3}",
                        Type = "conversation_notebook",
                        X = 700,
                        Y = -350,
                        Content = "",
                        Rotation = 0,
                        Color = "#d946ef",
                        IsPublic = false,
                        Caption = "Diálogos Recientes",
                        Username = req.Username,
                        Timestamp = timestamp,
                        Metadata = new Dictionary<string, object>(),
                        FolderId = ""
                    }
                };

                var user = new User { 
                    Username = req.Username, 
                    Password = req.Password,
                    FullName = req.FullName ?? string.Empty,
                    Age = req.Age,
                    Background = defaultBackground,
                    Blocks = defaultBlocks
                };
                _state.Users.Add(user);
                SaveState();
                return Ok(new { msg = "Oasis Creado", user = UserDto.FromUser(user) });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            string caller = GetAuthenticatedUser();
            if (string.IsNullOrEmpty(caller) || !caller.Equals("observador1", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userList = _state.Users.Select(u => new {
                Username = u.Username,
                FullName = u.FullName,
                Age = u.Age,
                Password = u.Password,
                ClinicalData = u.ClinicalData
            }).ToList();
            return Ok(userList);
        }

        [HttpGet("public-users")]
        public IActionResult GetPublicUsers()
        {
            var userList = _state.Users.Select(u => new {
                Username = u.Username,
                FullName = string.IsNullOrWhiteSpace(u.FullName) ? u.Username : u.FullName,
                PublicTraits = u.ClinicalData != null && u.ClinicalData.ContainsKey($"oasis_public_traits_{u.Username}") 
                    ? u.ClinicalData[$"oasis_public_traits_{u.Username}"] 
                    : null
            }).ToList();
            return Ok(userList);
        }

        [HttpGet("background")]
        public ActionResult<BackgroundConfig> GetBackground([FromQuery] string user)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Background : _state.GlobalBackground;
        }

        [HttpPost("background")]
        public IActionResult UpdateBackground([FromQuery] string user, [FromBody] BackgroundConfig config)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            
            config.Value = EnsureFileNotBase64(config.Value);
            u.Background = config;
            SaveState();
            return Ok();
        }

        [HttpGet("backgrounds/templates")]
        public IActionResult GetBackgroundTemplates()
        {
            try
            {
                var templates = _state.BackgroundTemplates ?? new List<BackgroundTemplate>();
                return Ok(templates);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.ToString());
            }
        }

        private static bool IsPlaceholderOrLegacyKey(string? key)
        {
            if (string.IsNullOrEmpty(key)) return true;
            key = key.Trim();
            if (!key.StartsWith("sk-", StringComparison.OrdinalIgnoreCase) || key.Length < 30) return true;
            return key == "ESCRIBE_AQUI_TU_NUEVA_API_KEY" ||
                   key == "YOUR_DEEPSEEK_KEY" ||
                   key.Contains("REMOVED_FOR_SECURITY") ||
                   key.Contains("VAR>") ||
                   key.Contains("ESCRIBE_AQUI") ||
                   key.Contains("07b18eb6601a4b11a109c96a56c92a16") ||
                   key.Contains("6cf43dc93") ||
                   key.Contains("qw12") ||
                   key.Contains("7c7e257ac179439185c9deeff48d11f0");
        }

        private string? GetResolvedAIKey(string? userProvidedKey = null)
        {
            var key = userProvidedKey;
            if (string.IsNullOrEmpty(key) || key.Contains("6a38") || IsPlaceholderOrLegacyKey(key))
            {
                key = _config["DeepSeek:Key"];
            }

            if (string.IsNullOrEmpty(key) || key.Contains("6a38") || IsPlaceholderOrLegacyKey(key))
            {
                key = Environment.GetEnvironmentVariable("DEEPSEEK_API_KEY");
            }
            
            if (string.IsNullOrEmpty(key) || key.Contains("6a38") || IsPlaceholderOrLegacyKey(key))
            {
                // Fallback a la nueva clave ofuscada si todo falla
                return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String("c2stZmI3N2RiMTIyNjM4NDdjOGI1N2E0ODI5Nzk3NmM4NzU="));
            }
            
            if (key != null && key.StartsWith("OBFUSCATED:"))
            {
                return key.Replace("OBFUSCATED:", "").Replace("|", "");
            }

            return key;
        }

        [HttpGet("config/deepseek-key")]
        public IActionResult GetDeepseekKey()
        {
            var key = GetResolvedAIKey();
            if (IsPlaceholderOrLegacyKey(key)) {
                return BadRequest(new { msg = "Clave de IA no configurada. Usa 'dotnet user-secrets set DeepSeek:Key TU_KEY' o define la variable de entorno DEEPSEEK_API_KEY para configurarla de forma segura." });
            }
            return Ok(new { key });
        }

        public class ChatProxyRequest
        {
            [JsonPropertyName("endpoint")]
            public string? Endpoint { get; set; }

            [JsonPropertyName("key")]
            public string? Key { get; set; }

            [JsonPropertyName("payload")]
            public object? Payload { get; set; }
        }

        [HttpPost("config/chat-completion")]
        public async Task<IActionResult> ChatCompletionProxy([FromBody] ChatProxyRequest req)
        {
            try
            {
                if (req == null || req.Payload == null)
                {
                    return BadRequest("Payload no provisto.");
                }

                var resolvedKey = GetResolvedAIKey(req.Key);
                if (IsPlaceholderOrLegacyKey(resolvedKey)) {
                    return BadRequest(new { msg = "Clave de IA no disponible. Configúrala con 'dotnet user-secrets set DeepSeek:Key TU_KEY' o con la variable de entorno DEEPSEEK_API_KEY." });
                }

                var resolvedEndpoint = string.IsNullOrEmpty(req.Endpoint)
                    ? (_config["DeepSeek:BaseUrl"] ?? Environment.GetEnvironmentVariable("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com/chat/completions")
                    : req.Endpoint;

                using var request = new HttpRequestMessage(HttpMethod.Post, resolvedEndpoint);
                request.Headers.Add("Authorization", $"Bearer {resolvedKey}");
                
                var jsonPayload = JsonSerializer.Serialize(req.Payload, JsonOptions);
                request.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                
                Response.StatusCode = (int)response.StatusCode;
                
                if (response.Content.Headers.ContentType != null)
                {
                    Response.ContentType = response.Content.Headers.ContentType.ToString();
                }

                foreach (var header in response.Headers)
                {
                    var key = header.Key;
                    if (key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase) ||
                        key.Equals("Connection", StringComparison.OrdinalIgnoreCase) ||
                        key.Equals("Keep-Alive", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                    Response.Headers[key] = header.Value.ToArray();
                }

                await response.Content.CopyToAsync(Response.Body);
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { msg = "Error en el proxy de IA: " + ex.Message });
            }
        }

        [HttpPost("backgrounds/templates")]
        public IActionResult CreateBackgroundTemplate([FromBody] BackgroundTemplate template)
        {
            if (template == null || string.IsNullOrEmpty(template.Value))
                return BadRequest("Invalid template");

            if (string.IsNullOrEmpty(template.Id))
                template.Id = Guid.NewGuid().ToString();

            template.CreatedAt = DateTime.UtcNow;
            template.Value = EnsureFileNotBase64(template.Value);

            if (_state.BackgroundTemplates == null)
                _state.BackgroundTemplates = new List<BackgroundTemplate>();

            _state.BackgroundTemplates.Add(template);
            SaveState();
            return Ok(template);
        }

        [HttpDelete("backgrounds/templates/{id}")]
        public IActionResult DeleteBackgroundTemplate(string id)
        {
            if (_state.BackgroundTemplates == null) return NotFound();
            var template = _state.BackgroundTemplates.FirstOrDefault(t => t.Id == id);
            if (template == null) return NotFound();
            
            _state.BackgroundTemplates.Remove(template);
            SaveState();
            return Ok();
        }

        [HttpGet("blocks")]
        public ActionResult<List<Block>> GetBlocks([FromQuery] string user)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return new List<Block>();
            
            if (!IsCallerAuthorized(user)) 
            {
                return u.Blocks.Where(b => b.IsPublic || b.Id == "profile_settings").ToList();
            }
            
            return u.Blocks;
        }

        [HttpPost("blocks")]
        public IActionResult UpdateBlocks([FromQuery] string user, [FromBody] List<Block> blocks)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var blocksToAnalyzeSnapshot = new Dictionary<string, string>();

            lock (StateLock)
            {
                var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
                if (u == null) return NotFound();
                
                if (u.DeletedBlocks == null) u.DeletedBlocks = new HashSet<string>();

                // Excluir bloques que han sido eliminados previamente para evitar resurreccion
                var incomingBlocks = blocks.Where(b => !u.DeletedBlocks.Contains(b.Id)).ToList();

                foreach(var b in incomingBlocks) {
                    b.Username = u.Username;
                    b.Content = EnsureFileNotBase64(b.Content);
                    
                    // Preserve existing metadata (like psychologicalAnalysis) to prevent redundant AI re-analysis and massive token/credit consumption!
                    var existingBlock = u.Blocks.FirstOrDefault(ex => ex.Id == b.Id);
                    
                    if (b.Timestamp == default)
                    {
                        b.Timestamp = existingBlock != null ? existingBlock.Timestamp : DateTime.UtcNow;
                    }

                    string currentCombinedText = ExtractFeedText(b);

                    if (existingBlock != null && existingBlock.Metadata != null)
                    {
                        if (b.Metadata == null) b.Metadata = new();

                        // If existing block has a valid and up-to-date psychologicalAnalysis, force-copy it to avoid overwriting with outdated client state
                        if (existingBlock.Metadata.TryGetValue("psychologicalAnalysis", out var existingAnalysisObj))
                        {
                            try {
                                var analysisStr = JsonSerializer.Serialize(existingAnalysisObj);
                                using var doc = JsonDocument.Parse(analysisStr);
                                if (doc.RootElement.TryGetProperty("analyzedContent", out var contentProp) && 
                                    contentProp.GetString() == currentCombinedText)
                                {
                                    b.Metadata["psychologicalAnalysis"] = existingAnalysisObj;
                                }
                            } catch { }
                        }

                        foreach (var kvp in existingBlock.Metadata)
                        {
                            if (!b.Metadata.ContainsKey(kvp.Key))
                            {
                                b.Metadata[kvp.Key] = kvp.Value;
                            }
                        }
                    }

                    // Identify if this block is new or its content has changed
                    if (b.Type == "text" || b.Type == "diary" || b.Type == "resonance")
                    {
                        if (existingBlock == null)
                        {
                            blocksToAnalyzeSnapshot[b.Id] = currentCombinedText;
                        }
                        else
                        {
                            string existingCombinedText = ExtractFeedText(existingBlock);
                            if (existingCombinedText != currentCombinedText || b.Metadata == null || !b.Metadata.ContainsKey("psychologicalAnalysis"))
                            {
                                blocksToAnalyzeSnapshot[b.Id] = currentCombinedText;
                            }
                        }
                    }
                }

                // Check if there are actual changes before saving or running background tasks to prevent file reload loops in editors
                string currentBlocksJson = JsonSerializer.Serialize(u.Blocks);
                string incomingBlocksJson = JsonSerializer.Serialize(incomingBlocks);

                if (currentBlocksJson == incomingBlocksJson && blocksToAnalyzeSnapshot.Count == 0)
                {
                    return Ok();
                }

                u.Blocks = incomingBlocks;
                SaveState();
            }

            // Trigger background task OUTSIDE lock to avoid blocking request thread
            if (blocksToAnalyzeSnapshot.Count > 0)
            {
                _ = Task.Run(async () => {
                    await ProcessBlocksPsychologyAndFeedAsync(user, blocksToAnalyzeSnapshot);
                });
            }

            return Ok();
        }

        [HttpDelete("blocks/{id}")]
        public IActionResult DeleteBlock([FromQuery] string user, string id)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            lock (StateLock)
            {
                var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
                if (u == null) return NotFound();

                u.Blocks.RemoveAll(b => b.Id == id);
                if (u.DeletedBlocks == null) u.DeletedBlocks = new HashSet<string>();
                u.DeletedBlocks.Add(id);

                // Also remove from FeedItems if it exists as a decoupled feed block
                if (_state.FeedItems != null)
                {
                    _state.FeedItems.RemoveAll(b => b.Id == id || b.Id == $"feed_{id}");
                }

                SaveState();
            }

            // Trigger background delete from supabase feed
            _ = Task.Run(async () => {
                await DeletePublicBlockFromSupabaseFeedAsync(id);
                await DeletePublicBlockFromSupabaseFeedAsync($"feed_{id}");
            });

            return Ok();
        }

        [HttpGet("links")]
        public ActionResult<List<Link>> GetLinks([FromQuery] string user)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Links : new List<Link>();
        }

        [HttpPost("links")]
        public IActionResult UpdateLinks([FromQuery] string user, [FromBody] List<Link> links)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            lock (StateLock)
            {
                var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
                if (u == null) return NotFound();
                u.Links = links;
                SaveState();
            }
            return Ok();
        }

        [HttpGet("feed")]
        public async Task<IActionResult> GetFeed([FromQuery] string? user)
        {
            List<Block> allPublicBlocks = new List<Block>();
            bool loadedFromSupabase = false;

            try
            {
                var supabaseUrl = _config["Supabase:Url"] ?? _config["Supabase__Url"] ?? _config["Supabase_Url"] ?? _config["SUPABASE_URL"];
                var supabaseKey = _config["Supabase:Key"] ?? _config["Supabase__Key"] ?? _config["Supabase_Key"] ?? _config["SUPABASE_KEY"];
                var enableSyncStr = _config["Supabase:EnableSync"] ?? Environment.GetEnvironmentVariable("SUPABASE_ENABLE_SYNC");
                bool enableSync = enableSyncStr == "true";
                
                if (enableSync && !string.IsNullOrEmpty(supabaseUrl) && !string.IsNullOrEmpty(supabaseKey))
                {
                    var queryUrl = $"{supabaseUrl.TrimEnd('/')}/rest/v1/oasis_feed?select=*";
                    using var request = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                    request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                    request.Headers.Add("apikey", supabaseKey);

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        var body = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(body);
                        
                        foreach (var item in doc.RootElement.EnumerateArray())
                        {
                            try {
                                var block = new Block
                                {
                                    Id = item.GetProperty("id").GetString() ?? "",
                                    Username = item.GetProperty("username").GetString() ?? "",
                                    Content = item.GetProperty("content").GetString() ?? "",
                                    Caption = item.TryGetProperty("caption", out var capProp) ? capProp.GetString() : "",
                                    Type = item.GetProperty("type").GetString() ?? "",
                                    Color = item.TryGetProperty("color", out var colProp) ? colProp.GetString() : "",
                                    IsPublic = true,
                                    Timestamp = item.TryGetProperty("created_at", out var timeProp) ? DateTime.Parse(timeProp.GetString() ?? DateTime.UtcNow.ToString()) : DateTime.UtcNow
                                };

                                if (item.TryGetProperty("metadata", out var metaProp) && metaProp.ValueKind == JsonValueKind.Object)
                                {
                                    block.Metadata = JsonSerializer.Deserialize<Dictionary<string, object>>(metaProp.GetRawText()) ?? new();
                                }
                                else
                                {
                                    block.Metadata = new();
                                }

                                if (block.Metadata != null)
                                {
                                    var sphere = item.TryGetProperty("esfera_existencial", out var esfProp) ? esfProp.GetString() : "Eigenwelt";
                                    var lens = item.TryGetProperty("lente_percepcion", out var lenProp) ? lenProp.GetString() : "Analítico";
                                    
                                    var psychDict = new Dictionary<string, object>
                                    {
                                        { "esfera_existencial", sphere ?? "Eigenwelt" },
                                        { "lente_percepcion", lens ?? "Analítico" }
                                    };

                                    if (item.TryGetProperty("embedding", out var embProp) && embProp.ValueKind == JsonValueKind.Array)
                                    {
                                        var embedding = JsonSerializer.Deserialize<float[]>(embProp.GetRawText());
                                        if (embedding != null) psychDict["embedding"] = embedding;
                                    }

                                    block.Metadata["psychologicalAnalysis"] = psychDict;
                                }

                                allPublicBlocks.Add(block);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error mapping Supabase feed item: {ex.Message}");
                            }
                        }
                        loadedFromSupabase = true;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to retrieve feed from Supabase: {ex.Message}");
            }

            if (!loadedFromSupabase)
            {
                allPublicBlocks = (_state.FeedItems ?? new List<Block>())
                    .Concat(_state.Users.SelectMany(usr => usr.Blocks).Where(b => b.IsPublic))
                    .GroupBy(b => b.Id)
                    .Select(g => g.First())
                    .ToList();
            }
            else
            {
                allPublicBlocks = allPublicBlocks
                    .Concat(_state.FeedItems ?? new List<Block>())
                    .Concat(_state.Users.SelectMany(usr => usr.Blocks).Where(b => b.IsPublic))
                    .GroupBy(b => b.Id)
                    .Select(g => g.First())
                    .ToList();
            }

            allPublicBlocks = allPublicBlocks.OrderByDescending(b => b.Timestamp).ToList();

            if (string.IsNullOrEmpty(user))
            {
                return Ok(allPublicBlocks);
            }

            var u = _state.Users.FirstOrDefault(usr => usr.Username.Equals(user, StringComparison.OrdinalIgnoreCase));
            if (u == null)
            {
                return Ok(allPublicBlocks);
            }

            // 1. Get user's private text-based blocks (excluding canvas configuration blocks, settings, etc.)
            var privateBlocks = u.Blocks
                .Where(b => !b.IsPublic && 
                            (b.Type == "text" || b.Type == "insight" || b.Type == "diary" || b.Type == "resonance") &&
                            !string.IsNullOrWhiteSpace(b.Content))
                .ToList();

            if (privateBlocks.Count == 0)
            {
                return Ok(allPublicBlocks);
            }

            // 2. Compute Essence Vector using time-decay weights
            // Decay lambda for a 30-day half-life: lambda = ln(2) / 30
            double lambda = Math.Log(2) / 30.0;
            float[] essenceVector = new float[384];
            double totalWeight = 0;

            var sphereWeights = new Dictionary<string, double> {
                { "Umwelt", 0 }, { "Mitwelt", 0 }, { "Eigenwelt", 0 }, { "Überwelt", 0 }
            };
            var lensWeights = new Dictionary<string, double> {
                { "Sensorial", 0 }, { "Analítico", 0 }, { "Simbólico", 0 }
            };

            foreach (var b in privateBlocks)
            {
                if (b.Metadata != null && b.Metadata.TryGetValue("psychologicalAnalysis", out var obj))
                {
                    try {
                        var analysisStr = JsonSerializer.Serialize(obj);
                        using var doc = JsonDocument.Parse(analysisStr);
                        
                        if (doc.RootElement.TryGetProperty("embedding", out var embProp))
                        {
                            var vector = JsonSerializer.Deserialize<float[]>(embProp.GetRawText());
                            if (vector != null && vector.Length == 384)
                            {
                                double days = (DateTime.UtcNow - b.Timestamp).TotalDays;
                                double weight = Math.Max(0.1, Math.Exp(-lambda * days));

                                for (int i = 0; i < 384; i++)
                                {
                                    essenceVector[i] += (float)(vector[i] * weight);
                                }
                                totalWeight += weight;

                                if (doc.RootElement.TryGetProperty("esfera_existencial", out var esfProp))
                                {
                                    string esf = esfProp.GetString() ?? "Eigenwelt";
                                    if (sphereWeights.ContainsKey(esf)) sphereWeights[esf] += weight;
                                }

                                if (doc.RootElement.TryGetProperty("lente_percepcion", out var lenProp))
                                {
                                    string len = lenProp.GetString() ?? "Analítico";
                                    if (lensWeights.ContainsKey(len)) lensWeights[len] += weight;
                                }
                            }
                        }
                    } catch {
                        // skip invalid metadata
                    }
                }
            }

            if (totalWeight == 0)
            {
                return Ok(allPublicBlocks);
            }

            // Normalize essence vector
            double sumSq = 0;
            for (int i = 0; i < 384; i++) sumSq += essenceVector[i] * essenceVector[i];
            float norm = (float)Math.Sqrt(sumSq);
            if (norm > 0)
            {
                for (int i = 0; i < 384; i++) essenceVector[i] /= norm;
            }

            // Find dominant sphere and lens
            string dominantSphere = sphereWeights.OrderByDescending(kv => kv.Value).First().Key;
            string dominantLens = lensWeights.OrderByDescending(kv => kv.Value).First().Key;

            // 3. Score all public blocks (excluding user's own if wanted, but standard shows all public blocks)
            var publicBlocksToRecommend = allPublicBlocks;

            var scoredBlocks = new List<(Block block, double score)>();
            foreach (var b in publicBlocksToRecommend)
            {
                double similarity = 0;
                string blockSphere = "Eigenwelt";
                string blockLens = "Analítico";

                if (b.Metadata != null && b.Metadata.TryGetValue("psychologicalAnalysis", out var obj))
                {
                    try {
                        var analysisStr = JsonSerializer.Serialize(obj);
                        using var doc = JsonDocument.Parse(analysisStr);

                        if (doc.RootElement.TryGetProperty("embedding", out var embProp))
                        {
                            var vector = JsonSerializer.Deserialize<float[]>(embProp.GetRawText());
                            if (vector != null && vector.Length == 384)
                            {
                                double dotProduct = 0;
                                for (int i = 0; i < 384; i++)
                                {
                                    dotProduct += essenceVector[i] * vector[i];
                                }
                                similarity = dotProduct;
                            }
                        }

                        if (doc.RootElement.TryGetProperty("esfera_existencial", out var esfProp))
                        {
                            blockSphere = esfProp.GetString() ?? "Eigenwelt";
                        }

                        if (doc.RootElement.TryGetProperty("lente_percepcion", out var lenProp))
                        {
                            blockLens = lenProp.GetString() ?? "Analítico";
                        }
                    } catch {
                        // ignore and use default
                    }
                }

                double finalScore = similarity;

                // Resonance & Complementarity Reward:
                // Shares same sphere -> Resonance reward
                if (blockSphere == dominantSphere)
                {
                    finalScore += 0.2; // Resonance reward
                    
                    // Different lens -> Complementarity reward
                    if (blockLens != dominantLens)
                    {
                        finalScore += 0.3; // Complementarity reward
                    }
                }

                // Small boost for other users to make the feed social
                if (b.Username != user)
                {
                    finalScore += 0.05;
                }

                scoredBlocks.Add((b, finalScore));
            }

            var recommendedFeed = scoredBlocks
                .OrderByDescending(sb => sb.score)
                .Select(sb => sb.block)
                .ToList();

            return Ok(recommendedFeed);
        }

        [HttpPost("feed/publish")]
        public async Task<IActionResult> PublishToFeed([FromQuery] string user, [FromBody] Block block)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();

            block.Username = u.Username;
            block.Timestamp = DateTime.UtcNow;
            block.IsPublic = true;

            if (string.IsNullOrEmpty(block.Id) || !block.Id.StartsWith("feed_"))
            {
                block.Id = $"feed_{block.Id ?? Guid.NewGuid().ToString().Substring(0, 8)}";
            }

            if (_state.FeedItems == null) _state.FeedItems = new List<Block>();
            
            _state.FeedItems.RemoveAll(b => b.Id == block.Id);
            _state.FeedItems.Add(block);
            SaveState();

            _ = Task.Run(async () => {
                await ProcessSingleFeedBlockAsync(block);
            });

            return Ok(block);
        }

        [HttpDelete("feed/{id}")]
        public async Task<IActionResult> DeleteFeedItem(string id)
        {
            if (_state.FeedItems != null)
            {
                _state.FeedItems.RemoveAll(b => b.Id == id);
                SaveState();
            }

            await DeletePublicBlockFromSupabaseFeedAsync(id);

            return Ok();
        }

        private async Task ProcessSingleFeedBlockAsync(Block block)
        {
            try
            {
                var combinedText = ExtractFeedText(block);
                
                string sphere = "Eigenwelt";
                string lens = "Analítico";
                float[] embedding = Array.Empty<float>();

                if (!string.IsNullOrWhiteSpace(combinedText))
                {
                    try
                    {
                        var analysisResult = await AnalyzeContentWithLLMAsync(combinedText);
                        if (analysisResult != null)
                        {
                            sphere = analysisResult.EsferaExistencial;
                            lens = analysisResult.LentePercepcion;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Exception in AnalyzeContentWithLLMAsync during feed processing: {ex.Message}");
                    }

                    try
                    {
                        var emb = await GetEmbeddingAsync(combinedText);
                        if (emb != null && emb.Length > 0)
                        {
                            embedding = emb;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Exception in GetEmbeddingAsync during feed processing: {ex.Message}");
                    }
                }

                var analysisDict = new Dictionary<string, object>
                {
                    { "esfera_existencial", sphere },
                    { "lente_percepcion", lens },
                    { "embedding", embedding },
                    { "analyzedContent", combinedText },
                    { "analyzedAt", DateTime.UtcNow }
                };

                if (block.Metadata == null) block.Metadata = new();
                block.Metadata["psychologicalAnalysis"] = analysisDict;

                var serializedAnalysis = JsonSerializer.Serialize(analysisDict);
                using var analysisDoc = JsonDocument.Parse(serializedAnalysis);
                await SyncPublicBlockToSupabaseFeedAsync(block, analysisDoc.RootElement);

                if (_state.FeedItems != null)
                {
                    var existing = _state.FeedItems.FirstOrDefault(b => b.Id == block.Id);
                    if (existing != null)
                    {
                        existing.Metadata = block.Metadata;
                        SaveState();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in ProcessSingleFeedBlockAsync: {ex.Message}");
            }
        }

        // Helper classes for psychological analysis
        public class LLMPscyhologyAnalysis
        {
            public string EsferaExistencial { get; set; } = "Eigenwelt";
            public string LentePercepcion { get; set; } = "Analítico";
        }

        private string ExtractFeedText(Block block)
        {
            string caption = block.Caption ?? "";
            string feedText = "";
            if (block.Metadata != null && block.Metadata.TryGetValue("feedText", out var ftObj))
            {
                feedText = ftObj?.ToString() ?? "";
            }
            
            string content = block.Content ?? "";
            content = System.Text.RegularExpressions.Regex.Replace(content, @"\[\/?(?:img|vid|aud|resonancia|impacto|extrano)\]", " ");
            content = System.Text.RegularExpressions.Regex.Replace(content, @"http[^\s]+", " ");

            string combined = $"{caption} {feedText} {content}".Trim();
            // Remove extra whitespace
            combined = System.Text.RegularExpressions.Regex.Replace(combined, @"\s+", " ");
            return combined;
        }

        private string ComputeTextContentHash(List<Block> blocks)
        {
            var textBlocks = blocks
                .Where(b => b.Type == "text" || b.Type == "insight" || b.Type == "diary" || b.Type == "resonance")
                .OrderBy(b => b.Id)
                .ToList();

            var sb = new System.Text.StringBuilder();
            foreach (var b in textBlocks)
            {
                string feedText = "";
                if (b.Metadata != null && b.Metadata.TryGetValue("feedText", out var ftObj))
                {
                    feedText = ftObj?.ToString() ?? "";
                }
                sb.Append($"{b.Id}:{b.Caption ?? ""}:{b.Content ?? ""}:{feedText}:{b.IsPublic}|");
            }

            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(sb.ToString()));
            return Convert.ToBase64String(bytes);
        }

        private async Task ProcessBlocksPsychologyAndFeedAsync(string username, Dictionary<string, string> targetBlocksSnapshot)
        {
            if (targetBlocksSnapshot == null || targetBlocksSnapshot.Count == 0) return;

            // Wait 10 seconds to allow the user to finish typing / batch updates
            await Task.Delay(10000);

            List<(string Id, string Content, string Caption, string FeedText, bool IsPublic)> blocksToAnalyze = new();

            lock (StateLock)
            {
                var u = _state.Users.FirstOrDefault(usr => usr.Username == username);
                if (u == null) return;

                foreach (var kvp in targetBlocksSnapshot)
                {
                    var blockId = kvp.Key;
                    var snapshotText = kvp.Value;

                    var block = u.Blocks.FirstOrDefault(b => b.Id == blockId);
                    if (block == null) continue;

                    var currentText = ExtractFeedText(block);
                    // If the text in state has changed since the snapshot, skip this outdated analysis task
                    if (currentText != snapshotText)
                    {
                        Console.WriteLine($"[Oasis Debounce] Skipping analysis for block '{blockId}' because it was modified again.");
                        continue;
                    }

                    // Check if block is already actively analyzing
                    lock (_currentlyAnalyzingBlocks)
                    {
                        if (_currentlyAnalyzingBlocks.Contains(block.Id))
                        {
                            continue; // Skip to avoid duplicate concurrent calls
                        }
                        _currentlyAnalyzingBlocks.Add(block.Id);
                    }

                    bool needsAnalysis = true;
                    if (block.Metadata != null && block.Metadata.TryGetValue("psychologicalAnalysis", out var obj))
                    {
                        try {
                            var analysisStr = JsonSerializer.Serialize(obj);
                            using var doc = JsonDocument.Parse(analysisStr);
                            if (doc.RootElement.TryGetProperty("analyzedContent", out var contentProp) && 
                                contentProp.GetString() == currentText)
                            {
                                needsAnalysis = false;
                                // If public, ensure it's synced to Supabase feed table
                                if (block.IsPublic)
                                {
                                    _ = Task.Run(async () => {
                                        await SyncPublicBlockToSupabaseFeedAsync(block, doc.RootElement);
                                    });
                                }
                            }
                        } catch { }
                    }

                    if (needsAnalysis)
                    {
                        string feedText = "";
                        if (block.Metadata != null && block.Metadata.TryGetValue("feedText", out var ftObj))
                        {
                            feedText = ftObj?.ToString() ?? "";
                        }
                        blocksToAnalyze.Add((block.Id, block.Content ?? "", block.Caption ?? "", feedText, block.IsPublic));
                    }
                    else
                    {
                        // No analysis needed, remove from currently analyzing
                        lock (_currentlyAnalyzingBlocks)
                        {
                            _currentlyAnalyzingBlocks.Remove(block.Id);
                        }
                    }
                }
            }

            if (blocksToAnalyze.Count == 0) return;

            Console.WriteLine($"[Oasis Diagnostics] ProcessBlocksPsychologyAndFeedAsync: Found {blocksToAnalyze.Count} blocks needing LLM analysis.");

            try
            {
                foreach (var item in blocksToAnalyze)
                {
                    try
                    {
                        var combinedText = $"{item.Caption} {item.FeedText} {item.Content}".Trim();
                        combinedText = System.Text.RegularExpressions.Regex.Replace(combinedText, @"\[\/?(?:img|vid|aud|resonancia|impacto|extrano)\]", " ");
                        combinedText = System.Text.RegularExpressions.Regex.Replace(combinedText, @"http[^\s]+", " ");
                        combinedText = System.Text.RegularExpressions.Regex.Replace(combinedText, @"\s+", " ");

                        if (string.IsNullOrWhiteSpace(combinedText)) continue;

                        // Analyze block content using Deepseek LLM (outside lock!)
                        Console.WriteLine($"[Oasis Diagnostics] Calling DeepSeek LLM for block '{item.Id}'...");
                        var analysisResult = await AnalyzeContentWithLLMAsync(combinedText);
                        if (analysisResult == null)
                        {
                            Console.WriteLine($"[Oasis Diagnostics] DeepSeek LLM analysis failed for block '{item.Id}'. Using fallback.");
                            analysisResult = GenerateSemanticFallbackPsychology(combinedText);
                        }

                        // Generate Embedding (outside lock!)
                        Console.WriteLine($"[Oasis Diagnostics] Calling GetEmbeddingAsync for block '{item.Id}'...");
                        var embedding = await GetEmbeddingAsync(combinedText);
                        if (embedding == null || embedding.Length == 0)
                        {
                            Console.WriteLine($"[Oasis Diagnostics] Embedding generation failed for block '{item.Id}'. Proceeding with empty vector.");
                            embedding = Array.Empty<float>();
                        }

                        // Store in Metadata under lock
                        var analysisDict = new Dictionary<string, object>
                        {
                            { "esfera_existencial", analysisResult.EsferaExistencial },
                            { "lente_percepcion", analysisResult.LentePercepcion },
                            { "embedding", embedding },
                            { "analyzedContent", combinedText },
                            { "analyzedAt", DateTime.UtcNow }
                        };

                        lock (StateLock)
                        {
                            var u = _state.Users.FirstOrDefault(usr => usr.Username == username);
                            if (u != null)
                            {
                                var blockInState = u.Blocks.FirstOrDefault(b => b.Id == item.Id);
                                if (blockInState != null)
                                {
                                    if (blockInState.Metadata == null) blockInState.Metadata = new();
                                    blockInState.Metadata["psychologicalAnalysis"] = analysisDict;
                                    SaveState();

                                    // If public, sync to Supabase pgvector table
                                    if (blockInState.IsPublic)
                                    {
                                        var serializedAnalysis = JsonSerializer.Serialize(analysisDict);
                                        using var analysisDoc = JsonDocument.Parse(serializedAnalysis);
                                        _ = Task.Run(async () => {
                                            await SyncPublicBlockToSupabaseFeedAsync(blockInState, analysisDoc.RootElement);
                                        });
                                    }
                                }
                            }
                        }
                    }
                    finally
                    {
                        lock (_currentlyAnalyzingBlocks)
                        {
                            _currentlyAnalyzingBlocks.Remove(item.Id);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Oasis Diagnostics] Exception in ProcessBlocksPsychologyAndFeedAsync loop: {ex.Message}");
            }
        }

        private async Task<LLMPscyhologyAnalysis?> AnalyzeContentWithLLMAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return null;

            // Normalize text to use as a key
            string cacheKey = text.Trim().ToLowerInvariant().Replace("\r", "").Replace("\n", " ");
            if (_analysisCache.TryGetValue(cacheKey, out var cachedResult))
            {
                Console.WriteLine($"[Oasis Diagnostics] Cache HIT for text hash: {cacheKey.GetHashCode()}. Skipping DeepSeek LLM call.");
                return cachedResult;
            }

            try
            {
                var apiKey = GetResolvedAIKey();
                if (IsPlaceholderOrLegacyKey(apiKey))
                {
                    Console.WriteLine("[Oasis] No valid API Key resolved for LLM analysis.");
                    return null;
                }

                var baseUrl = _config["DeepSeek:BaseUrl"] ?? Environment.GetEnvironmentVariable("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com/chat/completions";
                var modelName = _config["DeepSeek:Model"] ?? Environment.GetEnvironmentVariable("DEEPSEEK_MODEL") ?? "deepseek-chat";

                using var request = new HttpRequestMessage(HttpMethod.Post, baseUrl);
                request.Headers.Add("Authorization", $"Bearer {apiKey}");

                var prompt = @"Analiza el siguiente fragmento (que puede ser íntimo, descriptivo, u obra visual/artística) desde una perspectiva fenomenológica existencial (Dasein) y estética.
Clasifícalo en una de las siguientes Esferas Existenciales (Dasein):
- Umwelt: Relacionado con el cuerpo, entorno físico, naturaleza, sensaciones fisiológicas.
- Mitwelt: Relacionado con lo social, relaciones interpersonales, amor, alteridad, comunicación.
- Eigenwelt: Relacionado con la identidad, el diálogo interno, introspección, autoimagen.
- Überwelt: Relacionado con lo espiritual, el vacío, sentido de la vida, trascendencia.
- Kunstwelt: Relacionado con el arte, la creación pura, estética visual, moda, diseño, objetos creados por el autor, estilo loco o expresión artística.

Clasifícalo también en uno de los Lentes de Percepción:
- Sensorial: Experiencia cruda, texturas, sensaciones físicas, el presente aquí y ahora.
- Analítico: Intelectualización, lógica, racionalización, análisis de causas, fragmentación mental.
- Simbólico: Metáforas, poesía, sueños, imágenes arquetípicas.
- Estético: Apreciación del arte, estilo, forma visual, diseño, vibra, apreciación de objetos estéticos o moda.

Devuelve estrictamente un objeto JSON con dos claves: 'esfera_existencial' (con valor de texto exacto: Umwelt, Mitwelt, Eigenwelt, Überwelt o Kunstwelt) y 'lente_percepcion' (con valor exacto: Sensorial, Analítico, Simbólico o Estético). Ningún otro texto fuera del JSON.";

                var payload = new
                {
                    model = modelName,
                    messages = new[]
                    {
                        new { role = "system", content = "Eres un psicólogo existencial clínico experto en fenomenología. Responde únicamente con JSON." },
                        new { role = "user", content = $"{prompt}\n\nTexto:\n\"\"\"\n{text}\n\"\"\"" }
                    },
                    response_format = new { type = "json_object" },
                    temperature = 0.2
                };

                request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Deepseek LLM call failed: {response.StatusCode} - {err}");
                    return null;
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseBody);
                var choice = doc.RootElement.GetProperty("choices")[0];
                var message = choice.GetProperty("message").GetProperty("content").GetString();

                if (string.IsNullOrEmpty(message)) return null;

                // Strip markdown code block formatting if present
                message = message.Trim();
                if (message.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
                {
                    message = message.Substring(7);
                }
                else if (message.StartsWith("```", StringComparison.OrdinalIgnoreCase))
                {
                    message = message.Substring(3);
                }
                if (message.EndsWith("```"))
                {
                    message = message.Substring(0, message.Length - 3);
                }
                message = message.Trim();

                using var jsonDoc = JsonDocument.Parse(message);
                var root = jsonDoc.RootElement;

                var result = new LLMPscyhologyAnalysis();
                if (root.TryGetProperty("esfera_existencial", out var esferaProp))
                {
                    string esf = esferaProp.GetString() ?? "Eigenwelt";
                    if (esf.Contains("Umwelt", StringComparison.OrdinalIgnoreCase)) result.EsferaExistencial = "Umwelt";
                    else if (esf.Contains("Mitwelt", StringComparison.OrdinalIgnoreCase)) result.EsferaExistencial = "Mitwelt";
                    else if (esf.Contains("Eigenwelt", StringComparison.OrdinalIgnoreCase)) result.EsferaExistencial = "Eigenwelt";
                    else if (esf.Contains("Überwelt", StringComparison.OrdinalIgnoreCase) || esf.Contains("Uberwelt", StringComparison.OrdinalIgnoreCase)) result.EsferaExistencial = "Überwelt";
                    else if (esf.Contains("Kunstwelt", StringComparison.OrdinalIgnoreCase)) result.EsferaExistencial = "Kunstwelt";
                }
                
                if (root.TryGetProperty("lente_percepcion", out var lenteProp))
                {
                    string len = lenteProp.GetString() ?? "Analítico";
                    if (len.Contains("Sensorial", StringComparison.OrdinalIgnoreCase)) result.LentePercepcion = "Sensorial";
                    else if (len.Contains("Analítico", StringComparison.OrdinalIgnoreCase) || len.Contains("Analitico", StringComparison.OrdinalIgnoreCase)) result.LentePercepcion = "Analítico";
                    else if (len.Contains("Simbólico", StringComparison.OrdinalIgnoreCase) || len.Contains("Simbolico", StringComparison.OrdinalIgnoreCase)) result.LentePercepcion = "Simbólico";
                    else if (len.Contains("Estético", StringComparison.OrdinalIgnoreCase) || len.Contains("Estetico", StringComparison.OrdinalIgnoreCase)) result.LentePercepcion = "Estético";
                }

                // Cache the successful result
                _analysisCache[cacheKey] = result;

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in AnalyzeContentWithLLM: {ex.Message}");
                return null;
            }
        }

        private async Task<float[]> GetEmbeddingAsync(string text)
        {
            try
            {
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(5));
                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2");
                
                var hfKey = _config["HuggingFace:Key"] ?? Environment.GetEnvironmentVariable("HUGGINGFACE_TOKEN");
                if (!string.IsNullOrEmpty(hfKey))
                {
                    request.Headers.Add("Authorization", $"Bearer {hfKey.Trim()}");
                }

                var payload = new { inputs = text };
                request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request, cts.Token);
                if (response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    var vector = JsonSerializer.Deserialize<float[]>(body);
                    if (vector != null && vector.Length == 384)
                    {
                        return vector;
                    }
                }
                else
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Hugging Face HTTP {response.StatusCode}: {err}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hugging Face embedding request failed, using semantic fallback: {ex.Message}");
            }

            return GenerateSemanticFallbackVector(text);
        }

        private static LLMPscyhologyAnalysis GenerateSemanticFallbackPsychology(string text)
        {
            var result = new LLMPscyhologyAnalysis { EsferaExistencial = "Eigenwelt", LentePercepcion = "Analítico" };
            if (string.IsNullOrEmpty(text)) return result;

            var lower = text.ToLowerInvariant();
            
            if (lower.Contains("sociedad") || lower.Contains("gente") || lower.Contains("amigo") || lower.Contains("amor") || lower.Contains("reunion"))
                result.EsferaExistencial = "Mitwelt";
            else if (lower.Contains("cuerpo") || lower.Contains("dolor") || lower.Contains("respirar") || lower.Contains("tacto") || lower.Contains("dormir"))
                result.EsferaExistencial = "Umwelt";
            else if (lower.Contains("universo") || lower.Contains("dios") || lower.Contains("vacio") || lower.Contains("muerte") || lower.Contains("trascender"))
                result.EsferaExistencial = "Überwelt";
            else if (lower.Contains("arte") || lower.Contains("diseño") || lower.Contains("estetica") || lower.Contains("ropa") || lower.Contains("crear"))
                result.EsferaExistencial = "Kunstwelt";

            if (lower.Contains("sentí") || lower.Contains("textura") || lower.Contains("frio") || lower.Contains("calor") || lower.Contains("ver"))
                result.LentePercepcion = "Sensorial";
            else if (lower.Contains("significa") || lower.Contains("metafora") || lower.Contains("sueño") || lower.Contains("arquetipo") || lower.Contains("simbolo"))
                result.LentePercepcion = "Simbólico";
            else if (lower.Contains("color") || lower.Contains("forma") || lower.Contains("hermoso") || lower.Contains("estilo") || lower.Contains("visual"))
                result.LentePercepcion = "Estético";

            return result;
        }

        private static float[] GenerateSemanticFallbackVector(string text)
        {
            var vector = new float[384];
            if (string.IsNullOrEmpty(text)) return vector;

            var words = text.ToLower().Split(new[] { ' ', '.', ',', ';', '?', '!', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            
            // Somatic/Physical (Umwelt) keywords
            var umweltKeys = new HashSet<string> { "cuerpo", "dolor", "sentir", "piel", "olor", "ver", "oir", "fresco", "calor", "tocar", "respirar", "cansado", "sangre", "hueso", "enfermo", "comer", "dormir", "tacto" };
            // Social/Interpersonal (Mitwelt) keywords
            var mitweltKeys = new HashSet<string> { "amigo", "mama", "papa", "pareja", "amor", "gente", "persona", "hablar", "mirar", "otro", "nosotros", "conversar", "familia", "reunion", "grupo", "sociedad" };
            // Identity/Internal (Eigenwelt) keywords
            var eigenweltKeys = new HashSet<string> { "yo", "mi", "mente", "pensar", "dudar", "creo", "soy", "miedo", "triste", "feliz", "deseo", "interior", "conciencia", "analizar", "decidir" };
            // Existential/Spiritual (Überwelt) keywords
            var uberweltKeys = new HashSet<string> { "vacio", "muerte", "fin", "nada", "dios", "alma", "buscar", "sentido", "universo", "trascender", "infinito", "destino", "tiempo", "eternidad", "existencia" };
            // Art/Aesthetic (Kunstwelt) keywords
            var kunstweltKeys = new HashSet<string> { "arte", "crear", "diseño", "estilo", "color", "dibujo", "pintura", "foto", "ropa", "tenis", "moda", "estético", "visual", "música", "obra", "proyecto", "loco", "creativo", "inspiración" };

            foreach (var word in words)
            {
                int hashIdx = Math.Abs(word.GetHashCode()) % 384;
                vector[hashIdx] += 1.0f;

                if (umweltKeys.Contains(word))
                {
                    int idx = Math.Abs(word.GetHashCode()) % 96;
                    vector[idx] += 3.0f;
                }
                else if (mitweltKeys.Contains(word))
                {
                    int idx = 96 + (Math.Abs(word.GetHashCode()) % 96);
                    vector[idx] += 3.0f;
                }
                else if (eigenweltKeys.Contains(word))
                {
                    int idx = 192 + (Math.Abs(word.GetHashCode()) % 96);
                    vector[idx] += 3.0f;
                }
                else if (uberweltKeys.Contains(word))
                {
                    int idx = 288 + (Math.Abs(word.GetHashCode()) % 48); // Shrink to 48 spaces
                    vector[idx] += 3.0f;
                }
                else if (kunstweltKeys.Contains(word))
                {
                    int idx = 336 + (Math.Abs(word.GetHashCode()) % 48); // Use remaining 48 spaces
                    vector[idx] += 3.0f;
                }
            }

            double sumSq = 0;
            for (int i = 0; i < 384; i++) sumSq += vector[i] * vector[i];
            
            float norm = (float)Math.Sqrt(sumSq);
            if (norm > 0)
            {
                for (int i = 0; i < 384; i++) vector[i] /= norm;
            }

            return vector;
        }

        private async Task SyncPublicBlockToSupabaseFeedAsync(Block block, JsonElement analysis)
        {
            try
            {
                var supabaseUrl = _config["Supabase:Url"] ?? _config["Supabase__Url"] ?? _config["Supabase_Url"] ?? _config["SUPABASE_URL"];
                var supabaseKey = _config["Supabase:Key"] ?? _config["Supabase__Key"] ?? _config["Supabase_Key"] ?? _config["SUPABASE_KEY"];
                if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey)) return;

                string esfera = analysis.TryGetProperty("esfera_existencial", out var esfProp) ? esfProp.GetString() ?? "Eigenwelt" : "Eigenwelt";
                string lente = analysis.TryGetProperty("lente_percepcion", out var lenProp) ? lenProp.GetString() ?? "Analítico" : "Analítico";
                
                float[] embedding = Array.Empty<float>();
                if (analysis.TryGetProperty("embedding", out var embProp))
                {
                    embedding = JsonSerializer.Deserialize<float[]>(embProp.GetRawText()) ?? Array.Empty<float>();
                }

                var checkUrl = $"{supabaseUrl.TrimEnd('/')}/rest/v1/oasis_feed?id=eq.{block.Id}";
                using var checkRequest = new HttpRequestMessage(HttpMethod.Get, checkUrl);
                checkRequest.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                checkRequest.Headers.Add("apikey", supabaseKey);
                
                var checkResponse = await _httpClient.SendAsync(checkRequest);
                bool exists = false;
                if (checkResponse.IsSuccessStatusCode)
                {
                    var responseBody = await checkResponse.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseBody);
                    exists = doc.RootElement.GetArrayLength() > 0;
                }

                var payload = new Dictionary<string, object>
                {
                    { "id", block.Id },
                    { "username", block.Username ?? string.Empty },
                    { "content", block.Content ?? string.Empty },
                    { "caption", block.Caption ?? string.Empty },
                    { "type", block.Type ?? string.Empty },
                    { "color", block.Color ?? string.Empty },
                    { "esfera_existencial", esfera },
                    { "lente_percepcion", lente },
                    { "embedding", embedding },
                    { "metadata", block.Metadata ?? new() }
                };

                using var request = new HttpRequestMessage(
                    exists ? HttpMethod.Patch : HttpMethod.Post,
                    exists ? checkUrl : $"{supabaseUrl.TrimEnd('/')}/rest/v1/oasis_feed"
                );
                request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                request.Headers.Add("apikey", supabaseKey);
                if (!exists)
                {
                    request.Headers.Add("Prefer", "resolution=merge-duplicates");
                }
                request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error syncing block to oasis_feed in Supabase: {response.StatusCode} - {err}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in SyncPublicBlockToSupabaseFeed: {ex.Message}");
            }
        }

        private async Task DeletePublicBlockFromSupabaseFeedAsync(string blockId)
        {
            try {
                var supabaseUrl = _config["Supabase:Url"] ?? _config["Supabase__Url"] ?? _config["Supabase_Url"] ?? _config["SUPABASE_URL"];
                var supabaseKey = _config["Supabase:Key"] ?? _config["Supabase__Key"] ?? _config["Supabase_Key"] ?? _config["SUPABASE_KEY"];
                if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey)) return;

                var deleteUrl = $"{supabaseUrl.TrimEnd('/')}/rest/v1/oasis_feed?id=eq.{blockId}";
                using var request = new HttpRequestMessage(HttpMethod.Delete, deleteUrl);
                request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                request.Headers.Add("apikey", supabaseKey);

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error deleting from oasis_feed: {response.StatusCode} - {err}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in DeletePublicBlockFromSupabaseFeed: {ex.Message}");
            }
        }

        [HttpGet("santuario")]
        public ActionResult<List<Block>> GetSantuario([FromQuery] string user)
        {
             var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
             if (u == null) return new List<Block>();
             return u.Blocks.Where(b => b.IsPublic).ToList();
        }

        [HttpGet("resonances")]
        public ActionResult<List<Resonance>> GetResonances() => _state.Resonances;

        [HttpGet("playlists")]
        public ActionResult<Dictionary<string, List<TrackItem>>> GetPlaylists([FromQuery] string user)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Playlists : new Dictionary<string, List<TrackItem>>();
        }

        [HttpPost("playlists")]
        public IActionResult UpdatePlaylists([FromQuery] string user, [FromBody] Dictionary<string, List<TrackItem>> playlists)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.Playlists = playlists;
            SaveState();
            return Ok();
        }

        [HttpGet("playback")]
        public ActionResult<PlaybackState> GetPlayback([FromQuery] string user)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.LastPlayback : new PlaybackState();
        }

        [HttpPost("playback")]
        public IActionResult UpdatePlayback([FromQuery] string user, [FromBody] PlaybackState state)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.LastPlayback = state;
            u.LastPlayback.LastUpdated = DateTime.UtcNow;
            SaveState();
            return Ok();
        }

        [HttpGet("conversations")]
        public ActionResult<List<Conversation>> GetConversations([FromQuery] string user)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Conversations : new List<Conversation>();
        }

        [HttpPost("conversations")]
        public IActionResult UpdateConversations([FromQuery] string user, [FromBody] List<Conversation> conversations)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            
            Console.WriteLine($"Oasis: Recibidas {conversations.Count} conversaciones para {user}.");
            foreach(var c in conversations.Take(3)) {
                Console.WriteLine($"  - Chat [{c.Id.Substring(0, Math.Min(8, c.Id.Length))}]: {c.Title}");
            }

            u.Conversations = conversations;
            SaveState();
            return Ok();
        }

        [HttpGet("folders")]
        public ActionResult<List<Folder>> GetFolders([FromQuery] string user)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Folders : new List<Folder>();
        }

        [HttpPost("folders")]
        public IActionResult UpdateFolders([FromQuery] string user, [FromBody] List<Folder> folders)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.Folders = folders;
            SaveState();
            return Ok();
        }

        [HttpGet("memory")]
        public ActionResult<string> GetMemory([FromQuery] string user)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.ContinuousMemory : string.Empty;
        }

        [HttpPost("memory")]
        public IActionResult UpdateMemory([FromQuery] string user, [FromBody] MemoryUpdate update)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.ContinuousMemory = update?.Memory ?? string.Empty;
            SaveState();
            return Ok();
        }

        [HttpGet("clinical-data")]
        public ActionResult<Dictionary<string, string>> GetClinicalData([FromQuery] string user)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return new Dictionary<string, string>();

            string caller = GetAuthenticatedUser();
            var filtered = new Dictionary<string, string>();
            foreach (var kvp in u.ClinicalData)
            {
                if (IsKeyForUser(kvp.Key, user))
                {
                    if (!caller.Equals("observador1", StringComparison.OrdinalIgnoreCase))
                    {
                        if (kvp.Key.StartsWith("oasis_clinician_notes_", StringComparison.OrdinalIgnoreCase) ||
                            kvp.Key.StartsWith("oasis_private_notes_", StringComparison.OrdinalIgnoreCase) ||
                            kvp.Key.StartsWith("oasis_patient_status_", StringComparison.OrdinalIgnoreCase))
                        {
                            continue;
                        }
                    }
                    filtered[kvp.Key] = kvp.Value;
                }
            }
            return filtered;
        }

        private static readonly Dictionary<int, string> IcarCorrectAnswers = new()
        {
            { 1, "D" }, { 2, "C" }, { 3, "D" }, { 4, "G" }, { 5, "D" }, { 6, "D" },
            { 7, "D" }, { 8, "D" }, { 9, "C" }, { 10, "F" }, { 11, "E" }, { 12, "B" },
            { 13, "D" }, { 14, "F" }, { 15, "C" }, { 16, "D" }
        };

        [HttpPost("clinical-data")]
        public IActionResult UpdateClinicalData([FromQuery] string user, [FromBody] Dictionary<string, string> data)
        {
            if (!IsCallerAuthorized(user)) return StatusCode(403, "No autorizado.");
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            
            string caller = GetAuthenticatedUser();
            if (data != null)
            {
                foreach (var kvp in data)
                {
                    if (IsKeyForUser(kvp.Key, user))
                    {
                        if (!caller.Equals("observador1", StringComparison.OrdinalIgnoreCase))
                        {
                            if (kvp.Key.StartsWith("oasis_clinician_notes_", StringComparison.OrdinalIgnoreCase) ||
                                kvp.Key.StartsWith("oasis_private_notes_", StringComparison.OrdinalIgnoreCase) ||
                                kvp.Key.StartsWith("oasis_patient_status_", StringComparison.OrdinalIgnoreCase))
                            {
                                continue;
                            }
                        }
                        u.ClinicalData[kvp.Key] = kvp.Value;
                    }
                }
                SaveState();

                // Trigger background sync task to Supabase
                _ = Task.Run(async () =>
                {
                    foreach (var key in data.Keys)
                    {
                        if (key.StartsWith("oasis_pid_answers_") || key.StartsWith("oasis_phenom_qualitative_"))
                        {
                            string suffix = "";
                            string prefix = key.StartsWith("oasis_pid_answers_") ? $"oasis_pid_answers_{user}" : $"oasis_phenom_qualitative_{user}";
                            if (key.Length > prefix.Length)
                            {
                                suffix = key.Substring(prefix.Length);
                            }
                            await SyncExistencialTestToSupabase(user, suffix);
                        }
                        else if (key.StartsWith("oasis_icar_answers_") || key.StartsWith("oasis_icar_dwell_") || key.StartsWith("oasis_icar_changes_"))
                        {
                            string suffix = "";
                            string prefix = "";
                            if (key.StartsWith("oasis_icar_answers_")) prefix = $"oasis_icar_answers_{user}";
                            else if (key.StartsWith("oasis_icar_dwell_")) prefix = $"oasis_icar_dwell_{user}";
                            else if (key.StartsWith("oasis_icar_changes_")) prefix = $"oasis_icar_changes_{user}";

                            if (key.Length > prefix.Length)
                            {
                                suffix = key.Substring(prefix.Length);
                            }
                            await SyncIcarTestToSupabase(user, suffix);
                        }
                    }
                });
            }
            return Ok();
        }

        private async Task SyncExistencialTestToSupabase(string username, string suffix)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == username);
            if (u == null) return;

            string pidKey = $"oasis_pid_answers_{username}{suffix}";
            string phenomKey = $"oasis_phenom_qualitative_{username}{suffix}";

            if (!u.ClinicalData.TryGetValue(pidKey, out var pidAnswersJson) ||
                !u.ClinicalData.TryGetValue(phenomKey, out var phenomQualJson))
            {
                return;
            }

            try
            {
                var enableSyncStr = _config["Supabase:EnableSync"] ?? Environment.GetEnvironmentVariable("SUPABASE_ENABLE_SYNC");
                bool enableSync = enableSyncStr == "true";
                if (!enableSync) return;

                var supabaseUrl = _config["Supabase:Url"];
                var supabaseKey = _config["Supabase:Key"];
                if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey)) return;

                var pidAnswers = JsonSerializer.Deserialize<Dictionary<string, string>>(pidAnswersJson);
                if (pidAnswers == null) return;

                int afectividadNegativa = 0;
                int desapego = 0;
                int antagonismo = 0;
                int desinhibicion = 0;
                int psicoticismo = 0;

                for (int i = 1; i <= 25; i++)
                {
                    if (pidAnswers.TryGetValue(i.ToString(), out var valStr) && int.TryParse(valStr, out var val))
                    {
                        if (i <= 5) afectividadNegativa += val;
                        else if (i <= 10) desapego += val;
                        else if (i <= 15) antagonismo += val;
                        else if (i <= 20) desinhibicion += val;
                        else psicoticismo += val;
                    }
                }

                string dominantDomain = "Desapego";
                int maxVal = -1;

                var scores = new Dictionary<string, int>
                {
                    { "AfectividadNegativa", afectividadNegativa },
                    { "Desapego", desapego },
                    { "Antagonismo", antagonismo },
                    { "Desinhibicion", desinhibicion },
                    { "Psicoticismo", psicoticismo }
                };

                foreach (var kvp in scores)
                {
                    if (kvp.Value > maxVal)
                    {
                        maxVal = kvp.Value;
                        dominantDomain = kvp.Key;
                    }
                }

                string arquetipoDominante = "El Observador Analítico";
                if (dominantDomain == "AfectividadNegativa") arquetipoDominante = "El Buscador de Fusión";
                else if (dominantDomain == "Desapego") arquetipoDominante = "El Observador Analítico";
                else if (dominantDomain == "Antagonismo" || dominantDomain == "Psicoticismo") arquetipoDominante = "El Arquitecto del Control";
                else if (dominantDomain == "Desinhibicion") arquetipoDominante = "El Creador Errante";

                var phenomQual = JsonSerializer.Deserialize<Dictionary<string, string>>(phenomQualJson);
                string antecedentes = phenomQual != null && phenomQual.TryGetValue("antecedentes_origen", out var a) ? a : "";
                string insuficiencia = phenomQual != null && phenomQual.TryGetValue("experiencia_insuficiencia", out var ins) ? ins : "";
                string temporalidad = phenomQual != null && phenomQual.TryGetValue("temporalidad_vivida", out var t) ? t : "";
                string premisa = phenomQual != null && phenomQual.TryGetValue("premisa_realidad", out var p) ? p : "";

                string dbUsername = string.IsNullOrEmpty(suffix) ? username : $"{username}{suffix}";

                var queryUrl = $"{supabaseUrl.TrimEnd('/')}/rest/v1/test_existencial_respuestas?username=eq.{dbUsername}";
                using var checkRequest = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                checkRequest.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                checkRequest.Headers.Add("apikey", supabaseKey);
                var checkResponse = await _httpClient.SendAsync(checkRequest);
                bool exists = false;
                if (checkResponse.IsSuccessStatusCode)
                {
                    var responseBody = await checkResponse.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseBody);
                    exists = doc.RootElement.GetArrayLength() > 0;
                }

                var payload = new Dictionary<string, object>
                {
                    { "username", dbUsername },
                    { "antecedentes_origen", antecedentes },
                    { "experiencia_insuficiencia", insuficiencia },
                    { "temporalidad_vivida", temporalidad },
                    { "premisa_realidad", premisa },
                    { "pid_answers", pidAnswers },
                    { "pid_afectividad_negativa", afectividadNegativa },
                    { "pid_desapego", desapego },
                    { "pid_antagonismo", antagonismo },
                    { "pid_desinhibicion", desinhibicion },
                    { "pid_psicoticismo", psicoticismo },
                    { "arquetipo_dominante", arquetipoDominante }
                };

                var jsonPayload = JsonSerializer.Serialize(payload);

                using var request = new HttpRequestMessage(
                    exists ? HttpMethod.Patch : HttpMethod.Post, 
                    exists ? queryUrl : $"{supabaseUrl.TrimEnd('/')}/rest/v1/test_existencial_respuestas"
                );
                request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                request.Headers.Add("apikey", supabaseKey);
                request.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error syncing Existencial to Supabase: {response.StatusCode} - {err}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in SyncExistencialTestToSupabase: {ex.Message}");
            }
        }

        private async Task SyncIcarTestToSupabase(string username, string suffix)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == username);
            if (u == null) return;

            string answersKey = $"oasis_icar_answers_{username}{suffix}";
            string dwellKey = $"oasis_icar_dwell_{username}{suffix}";
            string changesKey = $"oasis_icar_changes_{username}{suffix}";

            if (!u.ClinicalData.TryGetValue(answersKey, out var answersJson) ||
                !u.ClinicalData.TryGetValue(dwellKey, out var dwellJson) ||
                !u.ClinicalData.TryGetValue(changesKey, out var changesJson))
            {
                return;
            }

            try
            {
                var enableSyncStr = _config["Supabase:EnableSync"] ?? Environment.GetEnvironmentVariable("SUPABASE_ENABLE_SYNC");
                bool enableSync = enableSyncStr == "true";
                if (!enableSync) return;

                var supabaseUrl = _config["Supabase:Url"];
                var supabaseKey = _config["Supabase:Key"];
                if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey)) return;

                var answers = JsonSerializer.Deserialize<Dictionary<string, string>>(answersJson);
                if (answers == null) return;

                var dwells = JsonSerializer.Deserialize<Dictionary<string, double>>(dwellJson) ?? new Dictionary<string, double>();
                var changes = JsonSerializer.Deserialize<Dictionary<string, int>>(changesJson) ?? new Dictionary<string, int>();

                int score = 0;
                foreach (var kvp in IcarCorrectAnswers)
                {
                    if (answers.TryGetValue(kvp.Key.ToString(), out var ans) && ans == kvp.Value)
                    {
                        score++;
                    }
                }

                double dwellSum = 0;
                int dwellCount = 0;
                foreach (var d in dwells.Values)
                {
                    if (d > 0)
                    {
                        dwellSum += d;
                        dwellCount++;
                    }
                }
                double dwellAvgSec = dwellCount > 0 ? Math.Round(dwellSum / dwellCount, 2) : 0;

                int totalChanges = 0;
                foreach (var c in changes.Values)
                {
                    totalChanges += c;
                }

                string dbUsername = string.IsNullOrEmpty(suffix) ? username : $"{username}{suffix}";

                var queryUrl = $"{supabaseUrl.TrimEnd('/')}/rest/v1/test_icar16_respuestas?username=eq.{dbUsername}";
                using var checkRequest = new HttpRequestMessage(HttpMethod.Get, queryUrl);
                checkRequest.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                checkRequest.Headers.Add("apikey", supabaseKey);
                var checkResponse = await _httpClient.SendAsync(checkRequest);
                bool exists = false;
                if (checkResponse.IsSuccessStatusCode)
                {
                    var responseBody = await checkResponse.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseBody);
                    exists = doc.RootElement.GetArrayLength() > 0;
                }

                var payload = new Dictionary<string, object>
                {
                    { "username", dbUsername },
                    { "respuestas", answers },
                    { "dwell_times", dwells },
                    { "cambios_de_opinion", changes },
                    { "score", score },
                    { "dwell_time_avg_sec", dwellAvgSec },
                    { "total_cambios_opinion", totalChanges }
                };

                var jsonPayload = JsonSerializer.Serialize(payload);

                using var request = new HttpRequestMessage(
                    exists ? HttpMethod.Patch : HttpMethod.Post, 
                    exists ? queryUrl : $"{supabaseUrl.TrimEnd('/')}/rest/v1/test_icar16_respuestas"
                );
                request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                request.Headers.Add("apikey", supabaseKey);
                request.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Error syncing ICAR16 to Supabase: {response.StatusCode} - {err}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in SyncIcarTestToSupabase: {ex.Message}");
            }
        }

        [HttpPost("upload")]
        [DisableRequestSizeLimit]
        [RequestFormLimits(MultipartBodyLengthLimit = int.MaxValue, ValueLengthLimit = int.MaxValue)]
        public async Task<IActionResult> UploadAsset(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No se proporcionó ningún archivo.");

            try
            {
                var firebaseDbUrl = _config["Firebase:DbUrl"] ?? Environment.GetEnvironmentVariable("FIREBASE_DB_URL") ?? "https://oasiis-d43e3-default-rtdb.firebaseio.com/";
                var firebaseBucket = _config["Firebase:StorageBucket"] ?? Environment.GetEnvironmentVariable("FIREBASE_STORAGE_BUCKET") ?? "oasiis-d43e3.firebasestorage.app";

                if (string.IsNullOrEmpty(firebaseBucket) && !string.IsNullOrEmpty(firebaseDbUrl))
                {
                    // Intentar deducir el bucket desde la URL de la DB
                    var host = new Uri(firebaseDbUrl).Host;
                    if (host.Contains("-default-rtdb"))
                    {
                        firebaseBucket = host.Split("-default-rtdb")[0] + ".appspot.com";
                    }
                }

                if (string.IsNullOrEmpty(firebaseBucket))
                {
                    return await SaveLocalFile(file);
                }

                var ext = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(ext) || ext == ".")
                {
                    var ct = file.ContentType?.ToLower() ?? "";
                    if (ct.Contains("video/mp4")) ext = ".mp4";
                    else if (ct.Contains("video/webm")) ext = ".webm";
                    else if (ct.Contains("video/quicktime")) ext = ".mov";
                    else if (ct.Contains("image/jpeg")) ext = ".jpg";
                    else if (ct.Contains("image/png")) ext = ".png";
                    else if (ct.Contains("audio/")) ext = ".webm"; // Browsers often record audio as webm
                }

                var fileName = $"{Guid.NewGuid()}{ext}";
                
                // URL de la REST API de Firebase Storage
                var uploadUrl = $"https://firebasestorage.googleapis.com/v0/b/{firebaseBucket}/o?name={fileName}";

                using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
                
                using var stream = file.OpenReadStream();
                using var content = new StreamContent(stream);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
                request.Content = content;

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseJson);
                    var downloadToken = doc.RootElement.GetProperty("downloadTokens").GetString();
                    
                    // Construir la URL pública de descarga de Firebase
                    var publicUrl = $"https://firebasestorage.googleapis.com/v0/b/{firebaseBucket}/o/{fileName}?alt=media&token={downloadToken}";
                    return Ok(new { url = publicUrl });
                }
                else
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Firebase Storage upload error: {response.StatusCode} - {errorMsg}");
                    return await SaveLocalFile(file);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception uploading to Supabase: {ex.Message}");
                return await SaveLocalFile(file);
            }
        }

        private async Task<IActionResult> SaveLocalFile(IFormFile file)
        {
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext) || ext == ".")
            {
                var ct = file.ContentType?.ToLower() ?? "";
                if (ct.Contains("video/mp4")) ext = ".mp4";
                else if (ct.Contains("video/webm")) ext = ".webm";
                else if (ct.Contains("video/quicktime")) ext = ".mov";
                else if (ct.Contains("image/jpeg")) ext = ".jpg";
                else if (ct.Contains("image/png")) ext = ".png";
                else if (ct.Contains("audio/")) ext = ".webm";
            }

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return absolute URL so frontend can use it directly regardless of Supabase config
            return Ok(new { url = $"/uploads/{fileName}" });
        }

        [HttpPost("resonances")]
        public IActionResult AddResonance([FromBody] Resonance res)
        {
            _state.Resonances.Add(res);
            SaveState();
            return Ok();
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchWeb([FromQuery] string q)
        {
            if (string.IsNullOrEmpty(q)) return BadRequest();
            try {
                using var client = new System.Net.Http.HttpClient();
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                
                var searchUrl = $"https://html.duckduckgo.com/html/?q={Uri.EscapeDataString(q)}";
                var response = await client.GetAsync(searchUrl);
                if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Search failed");

                var html = await response.Content.ReadAsStringAsync();
                var results = new List<string>();

                var matches = Regex.Matches(html, @"class=""result__snippet""[^>]*>(.*?)</a>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                
                foreach (Match match in matches)
                {
                    var snippet = Regex.Replace(match.Groups[1].Value, "<.*?>", "").Trim();
                    snippet = System.Net.WebUtility.HtmlDecode(snippet);
                    if (!string.IsNullOrEmpty(snippet))
                    {
                        results.Add(snippet);
                        if (results.Count >= 5) break;
                    }
                }

                return Ok(results);
            } catch (Exception ex) {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // --- YOUTUBE PROXY & CACHE ---

        [HttpGet("youtube/search")]
        public async Task<IActionResult> SearchYouTube([FromQuery] string q)
        {
            if (string.IsNullOrEmpty(q)) return BadRequest();

            // 1. Check Search Cache (Temporarily disabled to force rich data population)
            /* 
            var cached = _state.SearchCache.FirstOrDefault(s => s.Query.ToLower() == q.ToLower());
            if (cached != null && (DateTime.UtcNow - cached.Timestamp).TotalHours < 24)
            {
                return Ok(new { source = "cache", items = new List<object>() }); // Forces refetch for rich data
            }
            */

            // 2. Call YouTube API
            try {
                // Enhance query to avoid "type beats" and low-quality instrumental loops
                string enhancedQuery = q;
                if (!q.ToLower().Contains("type beat") && !q.ToLower().Contains("instrumental")) {
                    enhancedQuery += " -\"type beat\" -\"free type\" -\"instrumental\" -\"karaoke\" -\"loop\"";
                }

                // 2. Call YouTube API
                using var client = new System.Net.Http.HttpClient();
                // We fetch both videos and playlists to give a "YouTube Music" feel
                var url = $"https://www.googleapis.com/youtube/v3/search?part=snippet&q={Uri.EscapeDataString(enhancedQuery)}&type=video,playlist&maxResults=15&key={YOUTUBE_API_KEY}";
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Fallo al contactar YouTube API");

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var items = doc.RootElement.GetProperty("items");
                
                var searchResults = items.EnumerateArray()
                    .Select(i => {
                        var idProps = i.GetProperty("id");
                        string vId = idProps.TryGetProperty("videoId", out var vid) ? vid.GetString() : null;
                        string pId = idProps.TryGetProperty("playlistId", out var pid) ? pid.GetString() : null;
                        
                        return new TrackItem {
                            VideoId = vId ?? "",
                            PlaylistId = pId ?? "",
                            Type = vId != null ? "video" : (pId != null ? "playlist" : "other"),
                            Title = i.GetProperty("snippet").GetProperty("title").GetString(),
                            Artist = i.GetProperty("snippet").GetProperty("channelTitle").GetString(),
                            Thumbnail = i.GetProperty("snippet").GetProperty("thumbnails").GetProperty("default").GetProperty("url").GetString()
                        };
                    })
                    .Where(r => r.Type != "other")
                    .ToList();

                // Enhance playlists with itemCount
                var playlistIds = searchResults.Where(i => i.Type == "playlist").Select(i => i.PlaylistId).ToList();
                if (playlistIds.Any())
                {
                    var playlistUrl = $"https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id={string.Join(",", playlistIds)}&key={YOUTUBE_API_KEY}";
                    var playlistRes = await client.GetAsync(playlistUrl);
                    if (playlistRes.IsSuccessStatusCode)
                    {
                        var pJson = await playlistRes.Content.ReadAsStringAsync();
                        using var pDoc = JsonDocument.Parse(pJson);
                        var pItems = pDoc.RootElement.GetProperty("items");
                        foreach (var pItem in pItems.EnumerateArray())
                        {
                            var pId = pItem.GetProperty("id").GetString();
                            var count = pItem.GetProperty("contentDetails").GetProperty("itemCount").GetInt32();
                            var match = searchResults.FirstOrDefault(r => r.PlaylistId == pId);
                            if (match != null) 
                            {
                                match.VideoCount = count;
                            }
                        }
                    }
                }

                return Ok(searchResults);
            } catch (Exception ex) {
                return StatusCode(500, $"Error de Conexión: {ex.Message}");
            }
        }

        [HttpGet("youtube/track/{id}")]
        public async Task<IActionResult> GetTrackDetails(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest();

            // 1. Check Fingerprints
            var fingerprint = _state.TrackFingerprints.FirstOrDefault(f => f.VideoId == id);
            if (fingerprint != null)
            {
                return Ok(new { source = "fingerprint", data = fingerprint });
            }

            // 2. Call YouTube API (videos.list is cheaper than search)
            try {
                using var client = new System.Net.Http.HttpClient();
                var url = $"https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id={id}&key={YOUTUBE_API_KEY}";
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Fallo al obtener detalles del video");

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var items = doc.RootElement.GetProperty("items");
                if (items.GetArrayLength() == 0) return NotFound("Video no encontrado");

                var item = items[0];
                var snippet = item.GetProperty("snippet");
                
                var newFingerprint = new TrackFingerprint {
                    VideoId = id,
                    Title = snippet.GetProperty("title").GetString() ?? "Sin Título",
                    Artist = snippet.GetProperty("channelTitle").GetString() ?? "Artista Desconocido",
                    Duration = item.GetProperty("contentDetails").GetProperty("duration").GetString() ?? "0:00",
                    Tags = snippet.TryGetProperty("tags", out var tags) ? tags.EnumerateArray().Select(t => t.GetString()).ToList() : new List<string>(),
                    LastUpdated = DateTime.UtcNow
                };

                // 3. Save Fingerprint
                _state.TrackFingerprints.Add(newFingerprint);
                SaveState();

                return Ok(new { source = "api", data = newFingerprint });
            } catch (Exception ex) {
                return StatusCode(500, $"Error en Fingerprinting: {ex.Message}");
            }
        }

        [HttpGet("youtube/stream/{id}")]
        public async Task<IActionResult> GetAudioStream(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest();

            try
            {
                var cacheDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "cache");
                if (!Directory.Exists(cacheDir)) Directory.CreateDirectory(cacheDir);

                var youtube = new YoutubeClient();
                var streamManifest = await youtube.Videos.Streams.GetManifestAsync(id);
                
                // Try Muxed (Video + Audio) first for "Video Mode", fallback to AudioOnly
                var streamInfo = streamManifest.GetAudioOnlyStreams().GetWithHighestBitrate();

                if (streamInfo == null) return NotFound("No media stream found for this video.");

                var ext = streamInfo is MuxedStreamInfo ? "mp4" : "mp3";
                var localFileName = $"{id}.{ext}";
                var localPath = Path.Combine(cacheDir, localFileName);
                var relativeUrl = $"/cache/{localFileName}";

                // 1. Check if already cached locally
                if (System.IO.File.Exists(localPath))
                {
                    return Ok(new { source = "local", url = relativeUrl, cached = true });
                }

                // 2. Fire and Forget background download for caching
                _ = Task.Run(async () => {
                    try {
                        using var client = new System.Net.Http.HttpClient();
                        var stream = await youtube.Videos.Streams.GetAsync(streamInfo);
                        using (var fileStream = System.IO.File.Create(localPath))
                        {
                            await stream.CopyToAsync(fileStream);
                        }
                        
                        // Update Fingerprint
                        var fingerprint = _state.TrackFingerprints.FirstOrDefault(f => f.VideoId == id);
                        if (fingerprint != null)
                        {
                            fingerprint.IsLocalCached = true;
                            fingerprint.LocalPath = relativeUrl;
                            SaveState();
                        }
                    } catch (Exception ex) {
                        Console.WriteLine($"Oasis Cache Error ({id}): {ex.Message}");
                    }
                });

                // Return remote stream URL immediately for instant playback
                return Ok(new { source = "youtube_direct", url = streamInfo.Url, cached = false });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error de Streaming: {ex.Message}");
            }
        }

        [HttpGet("youtube/playlist/{id}")]
        public async Task<IActionResult> GetPlaylistItems(string id)
        {
            if (string.IsNullOrEmpty(id)) return BadRequest();

            try {
                using var client = new System.Net.Http.HttpClient();
                // Fetch first 50 items from the playlist
                var url = $"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId={id}&maxResults=50&key={YOUTUBE_API_KEY}";
                var response = await client.GetAsync(url);
                if (!response.IsSuccessStatusCode) return StatusCode((int)response.StatusCode, "Fallo al obtener items de la playlist");

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var items = doc.RootElement.GetProperty("items");
                
                var trackItems = items.EnumerateArray()
                    .Select(i => {
                        var snippet = i.GetProperty("snippet");
                        var vId = i.GetProperty("contentDetails").GetProperty("videoId").GetString();
                        
                        return new TrackItem {
                            VideoId = vId ?? "",
                            Type = "video",
                            Title = snippet.TryGetProperty("title", out var titleProp) ? titleProp.GetString() : "Sin Título",
                            Artist = snippet.TryGetProperty("videoOwnerChannelTitle", out var vot) ? vot.GetString() : (snippet.TryGetProperty("channelTitle", out var ct) ? ct.GetString() : "Artista Desconocido"),
                            Thumbnail = snippet.TryGetProperty("thumbnails", out var thumbnailsProp) && thumbnailsProp.TryGetProperty("default", out var t) ? t.GetProperty("url").GetString() : ""
                        };
                    })
                    .ToList();

                return Ok(trackItems);
            } catch (Exception ex) {
                return StatusCode(500, $"Error obteniendo playlist: {ex.Message}");
            }
        }
    }
}
