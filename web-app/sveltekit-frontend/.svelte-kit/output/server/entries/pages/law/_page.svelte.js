import { h as head, b as attr, p as pop, c as push } from "../../../chunks/index2.js";
function _page($$payload, $$props) {
  push();
  let laws = [];
  let searchQuery = "";
  laws.filter((law) => law.title?.toLowerCase().includes(searchQuery.toLowerCase()) || law.description?.toLowerCase().includes(searchQuery.toLowerCase()) || law.code?.toLowerCase().includes(searchQuery.toLowerCase()));
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Law Database - WardenNet</title>`;
  });
  $$payload.out += `<div class="container mx-auto px-4 py-8"><div class="flex justify-between items-center mb-6"><h1 class="text-3xl font-bold">Law Database</h1> <a href="/law/add" class="btn btn-primary"><svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> Add Statute</a></div> <div class="mb-6"><div class="form-control"><label class="label" for="search"><span class="label-text">Search laws and statutes</span></label> <input type="text" id="search" placeholder="Search by title, description, or code..." class="input input-bordered w-full"${attr("value", searchQuery)}/></div></div> `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex justify-center items-center py-12"><div class="loading loading-spinner loading-lg"></div> <span class="ml-4">Loading laws...</span></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
export {
  _page as default
};
