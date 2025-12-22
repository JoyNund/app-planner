// Task mention utilities for parsing and rendering task references in chat

/**
 * Parse task mentions from text
 * Supports two formats:
 * - /task-name - Menu-based task selection
 * - #TaskID - Direct task ID reference (e.g., #DGnov00125)
 */

/**
 * Extract task IDs from text
 * @param text - Message text
 * @returns Array of task IDs found in text
 */
export function extractTaskIds(text: string): string[] {
  // Match #TaskID pattern (e.g., #DGnov00125)
  const pattern = /#([A-Z]{2}[a-z]{3}\d{3}\d{2})/g;
  const matches = text.matchAll(pattern);
  return Array.from(matches, m => m[1]);
}

/**
 * Check if text contains task mention trigger
 * @param text - Current input text
 * @param cursorPosition - Current cursor position
 * @returns Object with trigger info or null
 */
export function detectMentionTrigger(
  text: string,
  cursorPosition: number
): { type: 'slash' | 'hash'; position: number; query: string } | null {
  const beforeCursor = text.substring(0, cursorPosition);
  
  // Check for / trigger (menu-based selection)
  const slashMatch = beforeCursor.match(/\/([^\s]*)$/);
  if (slashMatch) {
    return {
      type: 'slash',
      position: beforeCursor.length - slashMatch[0].length,
      query: slashMatch[1],
    };
  }
  
  // Check for # trigger (task ID autocomplete)
  const hashMatch = beforeCursor.match(/#([A-Z]{0,2}[a-z]{0,3}\d{0,3}\d{0,2})$/);
  if (hashMatch) {
    return {
      type: 'hash',
      position: beforeCursor.length - hashMatch[0].length,
      query: hashMatch[1],
    };
  }
  
  return null;
}

/**
 * Replace mention trigger with task reference
 * @param text - Original text
 * @param trigger - Trigger info from detectMentionTrigger
 * @param taskId - Task ID to insert
 * @param cursorPosition - Current cursor position
 * @returns Object with new text and cursor position
 */
export function insertTaskMention(
  text: string,
  trigger: { type: string; position: number; query: string },
  taskId: string,
  cursorPosition: number
): { text: string; cursorPosition: number } {
  const before = text.substring(0, trigger.position);
  const after = text.substring(cursorPosition);
  const mention = `#${taskId}`;
  
  return {
    text: before + mention + ' ' + after,
    cursorPosition: before.length + mention.length + 1,
  };
}

/**
 * Render text with task mentions as clickable links
 * @param text - Message text
 * @param tasks - Map of task IDs to task objects
 * @returns Array of text segments and task links
 */
export function renderTaskMentions(
  text: string,
  tasks: Map<string, { id: number; title: string; task_id: string }>
): Array<{ type: 'text' | 'mention'; content: string; taskId?: string; taskDbId?: number }> {
  const pattern = /#([A-Z]{2}[a-z]{3}\d{3}\d{2})/g;
  const segments: Array<{ type: 'text' | 'mention'; content: string; taskId?: string; taskDbId?: number }> = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }
    
    // Add mention
    const taskId = match[1];
    const task = tasks.get(taskId);
    
    segments.push({
      type: 'mention',
      content: `#${taskId}`,
      taskId: taskId,
      taskDbId: task?.id,
    });
    
    lastIndex = pattern.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }
  
  return segments;
}

/**
 * Filter tasks by query for autocomplete
 * @param tasks - Array of tasks
 * @param query - Search query
 * @returns Filtered and sorted tasks
 */
export function filterTasksForMention(
  tasks: Array<{ id: number; task_id: string | null; title: string; status: string }>,
  query: string
): Array<{ id: number; task_id: string | null; title: string; status: string }> {
  const lowerQuery = query.toLowerCase();
  
  return tasks
    .filter(task => {
      if (!task.task_id) return false;
      
      // Match by task ID or title
      return (
        task.task_id.toLowerCase().includes(lowerQuery) ||
        task.title.toLowerCase().includes(lowerQuery)
      );
    })
    .sort((a, b) => {
      // Prioritize active tasks
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      
      // Then sort by title
      return a.title.localeCompare(b.title);
    })
    .slice(0, 10); // Limit to 10 results
}
