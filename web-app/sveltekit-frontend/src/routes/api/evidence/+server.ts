import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    // Mock evidence data - replace with actual database query
    const evidence = [
      {
        id: '1',
        title: 'Surveillance Video - Main Street',
        type: 'video',
        caseId: '1',
        uploadedBy: 'Officer Smith',
        uploadedAt: new Date().toISOString(),
        description: 'Security footage from the incident location',
        status: 'verified'
      },
      {
        id: '2',
        title: 'Witness Statement - John Doe',
        type: 'document',
        caseId: '1',
        uploadedBy: 'Detective Johnson',
        uploadedAt: new Date(Date.now() - 3600000).toISOString(),
        description: 'Written statement from key witness',
        status: 'pending'
      },
      {
        id: '3',
        title: 'Fingerprint Analysis',
        type: 'forensic',
        caseId: '2',
        uploadedBy: 'Lab Tech Davis',
        uploadedAt: new Date(Date.now() - 7200000).toISOString(),
        description: 'Fingerprint analysis results',
        status: 'verified'
      }
    ];

    return json(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Mock response - replace with actual database insertion
    const newEvidence = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      uploadedAt: new Date().toISOString(),
      status: 'pending'
    };

    return json(newEvidence, { status: 201 });
  } catch (error) {
    console.error('Error creating evidence:', error);
    return json({ error: 'Failed to create evidence' }, { status: 500 });
  }
};
