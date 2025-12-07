/**
 * Export Manager
 * Generates Responsive-Ready HTML & CSS
 */
import { Registry } from './registry.js';

export const ExportManager = {
    
    /**
     * Recursively gathers all widgets into a flat array
     * to make CSS generation easier.
     */
    flattenWidgets(widgets, result = []) {
        widgets.forEach(w => {
            result.push(w);
            if (w.children && w.children.length > 0) {
                this.flattenWidgets(w.children, result);
            }
        });
        return result;
    },

    /**
     * Generates the CSS block with Media Queries
     */
    generateCSS(widgets) {
        let desktopCSS = '';
        let tabletCSS = '';
        let mobileCSS = '';

        const allWidgets = this.flattenWidgets(widgets);

        allWidgets.forEach(w => {
            const style = w.settings.style || {};
            const adv = w.settings.advanced || {};
            const combined = { ...style, ...adv };
            const idSelector = `#${w.id}`;

            let dRules = '';
            let tRules = '';
            let mRules = '';

            Object.entries(combined).forEach(([key, val]) => {
                if (val === undefined || val === '' || key === 'classes' || key === 'customCss') return;

                // Convert camelCase (fontSize) to kebab-case (font-size)
                // And strip _mobile / _tablet suffixes
                let prop = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                
                if (key.includes('_mobile')) {
                    prop = prop.replace('-_mobile', '').replace('_mobile', '');
                    mRules += `${prop}: ${val} !important; `;
                } else if (key.includes('_tablet')) {
                    prop = prop.replace('-_tablet', '').replace('_tablet', '');
                    tRules += `${prop}: ${val} !important; `;
                } else {
                    // Desktop / Base Styles
                    dRules += `${prop}: ${val}; `;
                }
            });

            if (dRules) desktopCSS += `${idSelector} { ${dRules} }\n`;
            if (tRules) tabletCSS += `${idSelector} { ${tRules} }\n`;
            if (mRules) mobileCSS += `${idSelector} { ${mRules} }\n`;
        });

        return `
            /* Base Styles (Desktop) */
            ${desktopCSS}
            
            /* Tablet (max-width: 1024px) */
            @media (max-width: 1024px) {
                ${tabletCSS}
            }

            /* Mobile (max-width: 767px) */
            @media (max-width: 767px) {
                ${mobileCSS}
            }
        `;
    },

    /**
     * Generates HTML Structure (Clean, no inline styles)
     */
    generateHTMLBody(widgets) {
        return widgets.map(w => {
            const def = Registry.definitions[w.type];
            if (!def) return '';

            // Get classes from Advanced tab
            const cls = (w.settings.advanced && w.settings.advanced.classes) ? w.settings.advanced.classes : '';
            
            let contentHtml = '';
            
            // Render Children or Content
            if (def.isContainer) {
                const childrenHtml = this.generateHTMLBody(w.children || []);
                // Important: Add 'ce-container' class for flex behavior
                contentHtml = `<div id="${w.id}" class="ce-widget ce-container ${cls}">${childrenHtml}</div>`;
            } else {
                const inner = def.renderHtml(w);
                contentHtml = `<div id="${w.id}" class="ce-widget ${cls}">${inner}</div>`;
            }
            
            return contentHtml;
        }).join('\n');
    },

    /**
     * Assembles the full page
     */
    generateFullPage(data) {
        const pageSettings = data.settings || {};
        const title = pageSettings.title || 'Exported Page';
        const bg_color = pageSettings.bg_color || '#ffffff';
        const custom_css = pageSettings.custom_css || '';

        const css = `
            body { margin: 0; font-family: 'Inter', sans-serif; background-color: ${bg_color}; }
            img { max-width: 100%; height: auto; }
            a { text-decoration: none; }
            
            /* Core Builder Styles needed for layout */
            .ce-container { display: flex; flex-direction: column; } 
            
            /* Generated Widget CSS */
            ${this.generateCSS(data.widgets)}
            
            /* Page Custom CSS */
            ${custom_css}
        `;

        const body = this.generateHTMLBody(data.widgets);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        ${css}
    </style>
</head>
<body>
    ${body}
</body>
</html>`;
    },

    download(data) {
        const html = this.generateFullPage(data);
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'page-export.html';
        a.click();
    },

    preview(data) {
        const html = this.generateFullPage(data);
        const win = window.open();
        if(win) {
            win.document.write(html);
            win.document.close();
        } else {
            alert('Please allow popups to view the preview.');
        }
    }
};