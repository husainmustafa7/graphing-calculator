export function normalizeExpression(rawExpr) {
  if (!rawExpr) return "";

  let expr = rawExpr;

  // Normalize case
  expr = expr.replace(/X/g, "x");

  // Constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Function shorthands (e.g., sinx → sin(x))
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    const regex = new RegExp(`\\b${fn}(?!\\s*\\()\\s*([a-zA-Z0-9(])`, 'g');
    expr = expr.replace(regex, `${fn}($1)`);
  });

  // Insert multiplication between number and variable/(
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");

  // Variable followed by number
  expr = expr.replace(/([a-zA-Z])(\d)/g, "$1*$2");

  // Variable and variable (ab → a*b), skip known functions
  expr = expr.replace(/([a-zA-Z])([a-zA-Z])/g, (match, p1, p2) => {
    const fnGuess = `${p1}${p2}`.toLowerCase();
    return functions.includes(fnGuess) ? match : `${p1}*${p2}`;
  });

  // Add * between ) and variable or (
  expr = expr.replace(/(\))([a-zA-Z(])/g, "$1*$2");

  // Auto-close unbalanced (
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ')'.repeat(open - close);

  return expr;
}
