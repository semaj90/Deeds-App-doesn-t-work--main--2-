import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { UploadThingError } from 'uploadthing/server';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/unified-schema';
import type { RequestHandler } from './$types';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 10 },
    video: { maxFileSize: '16MB', maxFileCount: 5 },
    audio: { maxFileSize: '8MB', maxFileCount: 5 },
    'application/pdf': { maxFileSize: '16MB', maxFileCount: 5 },
    'text/plain': { maxFileSize: '4MB', maxFileCount: 10 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { maxFileSize: '8MB', maxFileCount: 5 }, // DOCX
  })
    // Set permissions and file-specific logic for this FileRoute
    .middleware(async ({ req }) => {
      // This is where you can check authentication and other conditions
      // For now, we'll allow all uploads. In a real app, you'd verify user session.
      console.log('Uploadthing middleware triggered');
      // You can also access headers, cookies, etc. from the request
      // const user = await auth(req); // Example: get user from your auth system
      // if (!user) throw new UploadThingError('Unauthorized');

      const url = new URL(req.url);
      const caseId = url.searchParams.get('caseId');

      if (!caseId) {
        console.warn('No caseId provided in upload request. Using placeholder.');
      }

      return { userId: 'mock-user-id', caseId: caseId || '00000000-0000-0000-0000-000000000000' }; // Whatever is returned here is accessible in onUploadComplete
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File details:', file);
      console.log('Case ID from metadata:', metadata.caseId);

      // You can save file details to your database here
      await db.insert(evidence).values({
        caseId: metadata.caseId, // Use the caseId from middleware metadata
        uploadedBy: metadata.userId, // Use the userId from middleware
        title: file.name, // Use file name as title
        description: `Uploaded file: ${file.name}`,
        fileName: file.name,
        fileUrl: file.url, // URL provided by Uploadthing
        mimeType: file.type,
        fileSize: file.size,
        evidenceType: 'digital', // Default to 'digital', can be refined based on file.type
        uploadedAt: new Date(),
        // summary: null, // AI summary to be generated later
        // aiTags: [], // AI tags to be generated later
        // originalContent: null, // For text-based files, fetch content later
      });

      console.log('Upload finished.');
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// For now, return a simple response until UploadThing is properly configured
export const POST: RequestHandler = async ({ request }) => {
  return json({ message: 'Upload endpoint placeholder - UploadThing configuration needed' });
};

export const GET: RequestHandler = async () => {
  return json({ message: 'Upload endpoint available' });
};