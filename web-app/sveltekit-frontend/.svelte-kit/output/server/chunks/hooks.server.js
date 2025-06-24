const handle = async ({ event, resolve }) => {
  event.locals.user = null;
  event.locals.session = null;
  const protectedPaths = ["/dashboard", "/cases", "/evidence", "/profile"];
  const apiPaths = ["/api/auth/register", "/api/auth/login"];
  protectedPaths.some((path) => event.url.pathname.startsWith(path));
  const isPublicAPI = apiPaths.some((path) => event.url.pathname.startsWith(path));
  event.url.pathname.startsWith("/api/") && !isPublicAPI;
  return resolve(event);
};
export {
  handle
};
