const API_BASE = import.meta.env.VITE_API_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Will be replaced with Cognito token once auth is set up
  return {}
}

export async function getProvisions(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/provisions`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch provisions')
  const data = await res.json()
  return data.provisions ?? []
}

export async function createProvision(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/provisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create provision')
  return res.json()
}

export async function updateProvision(id: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/provisions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update provision')
  return res.json()
}

export async function deleteProvision(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/provisions/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete provision')
}

export async function getExpenses(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/expenses`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch expenses')
  const data = await res.json()
  return data.expenses ?? []
}

export async function createExpense(data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create expense')
  return res.json()
}

export async function updateExpense(id: string, data: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update expense')
  return res.json()
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete expense')
}

export async function getBudgets(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/budgets`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch budgets')
  const data = await res.json()
  return data.budgets ?? []
}

export async function saveBudget(data: Record<string, any>): Promise<any> {
  const { id, ...rest } = data
  if (id) {
    const res = await fetch(`${API_BASE}/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(rest),
    })
    if (!res.ok) throw new Error('Failed to update budget')
    return res.json()
  }
  const res = await fetch(`${API_BASE}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(rest),
  })
  if (!res.ok) throw new Error('Failed to create budget')
  return res.json()
}

export async function deleteBudget(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/budgets/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete budget')
}

export async function carryOverBudgets(data: { month: number; year: number }): Promise<void> {
  await fetch(`${API_BASE}/budgets/carry-over`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(data),
  })
}

export async function saveExpense(data: Record<string, any>): Promise<any> {
  const { id, ...rest } = data
  if (id) {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(rest),
    })
    if (!res.ok) throw new Error('Failed to update expense')
    return res.json()
  }
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(rest),
  })
  if (!res.ok) throw new Error('Failed to create expense')
  return res.json()
}

export async function saveProvision(data: Record<string, any>): Promise<any> {
  const { id, ...rest } = data
  if (id) {
    const res = await fetch(`${API_BASE}/provisions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
      body: JSON.stringify(rest),
    })
    if (!res.ok) throw new Error('Failed to update provision')
    return res.json()
  }
  const res = await fetch(`${API_BASE}/provisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify(rest),
  })
  if (!res.ok) throw new Error('Failed to create provision')
  return res.json()
}

export async function toggleProvisionActive(id: string, active: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/provisions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await getAuthHeaders() },
    body: JSON.stringify({ active }),
  })
  if (!res.ok) throw new Error('Failed to toggle provision')
  return res.json()
}

export async function getMarkers(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/markers`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch markers')
  return res.json()
}
