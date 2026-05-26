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

namespace Oasis.Backend.Controllers
{
    [ApiController]
    [Route("api/oasis")]
    public class OasisController : ControllerBase
    {
        private readonly IConfiguration _config;
        private static readonly HttpClient _httpClient = new HttpClient();

        public OasisController(IConfiguration config)
        {
            _config = config;
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
                    FullName = "Oasis Admin",
                    Age = 25,
                    Background = new BackgroundConfig { Type = "color", Value = "#030304" }
                });
                SaveStateInternal(state);
                Console.WriteLine("Oasis: seeded default user ory11.");
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
            try {
                string json = JsonSerializer.Serialize(state, JsonOptions);
                using (var fs = new FileStream(StoragePath, FileMode.Create, FileAccess.Write, FileShare.ReadWrite))
                using (var writer = new StreamWriter(fs))
                {
                    writer.Write(json);
                }
            } catch (Exception ex) {
                Console.WriteLine($"Error guardando oasis: {ex.Message}");
            }
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
            if (_state.Users.Any(u => u.Username.Equals(req.Username, StringComparison.OrdinalIgnoreCase)))
                return BadRequest(new { msg = "Esta Identidad ya existe en el Oasis." });

            var angelCoreTemplate = _state.BackgroundTemplates?.FirstOrDefault(t => t.Name.Equals("AngelCore", StringComparison.OrdinalIgnoreCase));
            var defaultBackground = new BackgroundConfig();
            if (angelCoreTemplate != null)
            {
                defaultBackground.Type = angelCoreTemplate.Type;
                defaultBackground.Value = angelCoreTemplate.Value;
                defaultBackground.IsTiled = angelCoreTemplate.IsTiled;
                defaultBackground.Opacity = 0.8;
            }
            else
            {
                defaultBackground.Type = "image";
                defaultBackground.Value = "/uploads/36d7f8bb-3bf4-4be3-9521-a08aa2bfebc7.jpg";
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
                    Metadata = new Dictionary<string, string>(),
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
                    Metadata = new Dictionary<string, string>(),
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
                    Metadata = new Dictionary<string, string>(),
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
                    Metadata = new Dictionary<string, string>(),
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

        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            var userList = _state.Users.Select(u => new {
                Username = u.Username,
                FullName = u.FullName,
                Age = u.Age,
                ClinicalData = u.ClinicalData
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
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.Background = config;
            SaveState();
            return Ok();
        }

        [HttpGet("backgrounds/templates")]
        public ActionResult<List<BackgroundTemplate>> GetBackgroundTemplates()
        {
            return _state.BackgroundTemplates ?? new List<BackgroundTemplate>();
        }

        [HttpGet("config/deepseek-key")]
        public IActionResult GetDeepseekKey()
        {
            var key = Environment.GetEnvironmentVariable("DEEPSEEK_API_KEY");
            if (string.IsNullOrEmpty(key))
            {
                // Fallback to the default key in case environment variable is not defined
                key = "sk-07b18eb6601a4b11a109c96a56c92a16";
            }
            return Ok(new { key });
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

        [HttpGet("blocks")]
        public ActionResult<List<Block>> GetBlocks([FromQuery] string user)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Blocks : new List<Block>();
        }

        [HttpPost("blocks")]
        public IActionResult UpdateBlocks([FromQuery] string user, [FromBody] List<Block> blocks)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            
            // Ensure every block has the correct username and a valid timestamp
            foreach(var b in blocks) {
                b.Username = u.Username;
                if (b.Timestamp == default) b.Timestamp = DateTime.UtcNow;
            }

            u.Blocks = blocks;
            SaveState();
            return Ok();
        }

        [HttpGet("links")]
        public ActionResult<List<Link>> GetLinks([FromQuery] string user)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Links : new List<Link>();
        }

        [HttpPost("links")]
        public IActionResult UpdateLinks([FromQuery] string user, [FromBody] List<Link> links)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.Links = links;
            SaveState();
            return Ok();
        }

        [HttpGet("feed")]
        public ActionResult<List<Block>> GetFeed()
        {
            var allPublicBlocks = _state.Users
                .SelectMany(u => u.Blocks)
                .Where(b => b.IsPublic)
                .OrderByDescending(b => b.Timestamp)
                .ToList();

            return allPublicBlocks;
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
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Playlists : new Dictionary<string, List<TrackItem>>();
        }

        [HttpPost("playlists")]
        public IActionResult UpdatePlaylists([FromQuery] string user, [FromBody] Dictionary<string, List<TrackItem>> playlists)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.Playlists = playlists;
            SaveState();
            return Ok();
        }

        [HttpGet("playback")]
        public ActionResult<PlaybackState> GetPlayback([FromQuery] string user)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.LastPlayback : new PlaybackState();
        }

        [HttpPost("playback")]
        public IActionResult UpdatePlayback([FromQuery] string user, [FromBody] PlaybackState state)
        {
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
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Conversations : new List<Conversation>();
        }

        [HttpPost("conversations")]
        public IActionResult UpdateConversations([FromQuery] string user, [FromBody] List<Conversation> conversations)
        {
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
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.Folders : new List<Folder>();
        }

        [HttpPost("folders")]
        public IActionResult UpdateFolders([FromQuery] string user, [FromBody] List<Folder> folders)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            u.Folders = folders;
            SaveState();
            return Ok();
        }

        [HttpGet("memory")]
        public ActionResult<string> GetMemory([FromQuery] string user)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.ContinuousMemory : string.Empty;
        }

        [HttpGet("clinical-data")]
        public ActionResult<Dictionary<string, string>> GetClinicalData([FromQuery] string user)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            return u != null ? u.ClinicalData : new Dictionary<string, string>();
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
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            if (data != null)
            {
                foreach (var kvp in data)
                {
                    u.ClinicalData[kvp.Key] = kvp.Value;
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
        public async Task<IActionResult> UploadAsset(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No se proporcionó ningún archivo.");

            try
            {
                var supabaseUrl = _config["Supabase:Url"];
                var supabaseKey = _config["Supabase:Key"];

                if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
                {
                    return await SaveLocalFile(file);
                }

                var ext = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{ext}";
                var bucket = "oasis-media";
                var uploadUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucket}/{fileName}";

                using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
                request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
                request.Headers.Add("apikey", supabaseKey);

                using var stream = file.OpenReadStream();
                using var content = new StreamContent(stream);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType ?? "application/octet-stream");
                request.Content = content;

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var publicUrl = $"{supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucket}/{fileName}";
                    return Ok(new { url = publicUrl });
                }
                else
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Supabase upload error: {response.StatusCode} - {errorMsg}");
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

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

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
