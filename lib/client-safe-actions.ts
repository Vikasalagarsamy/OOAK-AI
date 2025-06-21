// Client-safe actions that don't import PostgreSQL

export const getQuotations = async () => ({
  success: true,
  data: []
})

export const getQuotationByLeadId = async () => ({
  success: true,
  data: null
})

export const getQuotationServices = async () => ({
  success: true,
  data: []
})

export const getQuotationDeliverables = async () => ({
  success: true,
  data: []
})

export const updateQuotation = async () => ({
  success: true
})

export const createQuotation = async () => ({
  success: true
})

export const updateQuotationStatus = async () => ({
  success: true
})

export const deleteQuotation = async () => ({
  success: true
})

export const initializeQuotationsTable = async () => ({
  success: true
})

export const getQuotationsCountByStatus = async () => ({
  success: true,
  data: {}
})
