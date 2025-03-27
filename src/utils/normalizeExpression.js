export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // ✅ Step 1: Capital X → lowercase
  expr = expr.replace(/X/g, "x");

  // ✅ Step 2: Wrap sinx, cosx, etc. → sin(x)
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}\\s*([a-zA-Z0-9(])`, 'g');
    expr = expr.replace(regex, `${fn}($1`);
  });

  // ✅ Step 3: Replace constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // ✅ Step 4: Add * between number and variable (2x → 2*x)
  expr = expr.replace(/(\d)([a-zA-Z])/g, "$1*$2");

  // ✅ Step 5: Add * between variable and variable (ax → a*x)
  expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, "$1*$2");

  // ✅ Step 6: Add * between number/variable and parentheses
  expr = expr.replace(/(\d)(\s*)(\()/g, "$1*$3");
  expr = expr.replace(/([a-zA-Z])(\s*)(\()/g, "$1*$3");
  expr = expr.replace(/(\))(\s*)([a-zA-Z])/g, "$1*$3");
  expr = expr.replace(/(\))(\s*)(\()/g, "$1*$3");

  // ✅ Step 7: Close unmatched (
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ")".repeat(open - close);

  return expr;
}
