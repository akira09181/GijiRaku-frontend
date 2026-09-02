/** Client-side switches to reduce backend/Firestore load on the free tier. */

export function shouldLoadCitizenAnswerCounts(): boolean {
  return process.env.NEXT_PUBLIC_SKIP_CITIZEN_ANSWER_COUNTS !== '1';
}

export function shouldLoadListReactions(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_LIST_REACTIONS === '1';
}
