const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/backend/Controllers/OasisController.cs';
let content = fs.readFileSync(file, 'utf8');

const updateBlocksOld = `        [HttpPost("blocks")]
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
        }`;

const updateBlocksNew = `        [HttpPost("blocks")]
        public IActionResult UpdateBlocks([FromQuery] string user, [FromBody] List<Block> blocks)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();
            
            if (u.DeletedBlocks == null) u.DeletedBlocks = new HashSet<string>();

            // Excluir bloques que han sido eliminados previamente para evitar resurreccion
            var incomingBlocks = blocks.Where(b => !u.DeletedBlocks.Contains(b.Id)).ToList();

            foreach(var b in incomingBlocks) {
                b.Username = u.Username;
                if (b.Timestamp == default) b.Timestamp = DateTime.UtcNow;
            }

            u.Blocks = incomingBlocks;
            SaveState();
            return Ok();
        }

        [HttpDelete("blocks/{id}")]
        public IActionResult DeleteBlock([FromQuery] string user, string id)
        {
            var u = _state.Users.FirstOrDefault(usr => usr.Username == user);
            if (u == null) return NotFound();

            u.Blocks.RemoveAll(b => b.Id == id);
            if (u.DeletedBlocks == null) u.DeletedBlocks = new HashSet<string>();
            u.DeletedBlocks.Add(id);
            SaveState();
            return Ok();
        }`;

if (content.includes(updateBlocksOld)) {
    content = content.replace(updateBlocksOld, updateBlocksNew);
    fs.writeFileSync(file, content);
    console.log('Backend updated');
} else {
    console.log('Could not find UpdateBlocks block');
}
