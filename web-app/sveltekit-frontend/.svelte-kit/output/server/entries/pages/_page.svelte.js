import { f as fallback, a as escape_html, i as bind_props, p as pop, c as push, d as attr_class, b as attr, h as head, e as ensure_array_like, q as stringify } from "../../chunks/index2.js";
function Typewriter($$payload, $$props) {
  push();
  let text = fallback($$props["text"], "");
  let speed = fallback($$props["speed"], 50);
  let output = "";
  let i = 0;
  let intervalId = null;
  if (text && i === 0) {
    output = "";
    i = 0;
    if (intervalId) {
      clearInterval(intervalId);
    }
    intervalId = setInterval(
      () => {
        if (i < text.length) {
          output += text[i];
          i++;
        } else {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      },
      speed
    );
  }
  $$payload.out += `<div class="typewriter svelte-1t0mpqg">${escape_html(output)}</div>`;
  bind_props($$props, { text, speed });
  pop();
}
function UploadArea($$payload, $$props) {
  push();
  let onUpload = fallback($$props["onUpload"], () => {
  });
  let acceptedTypes = fallback($$props["acceptedTypes"], ".pdf,.jpg,.jpeg,.png,.mp4,.avi,.mov,.mp3,.wav");
  let maxFiles = fallback($$props["maxFiles"], 10);
  let isDragOver = false;
  $$payload.out += `<div class="upload-area"><div${attr_class("drop-zone border border-2 border-dashed rounded p-5 text-center position-relative svelte-ucifcn", void 0, {
    "border-primary": isDragOver,
    "bg-light": isDragOver
  })} role="button" tabindex="0">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="default-state"><i class="bi bi-cloud-upload display-1 text-muted mb-3"></i> <h5>Drag &amp; Drop Evidence Files</h5> <p class="text-muted mb-4">Or click to browse files</p> <input type="file" multiple${attr("accept", acceptedTypes)} class="d-none" id="file-input"/> <label for="file-input" class="btn btn-outline-primary"><i class="bi bi-folder2-open me-2"></i> Browse Files</label> <div class="mt-3"><small class="text-muted">Supported: PDF, Images, Videos, Audio</small></div></div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  bind_props($$props, { onUpload, acceptedTypes, maxFiles });
  pop();
}
function _page($$payload, $$props) {
  push();
  let recentCases = [];
  let heroText = "Advanced Legal Case Management";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Prosecutor Case Management System</title>`;
    $$payload2.out += `<meta name="description" content="Advanced legal case management with AI-powered document analysis"/>`;
  });
  $$payload.out += `<section class="hero-section min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center svelte-1inhf8h"><div class="container mx-auto px-6 text-center"><div class="max-w-4xl mx-auto"><h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">`;
  Typewriter($$payload, { text: heroText, speed: 100 });
  $$payload.out += `<!----></h1> <p class="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">Harness the power of AI to analyze evidence, build stronger cases, and streamline your prosecution workflow</p> <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"><a href="/cases" class="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-lg font-semibold transition-colors duration-200 text-lg shadow-lg">View Cases</a> <a href="/upload" class="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold transition-colors duration-200 text-lg">Upload Evidence</a></div></div></div></section> <section class="py-16 bg-gray-50"><div class="container mx-auto px-6"><h2 class="text-4xl font-bold text-center mb-12 text-gray-800">Quick Actions</h2> <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"><div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300"><div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"><svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div> <h3 class="text-xl font-semibold mb-4 text-gray-800">AI-Powered Search</h3> <p class="text-gray-600 mb-6">Search through cases and evidence using natural language queries</p> <div class="flex gap-2"><input id="aiSearchInput" type="text" placeholder="Search cases, evidence, or legal precedents..." class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/> <button id="aiSearchBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">Search</button></div></div> <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300"><div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg></div> <h3 class="text-xl font-semibold mb-4 text-gray-800">Quick Evidence Upload</h3> <p class="text-gray-600 mb-6">Drag and drop files for instant AI analysis</p> `;
  UploadArea($$payload, {});
  $$payload.out += `<!----></div> <div class="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300"><div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6"><svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></div> <h3 class="text-xl font-semibold mb-4 text-gray-800">Case Analytics</h3> <p class="text-gray-600 mb-6">View insights and patterns across your cases</p> <a href="/dashboard" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 inline-block">View Dashboard</a></div></div></div></section> `;
  if (recentCases && recentCases.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(recentCases.slice(0, 6));
    $$payload.out += `<section class="py-16 bg-white"><div class="container mx-auto px-6"><h2 class="text-4xl font-bold text-center mb-12 text-gray-800">Recent Cases</h2> <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let caseItem = each_array[$$index];
      $$payload.out += `<div class="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 border"><div class="flex justify-between items-start mb-4"><h3 class="text-lg font-semibold text-gray-800 truncate">${escape_html(caseItem.title)}</h3> <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${escape_html(caseItem.status || "Active")}</span></div> <p class="text-gray-600 text-sm mb-4 line-clamp-3 svelte-1inhf8h">${escape_html(caseItem.description || "No description available")}</p> <div class="flex justify-between items-center text-sm text-gray-500"><span>Case #${escape_html(caseItem.id)}</span> <span>${escape_html(new Date(caseItem.createdAt).toLocaleDateString())}</span></div> <a${attr("href", `/cases/${stringify(caseItem.id)}`)} class="block mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm">View Details →</a></div>`;
    }
    $$payload.out += `<!--]--></div> <div class="text-center mt-12"><a href="/cases" class="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">View All Cases</a></div></div></section>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <section class="py-16 bg-gray-900 text-white"><div class="container mx-auto px-6"><h2 class="text-4xl font-bold text-center mb-12">Powerful Features</h2> <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"><div class="text-center"><div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div> <h3 class="text-lg font-semibold mb-2">Document Analysis</h3> <p class="text-gray-300 text-sm">AI-powered analysis of legal documents and evidence</p></div> <div class="text-center"><div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div> <h3 class="text-lg font-semibold mb-2">Case Tracking</h3> <p class="text-gray-300 text-sm">Comprehensive case management and progress tracking</p></div> <div class="text-center"><div class="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div> <h3 class="text-lg font-semibold mb-2">Smart Insights</h3> <p class="text-gray-300 text-sm">Generate insights and recommendations from case data</p></div> <div class="text-center"><div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div> <h3 class="text-lg font-semibold mb-2">Secure &amp; Private</h3> <p class="text-gray-300 text-sm">Bank-level security for sensitive legal information</p></div></div></div></section>`;
  pop();
}
export {
  _page as default
};
