export async function apiFetch(endpoint: string, data: any) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export async function submitAssignment(courseId: string, courseWorkId: string, submissionData: any) {
  return apiFetch('/api/submit-assignment', {
    courseId,
    courseWorkId,
    ...submissionData
  });
}

export async function suggestGoals(user: any) {
  return apiFetch('/api/suggest-goals', { user });
}

export async function sendChatMessage(chatData: any) {
  return apiFetch('/api/ai-chat', chatData);
}
