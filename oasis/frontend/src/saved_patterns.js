    const currentPatterns = useMemo(() => {
        const patterns = getAfcPatterns({ nodes: nodesToRender, edges: edgesToRender });
        
        return patterns.map(pattern => {
            let totalIntensity = 0;
            let selfSabotageKeywords = ['culpa', 'miedo', 'adicción', 'droga', 'evitación', 'ansiedad', 'depresión', 'castigo', 'aislamiento', 'procrastinación', 'control', 'trampas', 'tóxic'];
            let keywordScore = 0;
            let totalDifficulty = 0;
            
            pattern.sortedNodes.forEach(node => {
                const userInt = nodeIntensities[node.id] || 0;
                totalIntensity += userInt;
                
                const text = (node.label + " " + (node.observations || "")).toLowerCase();
                selfSabotageKeywords.forEach(kw => {
                    if (text.includes(kw)) keywordScore += 2;
                });
                
                if (node.type === 'behavior') totalDifficulty += 1;
                else if (node.type === 'trigger') totalDifficulty += 2;
                else if (node.type === 'cognitive') totalDifficulty += 4;
                else if (node.type === 'origin') totalDifficulty += 5;
                else totalDifficulty += 3;
            });
            
            const avgDifficulty = pattern.sortedNodes.length > 0 ? totalDifficulty / pattern.sortedNodes.length : 0;
            const finalIntensity = totalIntensity + keywordScore + (pattern.sortedNodes.length * 1.5);
            
            return {
                ...pattern,
                computedIntensity: finalIntensity,
                computedDifficulty: avgDifficulty
            };
        }).sort((a, b) => {
            const getIntensityTier = (score) => {
                if (score >= 15) return 3;
                if (score >= 8) return 2;
                return 1;
            };
            
            const tierA = getIntensityTier(a.computedIntensity);
            const tierB = getIntensityTier(b.computedIntensity);
            
            if (tierA !== tierB) {
                return tierB - tierA; // Mayor intensidad primero
            }
            return a.computedDifficulty - b.computedDifficulty; // Más fácil primero dentro de la misma intensidad
        });
    }, [nodesToRender, edgesToRender, getAfcPatterns, nodeIntensities]);

    const activePattern = useMemo(() => {
        return currentPatterns.find(p => p.id === selectedPatternId) || null;
    }, [currentPatterns, selectedPatternId]);