let private_env = {};
let public_env = {};
let safe_public_env = {};
function set_private_env(environment) {
  private_env = environment;
}
function set_public_env(environment) {
  public_env = environment;
}
function set_safe_public_env(environment) {
  safe_public_env = environment;
}
let building = false;
let prerendering = false;
function set_building() {
  building = true;
}
function set_prerendering() {
  prerendering = true;
}
export {
  set_prerendering as a,
  building as b,
  set_private_env as c,
  set_public_env as d,
  set_safe_public_env as e,
  public_env as f,
  safe_public_env as g,
  prerendering as h,
  private_env as p,
  set_building as s
};
