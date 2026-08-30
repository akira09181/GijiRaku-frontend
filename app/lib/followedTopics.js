// @ts-check

export const FOLLOWED_TOPICS_STORAGE_KEY = 'machivoice_followed_topics_v1';

/**
 * @typedef {Object} FollowedTopic
 * @property {string} discussion_id
 * @property {string} assembly_id
 * @property {string} municipality_name
 * @property {string} theme_name
 * @property {string} followed_at
 */

/**
 * @typedef {Object} FollowableTopicInput
 * @property {string} discussion_id
 * @property {string} assembly_id
 * @property {string} municipality_name
 * @property {string} theme_name
 */

/** @typedef {Pick<Storage, 'getItem' | 'setItem'>} StorageLike */

/** @param {unknown} value */
function isFollowedTopic(value) {
  if (!value || typeof value !== 'object') return false;
  const item = /** @type {Record<string, unknown>} */ (value);
  return [
    item.discussion_id,
    item.assembly_id,
    item.municipality_name,
    item.theme_name,
    item.followed_at,
  ].every((field) => typeof field === 'string' && field.trim().length > 0);
}

/**
 * @param {string | null} rawValue
 * @returns {FollowedTopic[]}
 */
export function parseFollowedTopics(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed.filter((item) => {
      if (!isFollowedTopic(item) || seen.has(item.discussion_id)) return false;
      seen.add(item.discussion_id);
      return true;
    });
  } catch {
    return [];
  }
}

/**
 * @param {StorageLike} storage
 * @returns {FollowedTopic[]}
 */
export function loadFollowedTopics(storage) {
  try {
    return parseFollowedTopics(storage.getItem(FOLLOWED_TOPICS_STORAGE_KEY));
  } catch {
    return [];
  }
}

/**
 * @param {StorageLike} storage
 * @param {FollowedTopic[]} topics
 */
export function saveFollowedTopics(storage, topics) {
  storage.setItem(FOLLOWED_TOPICS_STORAGE_KEY, JSON.stringify(topics));
}

/**
 * @param {FollowedTopic[]} topics
 * @param {string} discussionId
 */
export function isTopicFollowed(topics, discussionId) {
  return topics.some((topic) => topic.discussion_id === discussionId);
}

/** @param {FollowedTopic[]} topics */
export function hasFollowedTopics(topics) {
  return topics.length > 0;
}

/**
 * @param {StorageLike} storage
 * @param {FollowedTopic[]} currentTopics
 * @param {FollowableTopicInput} topic
 * @param {string} [followedAt]
 * @returns {FollowedTopic[]}
 */
export function toggleFollowedTopic(
  storage,
  currentTopics,
  topic,
  followedAt = new Date().toISOString(),
) {
  const nextTopics = isTopicFollowed(currentTopics, topic.discussion_id)
    ? currentTopics.filter((item) => item.discussion_id !== topic.discussion_id)
    : [...currentTopics, { ...topic, followed_at: followedAt }];
  saveFollowedTopics(storage, nextTopics);
  return nextTopics;
}
