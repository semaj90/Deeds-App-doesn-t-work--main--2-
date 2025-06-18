import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const code = data.get('code')?.toString();
    const title = data.get('title')?.toString();
    const description = data.get('description')?.toString();
    const tagsInput = data.get('tags')?.toString();
    const aiSummary = data.get('aiSummary')?.toString();

    if (!code || !title) {
      return fail(400, {
        code,
        title,
        description,
        tagsInput,
        aiSummary,
        message: 'Code and Title are required.',
      });
    }

    const tagsArray = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

    try {
      await db.insert(statutes).values({
        code,
        title,
        description,
        tags: tagsArray,
        aiSummary,
      });
    } catch (error) {
      console.error('Error inserting statute:', error);
      return fail(500, {
        code,
        title,
        description,
        tagsInput,
        aiSummary,
        message: 'Failed to add statute due to a server error.',
      });
    }

    throw redirect(302, '/statutes');
  },
};