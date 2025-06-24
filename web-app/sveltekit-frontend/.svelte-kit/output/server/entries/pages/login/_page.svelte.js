import { h as head, b as attr, p as pop, c as push } from "../../../chunks/index2.js";
import "../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  let loading = false;
  let email = "";
  let password = "";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Login - Prosecutor Case Management</title>`;
  });
  $$payload.out += `<div class="min-h-screen bg-gradient-to-br from-blue-500/20 via-gray-50 to-indigo-500/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"><div class="max-w-md w-full space-y-8"><div class="text-center"><div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4"><svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"></path></svg></div> <h2 class="text-3xl font-extrabold text-gray-900">Prosecutor Case Management</h2> <p class="mt-2 text-sm text-gray-600">Sign in to your account</p> <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"><p class="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p> <div class="space-y-2"><button type="button" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors">Admin: admin@example.com / admin123</button> <button type="button" class="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors ml-2">User: user@example.com / user123</button></div></div></div> <form class="mt-8 space-y-6">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="rounded-md shadow-sm -space-y-px"><div><label for="email" class="sr-only">Email address</label> <input id="email" name="email" type="email" autocomplete="email" required${attr("value", email)} class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address"/></div> <div><label for="password" class="sr-only">Password</label> <input id="password" name="password" type="password" autocomplete="current-password" required${attr("value", password)} class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password"/></div></div> <div class="flex items-center justify-between"><div class="flex items-center"><input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/> <label for="remember-me" class="ml-2 block text-sm text-gray-900">Remember me</label></div> <div class="text-sm"><a href="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500">Forgot your password?</a></div></div> <div><button type="submit"${attr("disabled", loading, true)} class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `Sign in`;
  }
  $$payload.out += `<!--]--></button></div> <div class="text-center"><p class="text-sm text-gray-600">Don't have an account? <a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">Sign up</a></p></div></form></div></div>`;
  pop();
}
export {
  _page as default
};
