import { apiFetch, type RequestOptions, type UploadListItem } from "./api-client";

type Context = Pick<RequestOptions, "cookie" | "signal">;
export interface SavedFilter {
  id: string; name: string; search: string; kind: string; tag: string | null;
  favoritesOnly: boolean; period: string; sort: string; direction: string;
}
export interface Album {
  id: string; code: string; title: string; description: string | null; expiresAt: string | null;
  showOnBio: boolean; uploadIds: string[];
  files: { id: string; name: string }[];
}
export type AlbumInput = Omit<Album, "id" | "code" | "files">;
export interface UploadPreset {
  id: string; name: string; uploadDomainId: string | null; expirationDays: number | null;
  maxViews: number | null; embedTitle: string | null; embedDescription: string | null;
  embedColor: string | null; stripMetadata: boolean;
}
export interface FileRequest {
  id: string; code: string; albumId: string; title: string; description: string | null;
  expiresAt: string; maxFiles: number; maxFileSize: number; submittedCount: number; isClosed: boolean;
}
export interface UploadSettings {
  displayName: string; tags: string[]; isFavorite: boolean; isRevoked: boolean;
  expiresAt: string | null; maxViews: number | null; accessMode: string; password?: string;
}
export interface PublicAlbum {
  title: string; description: string | null; expiresAt: string | null;
  items: { id: string; name: string; mimeType: string; size: number; url: string; width: number | null; height: number | null }[];
}
export interface RequestPage { title: string; description: string | null; expiresAt: string; maxFileSize: number; remainingFiles: number }

export const library = {
  file: (id: string, o?: Context) => apiFetch<UploadListItem>(`/uploads/${encodeURIComponent(id)}`, o),
  updateFile: (id: string, body: UploadSettings) => apiFetch(`/uploads/${encodeURIComponent(id)}`, { method: "PUT", body }),
  restore: (id: string) => apiFetch(`/uploads/${encodeURIComponent(id)}/restore`, { method: "POST" }),
  remove: (id: string, permanent = false) => apiFetch(`/uploads/${encodeURIComponent(id)}`, { method: "DELETE", query: { permanent } }),
  approve: (id: string) => apiFetch(`/uploads/${encodeURIComponent(id)}/approve`, { method: "POST" }),
  filters: (o?: Context) => apiFetch<{ filters: SavedFilter[] }>("/saved-filters", o),
  saveFilter: (body: Omit<SavedFilter, "id">) => apiFetch("/saved-filters", { method: "POST", body }),
  deleteFilter: (id: string) => apiFetch(`/saved-filters/${id}`, { method: "DELETE" }),
  albums: (o?: Context) => apiFetch<{ albums: Album[] }>("/albums", o),
  saveAlbum: (body: AlbumInput, id?: string) => apiFetch<{ id: string; code: string }>(id ? `/albums/${id}` : "/albums", { method: id ? "PUT" : "POST", body }),
  deleteAlbum: (id: string) => apiFetch(`/albums/${id}`, { method: "DELETE" }),
  publicAlbum: (code: string, o?: Context) => apiFetch<PublicAlbum>(`/public/albums/${encodeURIComponent(code)}`, o),
  bioAlbums: (username: string, o?: Context) => apiFetch<{ albums: Pick<Album, "code" | "title" | "description">[] }>(`/public/bio/${encodeURIComponent(username)}/albums`, o),
  presets: (o?: Context) => apiFetch<{ presets: UploadPreset[]; domains: { id: string; name: string; domain: string }[] }>("/upload-presets", o),
  savePreset: (body: Omit<UploadPreset, "id">) => apiFetch("/upload-presets", { method: "POST", body }),
  deletePreset: (id: string) => apiFetch(`/upload-presets/${id}`, { method: "DELETE" }),
  requests: (o?: Context) => apiFetch<{ requests: FileRequest[] }>("/file-requests", o),
  createRequest: (body: Omit<FileRequest, "id" | "code" | "submittedCount" | "isClosed">) => apiFetch<{ id: string; code: string }>("/file-requests", { method: "POST", body }),
  closeRequest: (id: string) => apiFetch(`/file-requests/${id}`, { method: "DELETE" }),
  publicRequest: (code: string, o?: Context) => apiFetch<RequestPage>(`/public/file-requests/${encodeURIComponent(code)}`, o),
  submitRequest: (code: string, file: File) => { const body = new FormData(); body.append("file", file); return apiFetch(`/public/file-requests/${encodeURIComponent(code)}`, { method: "POST", body }); },
  revisions: (o?: Context) => apiFetch<{ hasDraft: boolean; revisions: { id: string; createdAt: string }[] }>("/bio/revisions", o),
  publishBio: () => apiFetch("/bio/draft/publish", { method: "POST" }),
  restoreBio: (id: string) => apiFetch(`/bio/revisions/${id}/restore`, { method: "POST" }),
  editLink: (id: string, url: string, isPaused: boolean) => apiFetch(`/short-links/${id}`, { method: "PUT", body: { url, isPaused } }),
  linkHistory: (id: string) => apiFetch<{ history: { id: string; url: string; changedAt: string }[] }>(`/short-links/${id}/history`),
};
