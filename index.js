import { extension_settings } from "../../../extensions.js";
// NEW: เพิ่ม eventSource และ event_types เพื่อดักจับข้อความ
import { saveSettingsDebounced, eventSource, event_types } from "../../../../script.js";

const extensionName = "hud-ui-renderer";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// เพิ่ม accentColor ในค่าเริ่มต้น
const defaultSettings = {
    enabled: true,
    accentColor: "#4da6ff"
};

// ฟังก์ชันแปลงโค้ดสี Hex เป็น RGB เพื่อใช้กับ rgba() ใน CSS
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "77, 166, 255";
}

// ฟังก์ชันอัปเดตตัวแปรสีใน CSS
function applyAccentColor(hexColor) {
    const rgbColor = hexToRgb(hexColor);
    document.documentElement.style.setProperty('--hud-accent', hexColor);
    document.documentElement.style.setProperty('--hud-accent-rgb', rgbColor);
}

async function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }

    // โหลดค่า Checkbox และ Color
    $("#hud_ui_enabled").prop("checked", extension_settings[extensionName].enabled);

    const savedColor = extension_settings[extensionName].accentColor || defaultSettings.accentColor;
    $("#hud_ui_color").val(savedColor);
    applyAccentColor(savedColor);
}

function onCheckboxChange(event) {
    const value = Boolean($(event.target).prop("checked"));
    extension_settings[extensionName].enabled = value;
    saveSettingsDebounced();
    console.log(`[${extensionName}] Setting saved:`, value);
}

// ฟังก์ชันเมื่อมีการเปลี่ยนสี
function onColorChange(event) {
    const color = $(event.target).val();
    extension_settings[extensionName].accentColor = color;
    applyAccentColor(color);
    saveSettingsDebounced();
}

