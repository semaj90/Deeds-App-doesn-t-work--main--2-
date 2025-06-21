import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { criminals, statutes, caseCriminals } from '$lib/server/db/schema-new'; // Use unified schema
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, fetch, request }) => {
    const criminalId = params.id; // Use UUID string directly
    const criminalResponse = await fetch(`http://localhost:5173/api/criminals/${criminalId}`, {
        headers: {
            cookie: request.headers.get('cookie') ?? ''
        }
    });

    if (!criminalResponse.ok) {
        throw error(criminalResponse.status, 'Criminal not found');
    }

    const criminalItem = await criminalResponse.json();

    const allStatutes = await db.query.statutes.findMany(); // Use findMany
    const criminalCaseLinks = await db.query.caseCriminals.findMany({ where: eq(caseCriminals.criminalId, criminalId) }); // Use findMany

    return {
        criminal: criminalItem,
        statutes: allStatutes,
        criminalCaseLinks
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
  delete: async ({ params, request }) => {
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