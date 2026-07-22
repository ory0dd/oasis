const fs = require('fs');
let code = fs.readFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', 'utf8');

const s1 = code.indexOf('{/* 1. Inline Island Analysis');
const e1 = code.indexOf("{mapViewTab === 'map' && tourActiveIndex !== null");

if (s1 !== -1 && e1 !== -1) {
    const blockToExtract = code.substring(s1, e1);
    
    // Extract the accordion part from blockToExtract
    const accStart = blockToExtract.indexOf('{/* SECUENCIA Y DESGLOSE (ACCORDION) */}');
    const accEnd = blockToExtract.indexOf('{/* Footer Actions */}');
    
    if (accStart !== -1 && accEnd !== -1) {
        let accordionCode = blockToExtract.substring(accStart, accEnd);
        // Replace activePattern with pat
        accordionCode = accordionCode.replace(/activePattern/g, 'pat');
        
        // Find where to insert in the Bucles tab
        const insertStartStr = '<span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Composición del Bucle</span>';
        const insertEndStr = '{activeCheckinPatternId === pat.id';
        
        const iStart = code.indexOf(insertStartStr);
        if (iStart !== -1) {
            // Find the start of the <div className="flex flex-col gap-2"> that wraps it
            const divStart = code.lastIndexOf('<div', iStart);
            
            const iEnd = code.indexOf(insertEndStr, iStart);
            if (iEnd !== -1) {
                // Remove the old flat list and insert the new accordion code
                // Also delete the inline modal block entirely
                let newCode = code.substring(0, divStart) + accordionCode + '\n                                                                    ' + code.substring(iEnd, s1) + code.substring(e1);
                
                fs.writeFileSync('c:/Users/Administrador/Downloads/oasis/oasis/frontend/src/components/MyResponsesDashboard.jsx', newCode);
                console.log('SUCCESS');
            } else {
                console.log('iEnd not found');
            }
        } else {
            console.log('insertStartStr not found');
        }
    } else {
        console.log('Accordion bounds not found');
    }
} else {
    console.log('s1 or e1 not found');
}
