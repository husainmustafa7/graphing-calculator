export function normalizeExpression(expr) {
  if (!expr) return "";

  // Clean up spacing
  expr = expr.replace(/\s+/g, "");

  // Function names first
  const functions = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'ln', 'sqrt', 'abs', 'asin', 'acos', 'atan'];
  functions.forEach(fn => {
    expr = expr.replace(new RegExp(`\\b${fn}(?!\\()([a-zA-Z0-9])`, 'g'), `${fn}($1)`);
  });

  // Replace constants
  expr = expr.replace(/π|pi/gi, "PI");
  expr = expr.replace(/\be\b/g, "e");

  // Add multiplication signs
  expr = expr.replace(/(\d)([a-zA-Z(])/g, "$1*$2");
  expr = expr.replace(/([a-zA-Z])(\d)/g, "$1*$2");
  expr = expr.replace(/(\))([a-zA-Z(])/g, "$1*$2");

  // Close parentheses if needed
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (open > close) expr += ")".repeat(open - close);

  return expr;
}
