import { i as bind_props, p as pop, c as push, m as maybe_selected, b as attr, s as store_get, j as copy_payload, k as assign_payload, u as unsubscribe_stores, l as slot } from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import "../../chunks/client.js";
function Settings($$payload, $$props) {
  push();
  let isOpen = $$props["isOpen"];
  let settings = $$props["settings"];
  if (isOpen) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="settings-modal"><div class="settings-content"><h2>Settings</h2> <form><label>Theme: <select>`;
    $$payload.select_value = settings.theme;
    $$payload.out += `<option value="light"${maybe_selected($$payload, "light")}>Light</option><option value="dark"${maybe_selected($$payload, "dark")}>Dark</option>`;
    $$payload.select_value = void 0;
    $$payload.out += `</select></label> <label>Language: <select>`;
    $$payload.select_value = settings.language;
    $$payload.out += `<option value="en"${maybe_selected($$payload, "en")}>English</option><option value="es"${maybe_selected($$payload, "es")}>Spanish</option>`;
    $$payload.select_value = void 0;
    $$payload.out += `</select></label> <label>TTS Engine: <select>`;
    $$payload.select_value = settings.ttsEngine;
    $$payload.out += `<option value="default"${maybe_selected($$payload, "default")}>Default</option><option value="engine1"${maybe_selected($$payload, "engine1")}>Engine 1</option>`;
    $$payload.select_value = void 0;
    $$payload.out += `</select></label> <label>Voice Language: <select>`;
    $$payload.select_value = settings.voiceLanguage;
    $$payload.out += `<option value="en-US"${maybe_selected($$payload, "en-US")}>English (US)</option><option value="en-GB"${maybe_selected($$payload, "en-GB")}>English (UK)</option><option value="es-ES"${maybe_selected($$payload, "es-ES")}>Spanish (Spain)</option>`;
    $$payload.select_value = void 0;
    $$payload.out += `</select></label> <label>Enable Suggestions: <input type="checkbox"${attr("checked", settings.enableSuggestions, true)}/></label> <label>Enable Masking: <input type="checkbox"${attr("checked", settings.enableMasking, true)}/></label> <label>Enable Auto-Save: <input type="checkbox"${attr("checked", settings.enableAutoSave, true)}/></label> <label>Max History Items: <input type="number"${attr("value", settings.maxHistoryItems)}/></label> <label>Enable Notifications: <input type="checkbox"${attr("checked", settings.enableNotifications, true)}/></label> <label>Font Family: <select>`;
    $$payload.select_value = settings.fontFamily;
    $$payload.out += `<option value="Arial"${maybe_selected($$payload, "Arial")}>Arial</option><option value="Courier New"${maybe_selected($$payload, "Courier New")}>Courier New</option><option value="Georgia"${maybe_selected($$payload, "Georgia")}>Georgia</option><option value="Times New Roman"${maybe_selected($$payload, "Times New Roman")}>Times New Roman</option>`;
    $$payload.select_value = void 0;
    $$payload.out += `</select></label> <label>Font Size: <input type="text"${attr("value", settings.fontSize)} placeholder="e.g., 16px"/></label> <button type="submit">Save Settings</button></form></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { isOpen, settings });
  pop();
}
function _layout($$payload, $$props) {
  push();
  var $$store_subs;
  let user = store_get($$store_subs ??= {}, "$page", page).data?.user;
  let showSettings = false;
  let settings = {
    theme: "light",
    language: "en",
    ttsEngine: "",
    voiceLanguage: "",
    enableSuggestions: true,
    enableMasking: false,
    enableAutoSave: true,
    maxHistoryItems: 50,
    enableNotifications: true,
    fontFamily: "Inter",
    fontSize: "16px"
  };
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<nav class="navbar bg-base-100 shadow mb-4"><div class="container mx-auto flex justify-between items-center py-2 px-4"><div class="flex items-center gap-4"><a href="/" class="font-bold text-lg">WardenNet</a> <a href="/cases">Cases</a> <a href="/evidence">Evidence</a> <a href="/law">Law</a> <a href="/ai">AI Prompt</a> <a href="/ai-assistant">AI Assistant</a></div> <div class="flex items-center gap-2"><button class="btn btn-ghost btn-sm" title="Settings">⚙️</button> `;
    if (user) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<a href="/profile">Profile</a> <a href="/logout">Logout</a>`;
    } else {
      $$payload2.out += "<!--[!-->";
      $$payload2.out += `<a href="/login">Login</a> <a href="/register">Register</a>`;
    }
    $$payload2.out += `<!--]--></div></div></nav> <main class="container mx-auto px-4"><!---->`;
    slot($$payload2, $$props, "default", {});
    $$payload2.out += `<!----></main> `;
    Settings($$payload2, {
      get isOpen() {
        return showSettings;
      },
      set isOpen($$value) {
        showSettings = $$value;
        $$settled = false;
      },
      get settings() {
        return settings;
      },
      set settings($$value) {
        settings = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!---->`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _layout as default
};
