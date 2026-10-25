interface Position {
  line: number;
  column: number;
}

interface Location {
  start: Position;
  end: Position;
  source: string;
}

const getLineStarts = (code: string) => {
  const lineStarts = [0];

  for (let index = 0; index < code.length; index++) {
    if (code.charCodeAt(index) === 10) {
      lineStarts.push(index + 1);
    }
  }

  return lineStarts;
};

const getPosition = (offset: number, lineStarts: number[]): Position => {
  // Binary search for the last line start that is <= offset
  let low = 0;
  let high = lineStarts.length - 1;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);

    if (lineStarts[middle] <= offset) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return { line: low + 1, column: offset - lineStarts[low] };
};

/**
 * Escodegen generates source maps from the AST nodes' `loc` property, but
 * Rollup's `this.parse()` only exposes `start`/`end` offsets. This walks the
 * AST and adds equivalent `loc` information so a source map can be generated.
 */
export const addLocationsToAst = (ast: any, code: string, source: string) => {
  const lineStarts = getLineStarts(code);

  const visit = (node: any) => {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (
      typeof node.type === "string" &&
      typeof node.start === "number" &&
      typeof node.end === "number"
    ) {
      const loc: Location = {
        start: getPosition(node.start, lineStarts),
        end: getPosition(node.end, lineStarts),
        source,
      };

      node.loc = loc;
    }

    for (const key of Object.keys(node)) {
      if (key === "loc") {
        continue;
      }

      const value = node[key];

      if (value && typeof value === "object") {
        visit(value);
      }
    }
  };

  visit(ast);

  return ast;
};
