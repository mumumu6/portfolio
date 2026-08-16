import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const path = resolve('src/data/generated/ai-content.json');
const value = JSON.parse(await readFile(path, 'utf8'));
const authors = new Set(['chatgpt', 'codex']);
const replyTargets = new Set(['mumumu', ...authors]);
const targetKinds = new Set(['work', 'blog', 'experience']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateReply(reply, location) {
  assert(reply && typeof reply === 'object' && !Array.isArray(reply), `${location} must be an object.`);
  assert(authors.has(reply.author), `${location}.author is invalid.`);
  assert(typeof reply.body === 'string' && reply.body.trim().length > 0, `${location}.body is required.`);
  assert(reply.body.length <= 280, `${location}.body exceeds 280 characters.`);
  assert(reply.createdAt === undefined || !Number.isNaN(Date.parse(reply.createdAt)), `${location}.createdAt is invalid.`);
  assert(reply.replyTo === undefined || replyTargets.has(reply.replyTo), `${location}.replyTo is invalid.`);
  assert(reply.depth === undefined || reply.depth === 1 || reply.depth === 2, `${location}.depth is invalid.`);
}

function validateReplyOrder(replies, location, parentDate) {
  let previous = parentDate;
  for (const [index, reply] of replies.entries()) {
    validateReply(reply, `${location}[${index}]`);
    if (reply.createdAt && previous) {
      assert(Date.parse(reply.createdAt) >= Date.parse(previous), `${location}[${index}] is older than the message before it.`);
    }
    if (reply.createdAt) previous = reply.createdAt;
  }
}

assert(value && typeof value === 'object' && !Array.isArray(value), 'AI content must be an object.');
assert(Array.isArray(value.comments), 'comments must be an array.');
assert(Array.isArray(value.thoughts), 'thoughts must be an array.');

const targets = new Set();
for (const [index, comment] of value.comments.entries()) {
  const location = `comments[${index}]`;
  assert(comment?.target && typeof comment.target === 'object', `${location}.target is required.`);
  assert(targetKinds.has(comment.target.kind), `${location}.target.kind is invalid.`);
  assert(typeof comment.target.id === 'string' && comment.target.id.length > 0, `${location}.target.id is required.`);
  assert(Array.isArray(comment.replies) && comment.replies.length > 0, `${location}.replies must not be empty.`);
  assert(comment.replies.length <= 6, `${location}.replies exceeds 6 items.`);
  validateReplyOrder(comment.replies, `${location}.replies`);

  const target = `${comment.target.kind}:${comment.target.id}`;
  assert(!targets.has(target), `Duplicate comment target: ${target}`);
  targets.add(target);
}

const thoughtIds = new Set();
for (const [index, thought] of value.thoughts.entries()) {
  const location = `thoughts[${index}]`;
  assert(/^thought-\d{4}-\d{2}-\d{2}-(chatgpt|codex)(?:-[2-3])?$/.test(thought.id), `${location}.id is invalid.`);
  assert(!thoughtIds.has(thought.id), `Duplicate thought id: ${thought.id}`);
  thoughtIds.add(thought.id);
  assert(authors.has(thought.author), `${location}.author is invalid.`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(thought.date), `${location}.date is invalid.`);
  assert(/^\d{4}\.\d{2}\.\d{2}$/.test(thought.dateLabel), `${location}.dateLabel is invalid.`);
  assert(typeof thought.body === 'string' && thought.body.trim().length > 0, `${location}.body is required.`);
  assert(thought.body.length <= 280, `${location}.body exceeds 280 characters.`);
  assert(thought.replies === undefined || Array.isArray(thought.replies), `${location}.replies must be an array.`);
  assert((thought.replies?.length ?? 0) <= 6, `${location}.replies exceeds 6 items.`);
  if (thought.replies) validateReplyOrder(thought.replies, `${location}.replies`, thought.date);
}

console.log(`Validated ${value.thoughts.length} thoughts and ${value.comments.length} comment threads.`);
