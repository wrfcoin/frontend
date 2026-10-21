/**
 * ts-jest AST transformer: `import.meta.env` → `(globalThis.__VITE_ENV__ ?? {})`.
 *
 * Vite replaces import.meta.env at build time; Jest (native ESM) leaves it
 * undefined, so any module that reads `import.meta.env.X` directly throws at
 * load and could only be tested behind a mock. With this transform:
 *  - by default every flag reads as unset (`{}`), exactly like the old
 *    `import.meta.env?.X`, so existing tests see no difference except that a
 *    direct read no longer crashes the import;
 *  - a test can set `globalThis.__VITE_ENV__ = { VITE_…: '…' }` BEFORE
 *    importing the app to render it exactly as a build with those variables,
 *    e.g. the Stage 1.5 public read-only build (publicReadonly.appShell.test.jsx).
 * Only the `env` member of `import.meta` is rewritten; `import.meta.url` etc. stay.
 */
const NAME = 'wrfcoin-vite-import-meta-env';
const VERSION = '1';

function factory(tsCompiler) {
  const ts = tsCompiler.configSet.compilerModule;
  return context => {
    const f = context.factory;
    const visit = node => {
      if (
        ts.isPropertyAccessExpression(node) &&
        node.name.text === 'env' &&
        ts.isMetaProperty(node.expression) &&
        node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
        node.expression.name.text === 'meta'
      ) {
        return f.createParenthesizedExpression(
          f.createBinaryExpression(
            f.createPropertyAccessExpression(f.createIdentifier('globalThis'), '__VITE_ENV__'),
            ts.SyntaxKind.QuestionQuestionToken,
            f.createObjectLiteralExpression([]),
          ),
        );
      }
      return ts.visitEachChild(node, visit, context);
    };
    return sourceFile => ts.visitNode(sourceFile, visit);
  };
}

module.exports = { name: NAME, version: VERSION, factory };
