import { i } from "@instantdb/react";

const schema = i.schema({
  entities: {
    analyses: i.entity({
      title: i.string(),
      createdAt: i.number(),
      updatedAt: i.number(),
      status: i.string(),
      summary: i.string().optional(),
    }),
    messages: i.entity({
      role: i.string(),
      content: i.string(),
      createdAt: i.number(),
    }),
  },
  links: {
    analysisMessages: {
      forward: { on: "analyses", has: "many", label: "messages" },
      reverse: { on: "messages", has: "one", label: "analysis" },
    },
  },
});

export type AppSchema = typeof schema;
export default schema;