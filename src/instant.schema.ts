// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    analyses: i.entity({
      title: i.string().indexed(),
      summary: i.string().optional(),
      createdAt: i.number().indexed(),
      updatedAt: i.number().indexed(),
      status: i.string().optional(),
    }),
    messages: i.entity({
      role: i.string().indexed(),
      content: i.string(),
      createdAt: i.number().indexed(),
    }),
  },
  links: {
    analysisOwner: {
      forward: {
        on: "analyses",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "analyses",
      },
    },
    analysisMessages: {
      forward: {
        on: "messages",
        has: "one",
        label: "analysis",
        onDelete: "cascade",
      },
      reverse: {
        on: "analyses",
        has: "many",
        label: "messages",
      },
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppSchema extends _AppSchema {}

const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
