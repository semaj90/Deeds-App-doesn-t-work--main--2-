import { s as store_get, h as head, b as attr, u as unsubscribe_stores, p as pop, c as push } from "../../../chunks/index2.js";
import { p as page } from "../../../chunks/stores.js";
import { g as goto } from "../../../chunks/client.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let user = store_get($$store_subs ??= {}, "$page", page).data?.user;
  if (!user) {
    goto();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Profile - WardenNet</title>`;
  });
  $$payload.out += `<div class="max-w-4xl mx-auto p-6"><h1 class="text-3xl font-bold mb-6">User Profile</h1> `;
  if (user) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="card bg-base-100 shadow-xl"><div class="card-body"><h2 class="card-title">Profile Information</h2> <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"><div><label class="label" for="email"><span class="label-text">Email</span></label> <input id="email" type="email" class="input input-bordered w-full"${attr("value", user.email || "")} readonly/></div> <div><label class="label" for="name"><span class="label-text">Name</span></label> <input id="name" type="text" class="input input-bordered w-full"${attr("value", user.name || "")} readonly/></div> <div><label class="label" for="role"><span class="label-text">Role</span></label> <input id="role" type="text" class="input input-bordered w-full"${attr("value", user.role || "User")} readonly/></div> <div><label class="label" for="memberSince"><span class="label-text">Member Since</span></label> <input id="memberSince" type="text" class="input input-bordered w-full"${attr("value", user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown")} readonly/></div></div> <div class="card-actions justify-end mt-6"><button class="btn btn-primary">Edit Profile</button></div></div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="alert alert-warning"><span>Please log in to view your profile.</span></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
