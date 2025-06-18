import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Criminal, Statute, Crime } from '$lib/data/types';
import { db } from '$lib/server/db';
import { crimes, statutes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, fetch, request }) => {
    const criminalId = parseInt(params.id); // Parse criminalId to number
    const criminalResponse = await fetch(`http://localhost:5173/api/criminals/${criminalId}`, {
        headers: {
            cookie: request.headers.get('cookie') ?? ''
        }
    });

    if (!criminalResponse.ok) {
        throw error(criminalResponse.status, 'Criminal not found');
    }

    const criminalItem: Criminal = await criminalResponse.json();

    const allStatutes: Statute[] = await db.select().from(statutes);
    const criminalCrimes: Crime[] = await db.select().from(crimes).where(eq(crimes.criminalId, criminalId));

    return {
        criminal: criminalItem,
        statutes: allStatutes,
        criminalCrimes: criminalCrimes
    };
};

export const actions: Actions = {
  default: async ({ request, params }) => {
    const criminalId = params.id;
    const data = await request.formData();
    const firstName = data.get('firstName')?.toString();
    const lastName = data.get('lastName')?.toString();
    const dateOfBirth = data.get('dateOfBirth')?.toString();
    const address = data.get('address')?.toString();
    const phone = data.get('phone')?.toString();
    const email = data.get('email')?.toString();

    if (!firstName || !lastName) {
      return {
        status: 400,
        body: {
          message: 'First name and last name are required'
        }
      };
    }    const response = await fetch(`http://localhost:5173/api/criminals/${criminalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? ''
      },
      body: JSON.stringify({
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || null,
        address: address || null,
        phone: phone || null,
        email: email || null
      })
    });

    if (response.ok) {
      throw redirect(303, `/criminals/${criminalId}`);
    } else {
      const errorData = await response.json();
      return {
        status: response.status,
        body: {
          message: errorData.error || 'Failed to update criminal'
        }
      };
    }
  },
  addCrime: async ({ request, params }) => {
    const criminalId = parseInt(params.id); // Parse criminalId to number
    const data = await request.formData();
    const crimeName = data.get('crimeName')?.toString();
    const crimeDescription = data.get('crimeDescription')?.toString();
    const statuteId = data.get('statuteId')?.toString();

    if (!crimeName || !statuteId) {
      return {
        status: 400,
        body: {
          message: 'Crime name and statute are required'
        }
      };
    }

    try {
      await db.insert(crimes).values({
        name: crimeName,
        description: crimeDescription || null,
        criminalId: criminalId,
        statuteId: parseInt(statuteId)
      } as any);
      return { status: 201, body: { message: 'Crime added successfully' } };
    } catch (error) {
      console.error('Error adding crime:', error);
      return { status: 500, body: { message: 'Failed to add crime' } };
    }
  },  delete: async ({ params, request }) => {
    const criminalId = params.id;
    const response = await fetch(`http://localhost:5173/api/criminals/${criminalId}`, {
      method: 'DELETE',
      headers: {
        cookie: request.headers.get('cookie') ?? ''
      }
    });

    if (response.ok) {
      throw redirect(303, '/criminals');
    } else {
      const errorData = await response.json();
      return {
        status: response.status,
        body: {
          message: errorData.error || 'Failed to delete criminal'
        }
      };
    }
  }
};