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

        // 5. ดักจับ [EVENT_UI] สำหรับคำถามและตัวเลือก
        if (newHtml.includes("[EVENT_UI]")) {
            const eventRegex = /\[EVENT_UI\]([\s\S]*?)\[\/EVENT_UI\]/g;
            newHtml = newHtml.replace(eventRegex, (match, innerText) => {
                let questionText = "เหตุการณ์ใหม่";
                let choicesHtml = "";

                // ลบแท็ก <p> และ <br> ที่ SillyTavern แอบใส่มาอัตโนมัติออกก่อน
                let cleanText = innerText.replace(/<\/?p[^>]*>/gi, "").replace(/<br\s*\/?>/gi, "");

                const questionMatch = cleanText.match(/\[QUESTION\]([\s\S]*?)\[\/QUESTION\]/);
                if (questionMatch) {
                    questionText = questionMatch[1].trim();
                }

                const choicesMatch = cleanText.match(/\[CHOICES\]([\s\S]*?)\[\/CHOICES\]/);
                if (choicesMatch) {
                    const choicesContent = choicesMatch[1].trim();
                    const items = choicesContent.split("|").map(item => item.trim()).filter(item => item.length > 0);

                    items.forEach(item => {
                        // ลบแท็ก HTML ที่อาจหลงเหลืออยู่ออก เพื่อป้องกันบั๊กตอนนำไปใส่ใน data-choice
                        const plainText = item.replace(/<[^>]*>?/gm, "").trim();
                        // แปลงเครื่องหมายคำพูดให้ปลอดภัย (ใช้ Double Quotes ครอบเพื่อป้องกัน Error)
                        const safeItem = plainText.split('"').join('&' + 'quot;').split("'").join('&' + '#39;');
                        choicesHtml += `<button class="hud-event-choice-btn" data-choice="${safeItem}">${item}</button>`;
                    });
                }

                return `
                    <div class="hud-event-container">
                        <div class="hud-event-question">
                            <div class="hud-event-icon-wrapper">
                                <i class="fa-solid fa-circle-exclamation hud-event-icon"></i>
                            </div>
                            <div class="hud-event-text">${questionText}</div>
                        </div>
                        <div class="hud-event-choices">
                            ${choicesHtml}
                        </div>
                    </div>
                `;
            });
        }

        // NEW: 6. ดักจับ [STATUS_CARD] สำหรับ Profile Card
        if (newHtml.includes("[STATUS_CARD]")) {
            const cardRegex = /\[STATUS_CARD\]([\s\S]*?)\[\/STATUS_CARD\]/g;

            // แอบดึงรูป Avatar และชื่อจากกล่องข้อความแชท (DOM) ของ SillyTavern
            const mesElement = $(this).closest('.mes');
            const defaultAvatar = mesElement.find('.avatar img').attr('src') || '';
            const defaultName = mesElement.attr('ch_name') || 'UNKNOWN';

            newHtml = newHtml.replace(cardRegex, (match, innerText) => {
                let cleanText = innerText.replace(/<[^>]*>/gi, '').replace(/\u200B/gi, '');

                let cardName = defaultName;
                let statsHtml = '';

                // ดึงชื่อ (ถ้ามีการระบุทับไว้ในแท็ก จะใช้ชื่อนี้แทนชื่อเริ่มต้น)
                const nameMatch = cleanText.match(/\[NAME\]([\s\S]*?)\[\/NAME\]/);
                if (nameMatch) {
                    cardName = nameMatch[1].trim();
                }

                // ดึงสเตตัส
                const statsMatch = cleanText.match(/\[STATS\]([\s\S]*?)\[\/STATS\]/);
                if (statsMatch) {
                    const statsContent = statsMatch[1].trim();
                    const items = statsContent.split('|').map(item => item.trim()).filter(item => item.length > 0);

                    items.forEach(item => {
                        const parts = item.split(':');
                        const key = parts[0] ? parts[0].trim() : '';
                        const value = parts.slice(1).join(':').trim();

                        if (value) {
                            let isBar = false;
                            let percent = 0;

                            const fractionMatch = value.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
                            const percentMatch = value.match(/^\s*(\d+(?:\.\d+)?)\s*%\s*$/);

                            if (fractionMatch) {
                                const current = parseFloat(fractionMatch[1]);
                                const max = parseFloat(fractionMatch[2]);
                                if (max > 0) {
                                    percent = Math.min(100, Math.max(0, (current / max) * 100));
                                    isBar = true;
                                }
                            } else if (percentMatch) {
                                percent = Math.min(100, Math.max(0, parseFloat(percentMatch[1])));
                                isBar = true;
                            }

                            if (isBar) {
                                statsHtml += `
                                    <div class="hud-card-stat-bar">
                                        <div class="hud-card-stat-header">
                                            <span class="hud-card-stat-key">${key}</span>
                                            <span class="hud-card-stat-value">${value}</span>
                                        </div>
                                        <div class="hud-bar-bg">
                                            <div class="hud-bar-fill" style="width: ${percent}%;"></div>
                                        </div>
                                    </div>`;
                            } else {
                                statsHtml += `
                                    <div class="hud-card-stat-text">
                                        <span class="hud-card-stat-key">${key}:</span>
                                        <span class="hud-card-stat-value">${value}</span>
                                    </div>`;
                            }
                        }
                    });
                }

                return `
                    <div class="hud-card-container">
                        <div class="hud-card-left">
                            <div class="hud-card-avatar-wrapper">
                                <img src="${defaultAvatar}" class="hud-card-avatar" alt="Avatar">
                            </div>
                            <div class="hud-card-name">${cardName}</div>
                        </div>
                        <div class="hud-card-right">
                            ${statsHtml}
                        </div>
                    </div>
                `;
            });
        }

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

        // NEW: ผูกอีเวนต์เมื่อกดปุ่มตัวเลือก (Choice)
        $(document).on("click", ".hud-event-choice-btn", function() {
            const choiceText = $(this).data("choice");
            const textarea = $("#send_textarea");

            // นำข้อความไปต่อท้ายในช่องพิมพ์
            let currentVal = textarea.val();
            if (currentVal && !currentVal.endsWith(" ") && !currentVal.endsWith("\n")) {
                currentVal += " ";
            }

            textarea.val(currentVal + choiceText);
            textarea.trigger("input"); // แจ้งให้ SillyTavern รู้ว่ามีการพิมพ์
            textarea.focus(); // โฟกัสที่ช่องพิมพ์ให้ผู้ใช้พร้อมกดส่ง

            // แสดงเอฟเฟกต์ตอบรับเล็กน้อย
            $(this).css("transform", "scale(0.95)");
            setTimeout(() => $(this).css("transform", ""), 150);
        });

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
