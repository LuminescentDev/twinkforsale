import type { RequestHandler } from "@builder.io/qwik-city";

/**
 * Files moved to `/dashboard`. This path is kept as a permanent redirect so
 * existing bookmarks and ShareX-era links keep working.
 */
export const onGet: RequestHandler = ({ redirect, url }) => {
  throw redirect(308, `/dashboard${url.search}`);
};
