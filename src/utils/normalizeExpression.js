export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // Replace capital X with lowercase x
  expr = expr.replace(/X/g, "x");

  // Replace π and pi with PI
  expr = expr.replace(/π|pi/gi, "PI");

  // Keep 'e' as math constant (not variable)
  expr = expr.replace(/\be\b/g, "e");

  // Add * between number and variable (2x → 2*x)
  expr = expr.replace(/(\d)([a-zA-Z])/g, "$1*$2");

  // Add * between variable and variable (ax → a*x)
  expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, "$1*$2");

  // Add * between number and opening parenthesis (2(x) → 2*(x))
  expr = expr.replace(/(\d)(\s*)(\()/g, "$1*$3");

  // Add * between variable and parentheses (x(x+1) → x*(x+1))
  expr = expr.replace(/([a-zA-Z])(\s*)(\()/g, "$1*$3");

  // Add * between closing parenthesis and variable (()x → ()*x)
  expr = expr.replace(/(\))(\s*)([a-zA-Z])/g, "$1*$3");

  // Add * between closing and opening parentheses (()() → ()*())
  expr = expr.replace(/(\))(\s*)(\()/g, "$1*$3");

  // Auto-wrap math functions like sinx → sin(x)
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}\\s*([a-zA-Z0-9])`, 'g');
    expr = expr.replace(regex, `${fn}($1)`);
  });

  // Auto-close unbalanced parentheses
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ')'.repeat(open - close);

  return expr;
}
