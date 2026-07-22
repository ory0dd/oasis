const fs = require('fs');
const file = 'c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `    useEffect(() => {
        if (afcData && mapContainerRef.current && mapViewTab === 'map' && !selectedNode) {
            const timer = setTimeout(resetMapTransform, 150);
            return () => clearTimeout(timer);
        }
    }, [afcData, resetMapTransform, mapViewTab, selectedNode]);`;

const replacement = `    // Prevents map from constantly resetting when afcData updates (e.g. dragging a node)
    const prevMapStateRef = useRef({ tab: mapViewTab, node: selectedNode });
    const hasInitializedAfcDataRef = useRef(false);

    useEffect(() => {
        if (!afcData || !mapContainerRef.current || mapViewTab !== 'map' || selectedNode) {
            prevMapStateRef.current = { tab: mapViewTab, node: selectedNode };
            return;
        }

        const tabChangedToMap = prevMapStateRef.current.tab !== 'map' && mapViewTab === 'map';
        const nodeDeselected = prevMapStateRef.current.node !== null && selectedNode === null;
        const isFirstDataLoad = !hasInitializedAfcDataRef.current;

        if (tabChangedToMap || nodeDeselected || isFirstDataLoad) {
            hasInitializedAfcDataRef.current = true;
            const timer = setTimeout(resetMapTransform, 150);
            prevMapStateRef.current = { tab: mapViewTab, node: selectedNode };
            return () => clearTimeout(timer);
        }
        
        prevMapStateRef.current = { tab: mapViewTab, node: selectedNode };
    }, [afcData, resetMapTransform, mapViewTab, selectedNode]);`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Successfully patched map reset loop!");
} else {
    console.log("Could not find the target useEffect to replace.");
}
