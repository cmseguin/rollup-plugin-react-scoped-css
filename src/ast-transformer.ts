const isNode = (obj: any) => {
  return (
    typeof obj === "object" &&
    typeof (obj as any)?.end === "number" &&
    typeof (obj as any)?.start === "number" &&
    typeof (obj as any)?.type === "string"
  );
};

export const astTransformer = (ast: any, callback: (ast: any) => any) => {
  if (!ast) {
    return ast;
  }

  for (const key of Object.keys(ast)) {
    if (["end", "start", "type"].includes(key)) {
      continue;
    }

    if (Array.isArray(ast[key])) {
      for (const nodeIndex in ast[key]) {
        ast[key][nodeIndex] = astTransformer(ast[key][nodeIndex], callback);
      }
    } else if (isNode(ast[key])) {
      ast[key] = astTransformer(ast[key], callback);
    }
  }

  const result = callback(ast);

  return typeof result !== "undefined" ? result : ast;
};
