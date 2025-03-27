export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  expr = expr.replace(/X/g, "x");
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");
  expr = expr.replace(/(\d)([a-zA-Z])/g, "$1*$2");
  expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, "$1*$2");
  expr = expr.replace(/(\d)(\s*)(\()/g, "$1*$3");
  expr = expr.replace(/([a-zA-Z])(\s*)(\()/g, "$1*$3");
  expr = expr.replace(/(\))(\s*)([a-zA-Z])/g, "$1*$3");
  expr = expr.replace(/(\))(\s*)(\()/g, "$1*$3");

  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}\\s*([a-zA-Z0-9])`, 'g');
    expr = expr.replace(regex, `${fn}($1)`);
  });

  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ')'.repeat(open - close);

  return expr;
}
