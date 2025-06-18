import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST({ request, params }) {
    const criminalId = params.id;
    const data = await request.formData();
    const photo = data.get('photo') as File;

    if (!photo) {
        return json({ error: 'No photo provided' }, { status: 400 });
    }

    try {
        // Create uploads directory if it doesn't exist
        const uploadDir = 'static/uploads/criminals';
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const fileExt = photo.name.split('.').pop();
        const fileName = `${criminalId}-${Date.now()}.${fileExt}`;
        const filePath = join(uploadDir, fileName);

        // Write file to disk
        const arrayBuffer = await photo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filePath, buffer);

        // Update database with photo URL
        const photoUrl = `/uploads/criminals/${fileName}`;
        await db.update(criminals)
            .set({ photoUrl })
            .where(eq(criminals.id, criminalId));

        return json({ photoUrl });
    } catch (error) {
        console.error('Error handling photo upload:', error);
        return json({ error: 'Failed to upload photo' }, { status: 500 });
    }
}
