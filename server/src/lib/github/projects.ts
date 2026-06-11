const GRAPHQL_URL = "https://api.github.com/graphql";

async function githubGraphQL<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "brisk-app",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL error (${response.status})`);
  }

  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("No data in GraphQL response");
  return json.data;
}

export type GithubProject = {
  id: string;
  number: number;
  title: string;
  url: string;
  closed: boolean;
  shortDescription: string | null;
  owner: string;
};

export type GithubProjectFieldOption = { id: string; name: string };

export type GithubProjectField = {
  id: string;
  name: string;
  dataType: string;
  options?: GithubProjectFieldOption[];
};

export type GithubProjectItemContent =
  | { type: "Issue"; id: string; title: string; number: number; state: string; url: string; body?: string | null }
  | { type: "PullRequest"; id: string; title: string; number: number; state: string; url: string }
  | { type: "DraftIssue"; id: string; title: string; body?: string | null }
  | null;

export type GithubProjectFieldValue = {
  fieldId: string;
  fieldName: string;
  value: string | number | null;
  optionId?: string;
};

export type GithubProjectItem = {
  id: string;
  type: "ISSUE" | "PULL_REQUEST" | "DRAFT_ISSUE";
  content: GithubProjectItemContent;
  fieldValues: GithubProjectFieldValue[];
};

const PROJECT_FIELDS_FRAGMENT = `
  fields(first: 30) {
    nodes {
      ... on ProjectV2Field { id name dataType }
      ... on ProjectV2SingleSelectField {
        id name dataType
        options { id name }
      }
      ... on ProjectV2IterationField { id name dataType }
    }
  }
`;

const PROJECT_ITEM_NODE = `
  id
  type
  fieldValues(first: 20) {
    nodes {
      ... on ProjectV2ItemFieldTextValue {
        text
        field { ... on ProjectV2Field { id name } }
      }
      ... on ProjectV2ItemFieldNumberValue {
        number
        field { ... on ProjectV2Field { id name } }
      }
      ... on ProjectV2ItemFieldDateValue {
        date
        field { ... on ProjectV2Field { id name } }
      }
      ... on ProjectV2ItemFieldSingleSelectValue {
        name optionId
        field { ... on ProjectV2SingleSelectField { id name } }
      }
    }
  }
  content {
    ... on Issue { id title number state url body }
    ... on PullRequest { id title number state url }
    ... on DraftIssue { id title body }
  }
`;

const PROJECT_ITEMS_FRAGMENT = `
  items(first: 100) {
    pageInfo { hasNextPage endCursor }
    nodes { ${PROJECT_ITEM_NODE} }
  }
