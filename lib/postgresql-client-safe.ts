// Safe PostgreSQL client that prevents client-side usage
export const query = (...args: any[]) => {
  if (typeof window !== 'undefined') {
    throw new Error('PostgreSQL client cannot be used on client side. Use API endpoints instead.')
  }
  // This should only run on server side
  const { query: serverQuery } = require('./postgresql-client')
  return serverQuery(...args)
}

export const pool = typeof window !== 'undefined' ? null : require('./postgresql-client').pool
