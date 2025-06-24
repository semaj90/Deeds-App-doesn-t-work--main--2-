import { h as head, p as pop, c as push } from "../../../chunks/index2.js";
import "../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Logging out... - WardenNet</title>`;
  });
  $$payload.out += `<div class="max-w-md mx-auto p-6 text-center"><div class="card bg-base-100 shadow-xl"><div class="card-body"><h2 class="card-title justify-center">Logging out...</h2> <p>Please wait while we log you out securely.</p> <div class="flex justify-center mt-4"><span class="loading loading-spinner loading-lg"></span></div></div></div></div>`;
  pop();
}
export {
  _page as default
};
