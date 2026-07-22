const fs = require('fs');
const path = require('path');

const filepath = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/App.jsx';
let content = fs.readFileSync(filepath, 'utf8');

// Normalize for replacement
const normalized = content.replace(/\r\n/g, '\n');

// 1. Update FeedItem parameters
const targetParams = `const FeedItem = ({ f, credits, setCredits, blocks, setBlocks, syncBlocks, links = [], feed = [], setView, editBlock, accent, setPublicProfileUser }) => {`;
const replacementParams = `const FeedItem = ({ f, credits, setCredits, blocks, setBlocks, syncBlocks, links = [], feed = [], setFeed, setView, editBlock, accent, setPublicProfileUser, user }) => {`;

// 2. Insert handleDeleteFeedItem
const targetState = `    const [currentSlide, setCurrentSlide] = React.useState(0);`;
const replacementState = `    const [currentSlide, setCurrentSlide] = React.useState(0);

    const handleDeleteFeedItem = async () => {
        if (setFeed) {
            setFeed(prev => prev.filter(item => item.id !== f.id));
        }

        const isFeedBlock = f.id && String(f.id).startsWith('feed_');
        const deleteUrl = isFeedBlock 
            ? \`\${API_URL}/api/oasis/feed/\${f.id}\`
            : \`\${API_URL}/api/oasis/blocks/\${f.id}?user=\${user}\`;

        try {
            const res = await fetch(deleteUrl, { method: 'DELETE' });
            if (!res.ok) {
                console.error("Failed to delete feed item on backend:", res.status);
            }
        } catch (err) {
            console.error("Error deleting feed item:", err);
        }

        if (blocks && blocks.some(b => b.id === f.id)) {
            setBlocks(prev => prev.filter(b => b.id !== f.id));
            if (typeof syncBlocks === 'function') {
                syncBlocks(blocks.filter(b => b.id !== f.id));
            }
        }
    };`;

// 3. Update the three delete buttons in FeedItem
const deleteButtonTarget1 = `                        {blocks && blocks.some(b => b.id === f.id) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmAction({ message: "¿Seguro que quieres eliminar esta publicación del Feed Público?", onConfirm: () => {
                                        if (typeof syncBlocks === 'function') {
                                            syncBlocks(prev => prev.map(b => b.id === f.id ? { ...b, isPublic: false } : b));
                                        }
                                    } });
                                }}
                                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all pointer-events-auto"`;

const deleteButtonReplacement1 = `                        {(f.username === user || (blocks && blocks.some(b => b.id === f.id))) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmAction({ message: "¿Seguro que quieres eliminar esta publicación del Feed Público?", onConfirm: handleDeleteFeedItem });
                                }}
                                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all pointer-events-auto"`;

const deleteButtonTarget2 = `                        {blocks && blocks.some(b => b.id === f.id) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmAction({ message: "¿Eliminar esta publicación del Feed?", onConfirm: () => {
                                        if (typeof syncBlocks === 'function') {
                                            syncBlocks(prev => prev.map(b => b.id === f.id ? { ...b, isPublic: false } : b));
                                        }
                                    } });
                                }}
                                className="w-7 h-7 rounded-full bg-black/60 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all pointer-events-auto"`;

const deleteButtonReplacement2 = `                        {(f.username === user || (blocks && blocks.some(b => b.id === f.id))) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmAction({ message: "¿Eliminar esta publicación del Feed?", onConfirm: handleDeleteFeedItem });
                                }}
                                className="w-7 h-7 rounded-full bg-black/60 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all pointer-events-auto"`;

const deleteButtonTarget3 = `                    {blocks && blocks.some(b => b.id === f.id) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ message: "¿Eliminar esta publicación del Feed Público?", onConfirm: () => {
                                    if (typeof syncBlocks === 'function') {
                                        syncBlocks(prev => prev.map(b => b.id === f.id ? { ...b, isPublic: false } : b));
                                    }
                                } });
                            }}
                            className="w-8 h-8 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-black transition-all pointer-events-auto"`;

