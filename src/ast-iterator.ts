const isNode = (key: string, value: any) => {
  if (key === "loc") return false;
  return (
    typeof value === "object" &&
    typeof (value as any)?.end === "number" &&
    typeof (value as any)?.start === "number" &&
    typeof (value as any)?.type === "string"
  );
};

export const astIterator = function* (ast: any): IterableIterator<any> {
  if (!ast) {
    return;
  }

  for (const key of Object.keys(ast)) {
    // Skip useless keys
    if (["end", "start", "type"].includes(key)) {
      continue;
    }

    // If key value is an array, iterate over it
    if (Array.isArray(ast[key])) {
      for (const nodeIndex in ast[key]) {
        yield* astIterator(ast[key][nodeIndex]);
      }
    } else if (isNode(key, ast[key])) {
      yield* astIterator(ast[key]);
    }
  }

  yield ast;
};
