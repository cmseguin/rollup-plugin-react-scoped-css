export const createObjectAssignCallExpressionWithIdentifier = (
  identifier: any,
  objectExpression: any
) => {
  return {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: {
        type: "Identifier",
        name: "Object",
      },
      property: {
        type: "Identifier",
        name: "assign",
      },
      computed: false,
      optional: false,
    },
    arguments: [
      {
        type: "ObjectExpression",
        start: 14,
        end: 16,
        properties: [],
      },
      identifier,
      objectExpression,
    ],
    optional: false,
  };
};

export const createObjectExpressionWithAttr = (attrNode: any) => {
  return {
    type: "ObjectExpression",
    properties: [attrNode],
  };
};

export const extendObjectExpression = (objectExpression: any, prop: any) => {
  return {
    ...objectExpression,
    properties: [...objectExpression.properties, prop],
  };
};

export const hackIntoExtenderCallExpression = (
  callExpression: any,
  prop: any
) => {
  return {
    ...callExpression,
    arguments: [
      ...callExpression.arguments,
      createObjectExpressionWithAttr(prop),
    ],
  };
};

export const isNodeCallExpression = (node: any) => {
  return node.type === "CallExpression";
};

export const isNodeObjectExpression = (node: any) => {
  return node.type === "ObjectExpression";
};

export const isNodeExtender = (node: any) => {
  return (
    isNodeCallExpression(node) &&
    (node.callee.name === "_objectSpread" || node.callee.name === "_extends")
  );
};

export const isNodeIdentifier = (node: any) => {
  return node.type === "Identifier";
};

export const isNodeImportDeclaration = (node: any) => {
  return node.type === "ImportDeclaration";
};

export const isNodeRequireCallExpression = (node: any) => {
  return (
    isNodeCallExpression(node) &&
    node.callee.name === "require" &&
    node.arguments.length === 1
  );
};

export const isNodeImportOrRequire = (node: any) => {
  return isNodeImportDeclaration(node) || isNodeRequireCallExpression(node);
};

export const getSrcFromImportOrRequire = (node: any) => {
  if (isNodeImportDeclaration(node)) {
    return node.source.value;
  }
  if (isNodeRequireCallExpression(node)) {
    return node.arguments[0].value;
  }
  return null;
};
