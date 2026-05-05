import { extension_settings } from "../../../extensions.js";
// NEW: เพิ่ม eventSource และ event_types เพื่อดักจับข้อความ
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "hud-ui-renderer";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

const defaultSettings = {
    enabled: true
};

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};

    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    $("#hud_ui_enabled").prop("checked", extension_settings[extensionName].enabled);
}

function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);
}

function renderHUD() {
    if (!extension_settings[extensionName].enabled) return;

    $(".mes_text").each(function () {
        let html = $(this).html();

        if (html.includes("[HUD_UI]")) {
            const regex = /\[HUD_UI\]([\s\S]*?)\[\/HUD_UI\]/g;

            const newHtml = html.replace(regex, (match, innerText) => {
                let headerHtml = "";
                let sectionsHtml = "";

                // 1. จัดการ [HEADER] แบบใหม่ ให้แยกข้อมูลได้เหมือนตาราง
                const headerMatch = innerText.match(/\[HEADER\]([\s\S]*?)\[\/HEADER\]/);
                if (headerMatch) {
                    const headerContent = headerMatch[1].replace(/<br\s*\/?>/gi, '').trim();
                    const headerItems = headerContent.split('|').map(item => item.trim()).filter(item => item.length > 0);

                    let headerGrid = `<div class="hud-header-grid">`;
                    headerItems.forEach(item => {
                        const parts = item.split(':');
                        const key = parts[0] ? parts[0].trim() : '';
                        const value = parts.slice(1).join(':').trim();

                        if (value) {
                            headerGrid += `<div class="hud-header-item">
                                <span class="hud-header-key">${key}</span>
                                <span class="hud-header-value">${value}</span>
                            </div>`;
                        } else {
                            // กรณีใส่มาแค่ข้อความเดียว ไม่มีเครื่องหมาย :
                            headerGrid += `<div class="hud-header-full">${key}</div>`;
                        }
                    });
                    headerGrid += `</div>`;
                    headerHtml = headerGrid;
                }

                // 2. จัดการแท็กอื่นๆ (พับเก็บได้)
                const tagRegex = /\[([A-Z0-9_]+)\]([\s\S]*?)\[\/\1\]/g;
                let tagMatch;

                while ((tagMatch = tagRegex.exec(innerText)) !== null) {
                    const tagName = tagMatch[1];
                    if (tagName === "HEADER") continue;

                    const tagContent = tagMatch[2].replace(/<br\s*\/?>/gi, '').trim();
                    const items = tagContent.split('|').map(item => item.trim()).filter(item => item.length > 0);

                    let tableHtml = `<table class="hud-ui-table"><tbody>`;
                    items.forEach(item => {
                        const parts = item.split(':');
                        const key = parts[0] ? parts[0].trim() : '';
                        const value = parts.slice(1).join(':').trim();

                        if (value) {
                            tableHtml += `<tr><td class="hud-key">${key}</td><td class="hud-value">${value}</td></tr>`;
                        } else {
                            tableHtml += `<tr><td colspan="2" class="hud-full">${key}</td></tr>`;
                        }
                    });
                    tableHtml += `</tbody></table>`;

                    sectionsHtml += `
                        <div class="hud-ui-section collapsed">
                            <div class="hud-ui-section-header">
                                <span class="hud-section-title">${tagName}</span>
                                <div class="hud-glow-line"></div>
                                <i class="fa-solid fa-chevron-down hud-chevron"></i>
                            </div>
                            <div class="hud-ui-section-content">
                                <div class="hud-ui-section-content-inner">
                                    ${tableHtml}
                                </div>
                            </div>
                        </div>
                    `;
                }

                return `<div class="hud-ui-container">
                    ${headerHtml ? `<div class="hud-ui-header-wrapper">${headerHtml}</div>` : ''}
                    <div class="hud-ui-body">
                        ${sectionsHtml}
                    </div>
                </div>`;
            });

            if (html !== newHtml) {
                $(this).html(newHtml);
            }
        }
    });
}

// NEW: ฟังก์ชันหน่วงเวลาเพื่อรอให้ DOM อัปเดตเสร็จก่อนทำงาน
let renderTimeout;
function scheduleRender() {
    clearTimeout(renderTimeout);
    // หน่วงเวลา 200 มิลลิวินาที (หากยังไม่ติด สามารถลองปรับเป็น 500 ได้)
    renderTimeout = setTimeout(renderHUD, 200);
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        loadSettings();
        $("#hud_ui_enabled").on("input", onCheckboxChange);

        // NEW: ผูกอีเวนต์สำหรับการคลิกเพื่อพับเก็บหมวดหมู่ (Collapse)
        $(document).on("click", ".hud-ui-section-header", function() {
            $(this).parent().toggleClass("collapsed");
        });

        // เปลี่ยนมาใช้ scheduleRender แทน renderHUD โดยตรง
        eventSource.on(event_types.CHAT_CHANGED, scheduleRender);
        eventSource.on(event_types.MESSAGE_RECEIVED, scheduleRender);
        eventSource.on(event_types.MESSAGE_EDITED, scheduleRender);
        eventSource.on(event_types.GENERATION_STOPPED, scheduleRender);
        eventSource.on(event_types.USER_MESSAGE_SENT, scheduleRender);
        eventSource.on(event_types.MESSAGE_SWIPED, scheduleRender);

        // รันครั้งแรกเมื่อโหลด Extension
        setTimeout(renderHUD, 1000);

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
