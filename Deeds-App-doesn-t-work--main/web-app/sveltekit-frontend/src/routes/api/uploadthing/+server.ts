import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
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
      return { userId: 'mock-user-id' }; // Whatever is returned here is accessible in onUploadComplete
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File details:', file);

      // You can save file details to your database here
      // For example:
      // await db.insert(evidence).values({
      //   caseId: 1, // This would come from context or metadata
      //   fileName: file.name,
      //   filePath: file.url, // URL provided by Uploadthing
      //   fileType: file.type,
      //   fileSize: file.size,
      //   uploadDate: new Date(),
      //   summary: null, // AI summary to be generated later
      //   tags: [], // AI tags to be generated later
      //   originalContent: null, // For text-based files, fetch content later
      // });

      console.log('Upload finished.');
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;