`;

export async function fetchUserProjects(token: string): Promise<GithubProject[]> {
  const data = await githubGraphQL<{
    viewer: { login: string; projectsV2: { nodes: { id: string; number: number; title: string; url: string; closed: boolean; shortDescription: string | null }[] } };
  }>(token, `query { viewer { login projectsV2(first: 50) { nodes { id number title url closed shortDescription } } } }`);

  const login = data.viewer.login;
  return data.viewer.projectsV2.nodes.map((p) => ({ ...p, owner: login }));
}

export async function fetchOrgProjects(token: string, org: string): Promise<GithubProject[]> {
  const data = await githubGraphQL<{
    organization: { projectsV2: { nodes: { id: string; number: number; title: string; url: string; closed: boolean; shortDescription: string | null }[] } } | null;
  }>(
    token,
    `query($login: String!) { organization(login: $login) { projectsV2(first: 50) { nodes { id number title url closed shortDescription } } } }`,
    { login: org },
  );

  if (!data.organization) return [];
  return data.organization.projectsV2.nodes.map((p) => ({ ...p, owner: org }));
}

type RawField = { id: string; name: string; dataType: string; options?: { id: string; name: string }[] };
type RawFieldValue =
  | { text: string; field: { id: string; name: string } }
  | { number: number; field: { id: string; name: string } }
  | { date: string; field: { id: string; name: string } }
  | { name: string; optionId: string; field: { id: string; name: string } };
type RawItem = {
  id: string;
  type: string;
  fieldValues: { nodes: RawFieldValue[] };
  content: { id: string; title: string; number?: number; state?: string; url?: string; body?: string | null } | null;
};

function parseFieldValue(fv: RawFieldValue): GithubProjectFieldValue | null {
  if ("text" in fv) return { fieldId: fv.field.id, fieldName: fv.field.name, value: fv.text };
  if ("number" in fv) return { fieldId: fv.field.id, fieldName: fv.field.name, value: fv.number };
  if ("date" in fv) return { fieldId: fv.field.id, fieldName: fv.field.name, value: fv.date };
  if ("optionId" in fv) return { fieldId: fv.field.id, fieldName: fv.field.name, value: fv.name, optionId: fv.optionId };
  return null;
}

function parseContent(raw: RawItem): GithubProjectItemContent {
  if (!raw.content) return null;
  const c = raw.content;
  if (raw.type === "ISSUE") return { type: "Issue", id: c.id, title: c.title, number: c.number!, state: c.state!, url: c.url!, body: c.body };
  if (raw.type === "PULL_REQUEST") return { type: "PullRequest", id: c.id, title: c.title, number: c.number!, state: c.state!, url: c.url! };
  return { type: "DraftIssue", id: c.id, title: c.title, body: c.body };
}

function mapProjectFields(nodes: RawField[]): GithubProjectField[] {
  return nodes.map((f) => ({
    id: f.id,
    name: f.name,
    dataType: f.dataType,
    options: f.options,
  }));
}

function mapProjectItems(nodes: RawItem[]): GithubProjectItem[] {
  return nodes.map((item) => ({
    id: item.id,
    type: item.type as GithubProjectItem["type"],
    content: parseContent(item),
    fieldValues: item.fieldValues.nodes
      .map(parseFieldValue)
      .filter((v): v is GithubProjectFieldValue => v !== null),
  }));
}

async function fetchProjectItemsPage(
  token: string,
  projectId: string,
  after?: string,
): Promise<{ items: GithubProjectItem[]; hasNextPage: boolean; endCursor: string | null }> {
  const data = await githubGraphQL<{
    node: {
      items: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: RawItem[];
      };
    } | null;
  }>(
    token,
    `query($id: ID!, $after: String) {
      node(id: $id) {
        ... on ProjectV2 {
          items(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes { ${PROJECT_ITEM_NODE} }
          }
        }
      }
    }`,
    { id: projectId, after: after ?? null },
  );

  if (!data.node) throw new Error("Project not found");

  return {
    items: mapProjectItems(data.node.items.nodes),
    hasNextPage: data.node.items.pageInfo.hasNextPage,
    endCursor: data.node.items.pageInfo.endCursor,
  };
}

export async function fetchAllProjectItems(
  token: string,
  projectId: string,
): Promise<GithubProjectItem[]> {
  const items: GithubProjectItem[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 50; page += 1) {
    const pageResult = await fetchProjectItemsPage(token, projectId, cursor);
    items.push(...pageResult.items);

    if (!pageResult.hasNextPage || !pageResult.endCursor) {
      break;
    }

    cursor = pageResult.endCursor;
  }

  return items;
}

export async function fetchProjectDetail(
  token: string,
  projectId: string,
): Promise<{ fields: GithubProjectField[]; items: GithubProjectItem[] }> {
  const data = await githubGraphQL<{
    node: {
      fields: { nodes: RawField[] };
      items: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: RawItem[];
      };
    } | null;
  }>(
    token,
    `query($id: ID!) { node(id: $id) { ... on ProjectV2 { ${PROJECT_FIELDS_FRAGMENT} ${PROJECT_ITEMS_FRAGMENT} } } }`,
    { id: projectId },
  );

  if (!data.node) throw new Error("Project not found");

  const fields = mapProjectFields(data.node.fields.nodes);
  let items = mapProjectItems(data.node.items.nodes);

  let cursor = data.node.items.pageInfo.endCursor;
  while (data.node.items.pageInfo.hasNextPage && cursor) {
    const pageResult = await fetchProjectItemsPage(token, projectId, cursor);
    items = [...items, ...pageResult.items];

    if (!pageResult.hasNextPage || !pageResult.endCursor) {
      break;
    }

    cursor = pageResult.endCursor;
  }

  return { fields, items };
}

export async function addProjectItemById(
  token: string,
  projectId: string,
  contentId: string,
): Promise<string> {
  const data = await githubGraphQL<{ addProjectV2ItemById: { item: { id: string } } }>(
    token,
    `mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }`,
    { projectId, contentId },
  );
  return data.addProjectV2ItemById.item.id;
}

export async function addProjectDraftItem(
  token: string,
  projectId: string,
  title: string,
  body?: string,
): Promise<string> {
  const data = await githubGraphQL<{ addProjectV2DraftIssue: { projectItem: { id: string } } }>(
    token,
    `mutation($projectId: ID!, $title: String!, $body: String) {
      addProjectV2DraftIssue(input: { projectId: $projectId, title: $title, body: $body }) {
        projectItem { id }
      }
    }`,
    { projectId, title, body },
  );
  return data.addProjectV2DraftIssue.projectItem.id;
}

export type ProjectFieldValue =
  | { text: string }
  | { number: number }
  | { date: string }
  | { singleSelectOptionId: string }
  | { iterationId: string };

export async function fetchViewerOwnerId(token: string): Promise<{ id: string; login: string }> {
  const data = await githubGraphQL<{
    viewer: { id: string; login: string };
  }>(token, `query { viewer { id login } }`);
  return data.viewer;
}

export async function createProjectV2(
  token: string,
  ownerId: string,
  title: string,
): Promise<GithubProject> {
  const data = await githubGraphQL<{
    createProjectV2: {
      projectV2: {
        id: string;
        number: number;
        title: string;
        url: string;
        closed: boolean;
        shortDescription: string | null;
      };
    };
  }>(
    token,
    `mutation($ownerId: ID!, $title: String!) {
      createProjectV2(input: { ownerId: $ownerId, title: $title }) {
        projectV2 { id number title url closed shortDescription }
      }
    }`,
    { ownerId, title },
  );

  const project = data.createProjectV2.projectV2;
  const ownerLogin = (await fetchViewerOwnerId(token)).login;
  return { ...project, owner: ownerLogin };
}

export async function linkProjectToRepository(
  token: string,
  projectId: string,
  repositoryId: string,
): Promise<void> {
  await githubGraphQL<unknown>(
    token,
    `mutation($projectId: ID!, $repositoryId: ID!) {
      linkProjectV2ToRepository(input: { projectId: $projectId, repositoryId: $repositoryId }) {
        repository { id }
      }
    }`,
    { projectId, repositoryId },
  );
}

export async function updateProjectItemField(
  token: string,
  projectId: string,
  itemId: string,
  fieldId: string,
  value: ProjectFieldValue,
): Promise<void> {
  await githubGraphQL<unknown>(
    token,
    `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: $value
      }) {
        projectV2Item { id }
      }
    }`,
    { projectId, itemId, fieldId, value },
  );
}
