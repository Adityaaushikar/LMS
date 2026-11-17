import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
  redirect(307, `/org/${params.slug}/dash`);
};
