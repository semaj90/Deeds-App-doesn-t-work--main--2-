import Loki from 'lokijs';

const db = new Loki('cache.db');
const collections: Record<string, Collection<any>> = {};

export function getCollection(name: string) {
  if (!collections[name]) {
    collections[name] = db.addCollection(name, { ttl: 60000, ttlInterval: 60 });
  }
  return collections[name];
}

export function clearCache(name: string, key: string) {
  const col = collections[name];
  if (col) {
    const doc = col.findOne({ key });
    if (doc) col.remove(doc);
  }
}
