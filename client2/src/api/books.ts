// src/api/books.ts
import API from '../config/api';

export async function fetchBooksWithCovers(userId: string) {
  const { data } = await API.get(`/books`, { params: { userId } });
  return data; // each item has cover_url (and optionally cover_base)
}
