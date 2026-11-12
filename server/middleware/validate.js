const { z } = require('zod');

const optionalText = max => z.string().trim().max(max).optional().nullable().transform(v => v || undefined);

const IdeaSchema = z.object({
  idea_title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(120),
  idea_description: z.string().trim().min(20, 'Description must be at least 20 characters.').max(3000),
  target_audience: optionalText(300),
  industry: optionalText(80),
  refinement_context: optionalText(2000),
});

const CompareSchema = z.object({ idea_a: IdeaSchema, idea_b: IdeaSchema });

const ChatSchema = z.object({
  idea_title: z.string().trim().min(1).max(120),
  report: z.object({}).passthrough(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2000),
  })).min(1).max(50),
});

// Express middleware: validate req.body against a schema and replace it with the parsed value.
function body(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ error: issue.message, field: issue.path.join('.') });
    }
    req.body = parsed.data;
    next();
  };
}

module.exports = { body, IdeaSchema, CompareSchema, ChatSchema };
