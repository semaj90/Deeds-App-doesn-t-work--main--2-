// Expose session and user to all layouts/pages (SSR)
export const load = async ({ locals }) => {
  return {
    session: locals.session || null,
    user: locals.user || null
  };
};