const deleteButtonReplacement3 = `                    {(f.username === user || (blocks && blocks.some(b => b.id === f.id))) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ message: "¿Eliminar esta publicación del Feed Público?", onConfirm: handleDeleteFeedItem });
                            }}
                            className="w-8 h-8 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-black transition-all pointer-events-auto"`;

// 4. Update the instances of rendering FeedItem
const feedItemRender1 = `                            <FeedItem
                                key={f.id || i}
                                f={f}
                                accent={accent}
                                credits={credits}
                                setCredits={setCredits}
                                blocks={blocks}
                                setBlocks={setBlocks}
                                syncBlocks={syncBlocks}
                                links={links}
                                feed={feed}
                                setView={setView}
                                editBlock={editBlock}
                                setPublicProfileUser={setPublicProfileUser}
                            />`;

const feedItemRender1Rep = `                            <FeedItem
                                key={f.id || i}
                                f={f}
                                accent={accent}
                                credits={credits}
                                setCredits={setCredits}
                                blocks={blocks}
                                setBlocks={setBlocks}
                                syncBlocks={syncBlocks}
                                links={links}
                                feed={feed}
                                setFeed={setFeed}
                                setView={setView}
                                editBlock={editBlock}
                                setPublicProfileUser={setPublicProfileUser}
                                user={user}
                            />`;

const feedItemRender2 = `                        <FeedItem
                            f={selectedPublicPost}
                            accent={accent}
                            credits={credits}
                            setCredits={setCredits}
                            blocks={blocks}
                            setBlocks={setBlocks}
                            syncBlocks={syncBlocks}
                            links={links}
                            feed={feed}
                            setView={setView}
                            editBlock={editBlock}
                            setPublicProfileUser={setPublicProfileUser}
                        />`;

const feedItemRender2Rep = `                        <FeedItem
                            f={selectedPublicPost}
                            accent={accent}
                            credits={credits}
                            setCredits={setCredits}
                            blocks={blocks}
                            setBlocks={setBlocks}
                            syncBlocks={syncBlocks}
                            links={links}
                            feed={feed}
                            setFeed={setFeed}
                            setView={setView}
                            editBlock={editBlock}
                            setPublicProfileUser={setPublicProfileUser}
                            user={user}
                        />`;

let updated = normalized;

if (updated.includes(targetParams)) {
    updated = updated.replace(targetParams, replacementParams);
    console.log('1. FeedItem params replaced successfully.');
} else {
    console.log('1. TargetParams not found!');
}

if (updated.includes(targetState)) {
    updated = updated.replace(targetState, replacementState);
    console.log('2. handleDeleteFeedItem state inserted successfully.');
} else {
    console.log('2. TargetState not found!');
}

if (updated.includes(deleteButtonTarget1)) {
    updated = updated.replace(deleteButtonTarget1, deleteButtonReplacement1);
    console.log('3a. Delete button 1 replaced successfully.');
} else {
    console.log('3a. DeleteButtonTarget1 not found!');
}

if (updated.includes(deleteButtonTarget2)) {
    updated = updated.replace(deleteButtonTarget2, deleteButtonReplacement2);
    console.log('3b. Delete button 2 replaced successfully.');
} else {
    console.log('3b. DeleteButtonTarget2 not found!');
}

if (updated.includes(deleteButtonTarget3)) {
    updated = updated.replace(deleteButtonTarget3, deleteButtonReplacement3);
    console.log('3c. Delete button 3 replaced successfully.');
} else {
    console.log('3c. DeleteButtonTarget3 not found!');
}

if (updated.includes(feedItemRender1)) {
    updated = updated.replace(feedItemRender1, feedItemRender1Rep);
    console.log('4a. FeedItem render 1 updated successfully.');
} else {
    console.log('4a. FeedItemRender1 not found!');
}

if (updated.includes(feedItemRender2)) {
    updated = updated.replace(feedItemRender2, feedItemRender2Rep);
    console.log('4b. FeedItem render 2 updated successfully.');
} else {
    console.log('4b. FeedItemRender2 not found!');
}

// Write back with CRLF line endings
fs.writeFileSync(filepath, updated.replace(/\n/g, '\r\n'), 'utf8');
console.log('Successfully wrote App.jsx!');