function renderHUD() {
    if (!extension_settings[extensionName].enabled) return;

    $(".mes_text").each(function () {
        let html = $(this).html();
        let newHtml = html; // ใช้ตัวแปรนี้เพื่อเก็บการเปลี่ยนแปลงทั้งหมด

        // 1. ดักจับ [HUD_INDICATOR] สำหรับแถบบริบทด้านบน
        if (newHtml.includes("[HUD_INDICATOR]")) {
            const indRegex = /\[HUD_INDICATOR\]([\s\S]*?)\[\/HUD_INDICATOR\]/g;
            newHtml = newHtml.replace(indRegex, (match, innerText) => {
                const content = innerText.replace(/<br\s*\/?>/gi, '').trim();
                const items = content.split('|').map(item => item.trim()).filter(item => item.length > 0);

                let indHtml = `<div class="hud-indicator-container">`;
                items.forEach(item => {
                    const parts = item.split(':');
                    const key = parts[0] ? parts[0].trim() : '';
                    const value = parts.slice(1).join(':').trim();

                    if (value) {
                        indHtml += `<span class="hud-indicator-badge">
                            <span class="hud-indicator-key">${key}</span>
                            <span class="hud-indicator-value">${value}</span>
                        </span>`;
                    } else {
                        indHtml += `<span class="hud-indicator-badge single">${key}</span>`;
                    }
                });
                indHtml += `</div>`;
                return indHtml;
            });
        }

        // 2. ดักจับ [HUD_UI] สำหรับ Tracker ด้านล่าง (โค้ดเดิมของคุณ)
        if (newHtml.includes("[HUD_UI]")) {
            const regex = /\[HUD_UI\]([\s\S]*?)\[\/HUD_UI\]/g;

            newHtml = newHtml.replace(regex, (match, innerText) => {
                let headerHtml = "";
                let sectionsHtml = "";

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
                            headerGrid += `<div class="hud-header-full">${key}</div>`;
                        }
                    });
                    headerGrid += `</div>`;
                    headerHtml = headerGrid;
                }

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
        }
        
        // NEW: 3. ดักจับ [NOTI] สำหรับการแจ้งเตือน
        // 3. ดักจับ [NOTI] สำหรับการแจ้งเตือน
        if (newHtml.includes("[NOTI]")) {
            const notiRegex = /\[NOTI\]([\s\S]*?)\[\/NOTI\]/g;
            newHtml = newHtml.replace(notiRegex, (match, innerText) => {
                // ลบเฉพาะ <br> และช่องว่างที่อยู่ "หัว" และ "ท้าย" ของข้อความทั้งหมดออก แต่เก็บอันตรงกลางไว้
                let content = innerText.replace(/^(?:<br\s*\/?>|\s)+|(?:<br\s*\/?>|\s)+$/gi, '');

                let title = "SYSTEM NOTIFICATION";
                let text = content;

                const colonIndex = content.indexOf(':');
                if (colonIndex !== -1) {
                    // หัวข้อ (Title) ไม่ควรมีการเว้นบรรทัด จึงลบ <br> ออกทั้งหมด
                    title = content.substring(0, colonIndex).replace(/<br\s*\/?>/gi, '').trim();

                    // เนื้อหา (Text) เก็บ <br> ไว้ แต่ลบช่องว่างหรือ <br> ที่อาจจะติดมาตรงต้นประโยคออก
                    text = content.substring(colonIndex + 1).replace(/^(?:<br\s*\/?>|\s)+/, '');
                }

                return `<div class="hud-noti-container">
                    <div class="hud-noti-icon-wrapper">
                        <i class="fa-solid fa-bell hud-noti-icon"></i>
                    </div>
                    <div class="hud-noti-text">
                        <div class="hud-noti-title">${title}</div>
                        <div class="hud-noti-desc">${text}</div>
                    </div>
                </div>`;
            });
        }

        // NEW: 4. ดักจับ [CHAT:...] แบบต่อเนื่องให้รวมเป็นหน้าจอเดียว
        // Regex นี้จะหา [CHAT:...] ที่อยู่ติดกัน (แม้จะมี <br> คั่น)
        const chatBlockRegex = /(?:\[CHAT:[^\]]*\][\s\r\n]*(?:<br\s*\/?>[\s\r\n]*)*)+/g;

        newHtml = newHtml.replace(chatBlockRegex, (match) => {
            let chatHtml = `<div class="hud-chat-container">
                <div class="hud-chat-header">
                    <i class="fa-solid fa-message"></i> <span>COMMUNICATION LINK</span>
                </div>
                <div class="hud-chat-body">`;

            const singleChatRegex = /\[CHAT:([^\]]+)\]/g;
            let chatMatch;

            while ((chatMatch = singleChatRegex.exec(match)) !== null) {
                const content = chatMatch[1].trim();
                let align = "left"; // ค่าเริ่มต้นคือฝั่งซ้าย
                let textToParse = content;

                // เช็คว่าขึ้นต้นด้วย L: หรือ R: เพื่อกำหนดฝั่ง
                if (textToParse.startsWith("L:")) {
                    align = "left";
                    textToParse = textToParse.substring(2).trim();
                } else if (textToParse.startsWith("R:")) {
                    align = "right";
                    textToParse = textToParse.substring(2).trim();
                }

                let sender = "UNKNOWN";
                let text = textToParse;

                // แยกชื่อคนส่งกับข้อความด้วยเครื่องหมาย :
                const colonIndex = textToParse.indexOf(':');
                if (colonIndex !== -1) {
                    sender = textToParse.substring(0, colonIndex).trim();
                    text = textToParse.substring(colonIndex + 1).trim();
                }

                const alignClass = align === "right" ? "hud-chat-right" : "hud-chat-left";

                chatHtml += `
                    <div class="hud-chat-msg ${alignClass}">
                        <div class="hud-chat-sender">${sender}</div>
                        <div class="hud-chat-bubble">${text}</div>
                    </div>
                `;
            }

            chatHtml += `</div></div>`;
            return chatHtml;
        });

        if (html !== newHtml) {
            $(this).html(newHtml);
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
        // ผูกอีเวนต์เมื่อเลือกสีใหม่
        $("#hud_ui_color").on("input", onColorChange);

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
