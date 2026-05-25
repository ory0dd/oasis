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

namespace Oasis.Backend.Controllers
{
    [ApiController]
    [Route("api/oasis")]
    public class OasisController : ControllerBase
    {
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
                        var state = JsonSerializer.Deserialize<OasisState>(json, JsonOptions) ?? new OasisState();
                        if (MigrateBase64Assets(state))
                        {
                            SaveStateInternal(state);
                            Console.WriteLine("Oasis: Assets migrados y archivo optimizado.");
                        }
                        return state;
                    }
                }
            } catch (Exception ex) { 
                Console.WriteLine($"Error cargando oasis: {ex.Message}");
            }
            return new OasisState();
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
            var user = _state.Users.FirstOrDefault(u => u.Username == req.Username && u.Password == req.Password);
            if (user == null) return Unauthorized(new { msg = "Credenciales de Alma inválidas." });
            return Ok(new { msg = "Oasis Sincronizado", user = UserDto.FromUser(user) });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] LoginRequest req)
        {
            if (_state.Users.Any(u => u.Username == req.Username))
                return BadRequest(new { msg = "Esta Identidad ya existe en el Oasis." });

            var user = new User { 
                Username = req.Username, 
                Password = req.Password,
                FullName = req.FullName ?? string.Empty,
                Age = req.Age
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
            }
            return Ok();
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadAsset(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No se proporcionó ningún archivo.");

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
