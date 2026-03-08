// Suppress Dexie module declaration issue with TS 5.8+
declare module 'dexie' {
  export * from 'dexie';
}
