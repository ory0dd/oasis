using System;
using System.Collections.Generic;

namespace Oasis.Backend.Models
{
    public class Block
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public double X { get; set; }
        public double Y { get; set; }
        public string? Content { get; set; } = string.Empty;
        public double Rotation { get; set; }
        public string? Color { get; set; } = string.Empty;
        public bool IsPublic { get; set; } = false;
        public string? Caption { get; set; } = string.Empty;
        public string? Username { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public Dictionary<string, string>? Metadata { get; set; } = new();
        public string? FolderId { get; set; } = string.Empty; // For sidebar organization
    }

    public class SoulPiece
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public double X { get; set; }
        public double Y { get; set; }
        public string Desc { get; set; } = string.Empty;
        public string Img { get; set; } = string.Empty;
    }

    public class Resonance
    {
        public string Id { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public int Likes { get; set; }
    }

    public class BackgroundConfig
    {
        public string Type { get; set; } = "color";
        public string Value { get; set; } = "#030304";
        public bool IsTiled { get; set; } = false;
        public double Opacity { get; set; } = 0.8;
    }

    public class BackgroundTemplate
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "image";
        public string Value { get; set; } = string.Empty;
        public bool IsTiled { get; set; } = false;
        public string Creator { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ConversationMessage
    {
        public string? Role { get; set; } = string.Empty; // "user" or "model"
        public string? Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class Conversation
    {
        public string Id { get; set; } = string.Empty;
        public string? Title { get; set; } = string.Empty;
        public List<ConversationMessage> Messages { get; set; } = new();
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public string? Summary { get; set; } = string.Empty;
        public bool IsPinned { get; set; } = false;
        public string? Color { get; set; } = string.Empty;
        public string? FolderId { get; set; } = string.Empty;
        public string? NoteId { get; set; } = string.Empty; // Link to canvas text block
        public Dictionary<string, string>? Insights { get; set; } = new(); // Emotional summary, tensions, etc.
    }

    public class Folder
    {
        public string Id { get; set; } = string.Empty;
        public string? Name { get; set; } = string.Empty;
        public string? Type { get; set; } = "note"; // "note" or "conversation"
        public string? Color { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? FullName { get; set; } = string.Empty;
        public int? Age { get; set; }
    }

    public class TrackItem
    {
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string VideoId { get; set; } = string.Empty;
        public string PlaylistId { get; set; } = string.Empty; // Added
        public string Thumbnail { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Type { get; set; } = "video"; // Added: "video" or "playlist"
        public int VideoCount { get; set; } // Added for playlists
    }

    public class PlaybackState
    {
        public string VideoId { get; set; } = string.Empty;
        public string PlaylistName { get; set; } = string.Empty;
        public double Position { get; set; } = 0;
        public bool IsPlaying { get; set; } = false;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class Link
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
    }

    public class User
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int? Age { get; set; }
        public BackgroundConfig Background { get; set; } = new();
        public List<Block> Blocks { get; set; } = new();
        public List<Link> Links { get; set; } = new();
        public Dictionary<string, List<TrackItem>> Playlists { get; set; } = new();
        public PlaybackState LastPlayback { get; set; } = new();
        public List<Conversation> Conversations { get; set; } = new();
        public List<Folder> Folders { get; set; } = new();
        public string ContinuousMemory { get; set; } = string.Empty; // Persistent AI context
        public Dictionary<string, string> ClinicalData { get; set; } = new();
    }


    public class OasisState
    {
        public List<User> Users { get; set; } = new();
        public List<Resonance> Resonances { get; set; } = new();
        // Fallback or Shared
        public BackgroundConfig GlobalBackground { get; set; } = new();
        public List<BackgroundTemplate> BackgroundTemplates { get; set; } = new();

        // YouTube Cache
        public List<TrackFingerprint> TrackFingerprints { get; set; } = new();
        public List<SearchCacheEntry> SearchCache { get; set; } = new();
    }

    public class TrackFingerprint
    {
        public string VideoId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty; 
        public List<string> Tags { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public bool IsLocalCached { get; set; } = false;
        public string LocalPath { get; set; } = string.Empty;
    }

    public class SearchCacheEntry
    {
        public string Query { get; set; } = string.Empty;
        public List<string> VideoIds { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
