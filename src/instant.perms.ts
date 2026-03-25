// Docs: https://www.instantdb.com/docs/permissions

const perms = {
  $users: {
    allow: {
      view: "auth.id == data.id",
    },
  },
  analyses: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: "auth.id in data.ref('owner.id')",
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  messages: {
    allow: {
      view: "auth.id in data.ref('analysis.owner.id')",
      create: "auth.id in data.ref('analysis.owner.id')",
      update: "auth.id in data.ref('analysis.owner.id')",
      delete: "auth.id in data.ref('analysis.owner.id')",
    },
  },
};

export default perms;
