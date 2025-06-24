import { e as ensure_array_like, h as head, a as escape_html, b as attr, p as pop, c as push } from "../../../chunks/index2.js";
function _page($$payload, $$props) {
  push();
  let prompt = "";
  const quickPrompts = [
    "Analyze this case for legal precedents",
    "Generate a prosecution strategy",
    "Summarize evidence findings",
    "Draft a legal brief outline",
    "Research similar cases",
    "Identify key witnesses to interview"
  ];
  const each_array = ensure_array_like(quickPrompts);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>AI Prompt - WardenNet</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="max-w-4xl mx-auto"><div class="text-center mb-8"><h1 class="text-3xl font-bold mb-2">AI Legal Assistant</h1> <p class="text-lg opacity-70">Get AI-powered insights for your legal work</p></div> <div class="mb-6"><h3 class="text-lg font-semibold mb-3">Quick Prompts</h3> <div class="flex flex-wrap gap-2"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let quickPrompt = each_array[$$index];
    $$payload.out += `<button class="btn btn-outline btn-sm">${escape_html(quickPrompt)}</button>`;
  }
  $$payload.out += `<!--]--></div></div> <div class="card bg-base-100 shadow-xl mb-6"><div class="card-body"><h2 class="card-title">Your Prompt</h2> <div class="form-control"><textarea class="textarea textarea-bordered h-32" placeholder="Enter your legal question or request for AI analysis...">`;
  const $$body = escape_html(prompt);
  if ($$body) {
    $$payload.out += `${$$body}`;
  }
  $$payload.out += `</textarea></div> <div class="card-actions justify-end"><button class="btn btn-ghost">Clear</button> <button class="btn btn-primary"${attr("disabled", !prompt.trim(), true)}>`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Submit Prompt`;
  }
  $$payload.out += `<!--]--></button></div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
export {
  _page as default
};
