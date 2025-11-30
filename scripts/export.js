/**
 * Export Manager
 */
import { Registry } from './registry.js';

export const ExportManager = {
    
    generateHTML(data) {
        let css = `
            body { margin: 0; font-family: sans-serif; }
            .ce-container { display: flex; flex-direction: column; }
        `;
        
        const renderNode = (w) => {
            const def = Registry.definitions[w.type];
            let styles = '';
            
            // Generate Inline Styles
            const s = { ...w.settings.style, ...w.settings.advanced };
            Object.entries(s).forEach(([k, v]) => {
                const key = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                if(key !== 'classes') styles += `${key}:${v};`;
            });

            const cls = w.settings.advanced.classes || '';
            
            let html = '';
            if (def.isContainer) {
                const childrenHtml = w.children.map(c => renderNode(c)).join('');
                html = `<div class="ce-container ${cls}" style="${styles}">${childrenHtml}</div>`;
            } else {
                // Strip tags for raw output if needed, or use renderHtml
                const content = def.renderHtml(w);
                // Wrap in div to apply styles
                html = `<div class="${cls}" style="${styles}">${content}</div>`;
            }
            return html;
        };

        const bodyHtml = data.widgets.map(w => renderNode(w)).join('\n');

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exported Page</title>
    <style>${css}</style>
</head>
<body>
    ${bodyHtml}
</body>
</html>`;
    },

    download(data) {
        const html = this.generateHTML(data);
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'page.html';
        a.click();
    },

    preview(data) {
        const html = this.generateHTML(data);
        const win = window.open();
        win.document.write(html);
        win.document.close();
    }
};