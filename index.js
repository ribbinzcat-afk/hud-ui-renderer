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

// NEW: ฟังก์ชันค้นหาและแทนที่ข้อความในแชท
function renderHUD() {
    if (!extension_settings[extensionName].enabled) return;

    $(".mes_text").each(function () {
        let html = $(this).html();

        // ตรวจสอบว่ามีแท็ก [HUD_UI] หรือไม่
        if (html.includes("[HUD_UI]")) {
            // ดักจับข้อความที่อยู่ระหว่าง [HUD_UI] และ [/HUD_UI]
            const regex = /\[HUD_UI\]([\s\S]*?)\[\/HUD_UI\]/g;

            const newHtml = html.replace(regex, (match, innerText) => {
                return `<div class="hud-ui-container">
                    <div class="hud-ui-title">✨ HUD UI System ✨</div>
                    <div class="hud-ui-raw">${innerText}</div>
                </div>`;
            });

            // อัปเดตข้อความในแชทถ้ามีการเปลี่ยนแปลง
            if (html !== newHtml) {
                $(this).html(newHtml);
            }
        }
    });
}

jQuery(async () => {
    console.log(`[${extensionName}] Loading...`);

    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
        $("#extensions_settings2").append(settingsHtml);

        loadSettings();
        $("#hud_ui_enabled").on("input", onCheckboxChange);

        // ดักจับอีเวนต์เมื่อแชทมีการเปลี่ยนแปลง หรือมีข้อความใหม่
        eventSource.on(event_types.CHAT_CHANGED, renderHUD);
        eventSource.on(event_types.MESSAGE_RECEIVED, renderHUD);
        eventSource.on(event_types.MESSAGE_EDITED, renderHUD);

        // NEW: เพิ่มอีเวนต์เหล่านี้เพื่อแก้ปัญหาตอนปิดสตรีมมิ่ง
        eventSource.on(event_types.GENERATION_STOPPED, renderHUD); // ทำงานเมื่อบอทพิมพ์ข้อความเสร็จ (สำคัญมากตอนปิดสตรีม)
        eventSource.on(event_types.USER_MESSAGE_SENT, renderHUD); // ทำงานเมื่อผู้ใช้ส่งข้อความ
        eventSource.on(event_types.MESSAGE_SWIPED, renderHUD); // ทำงานเมื่อปัดเปลี่ยนข้อความ (Swipe)

        // รันครั้งแรกเมื่อโหลด Extension
        setTimeout(renderHUD, 1000);

        console.log(`[${extensionName}] ✅ Loaded successfully`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ Failed to load:`, error);
    }
});
