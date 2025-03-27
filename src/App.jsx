import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { evaluate } from "mathjs";
import { normalizeExpression } from "./utils/normalizeExpression";
import "./styles.css";

export default function App() {
  const [expressions, setExpressions] = useState([
    { id: 1, expr: "", color: "blue" },
  ]);
  const [variables, setVariables] = useState({});

  const colors = ["blue", "red", "green", "orange", "purple", "cyan", "magenta"];

  const extractVariables = (expr) => {
    const matches = expr.match(/[a-wyzA-WYZ]/g); // ignore x/X
    const letters = [...new Set(matches?.map((l) => l.toLowerCase()) || [])];
    return letters.filter((v) => v !== "x");
  };

  useEffect(() => {
    const allVars = new Set();
    expressions.forEach((exp) => {
      extractVariables(exp.expr).forEach((v) => allVars.add(v));
    });

    const updatedVars = {};
    allVars.forEach((v) => {
      updatedVars[v] = variables[v] ?? 1; // Keep existing value or default to 1
    });

    setVariables(updatedVars);
  }, [expressions]);

  const generatePlotData = () => {
    const x = Array.from({ length: 1000 }, (_, i) => i / 50 - 10);
    const plots = [];

    expressions.forEach((exp, index) => {
      const raw = normalizeExpression(exp.expr);
      const color = exp.color || colors[index % colors.length];

      try {
        // Compound inequality y > f(x) && y < g(x)
        const isCompound = raw.match(/^\s*y\s*([<>]=?)\s*([^&]+)&&\s*y\s*([<>]=?)\s*(.+)$/i);
        if (isCompound) {
          const [, op1, expr1, op2, expr2] = isCompound;
          const y1 = x.map((val) => evaluate(expr1, { x: val, ...variables }));
          const y2 = x.map((val) => evaluate(expr2, { x: val, ...variables }));
          plots.push({
            x,
            y: y1,
            type: "scatter",
            mode: "lines",
            line: { color },
            name: `y ${op1} ${expr1}`,
          });
          plots.push({
            x,
            y: y2,
            type: "scatter",
            mode: "lines",
            line: { color },
            name: `y ${op2} ${expr2}`,
            fill: "tonexty",
            fillcolor: color + "33",
          });
          return;
        }

        // Y-based inequality
        const yInequality = raw.match(/^\s*y\s*([<>]=?)\s*(.+)$/i);
        if (yInequality) {
          const [, , rhs] = yInequality;
          const yVals = x.map((val) => evaluate(rhs, { x: val, ...variables }));
          plots.push({
            x,
            y: yVals,
            type: "scatter",
            mode: "lines",
            line: { color },
            name: exp.expr,
            fill: "tonexty",
            fillcolor: color + "33",
          });
          return;
        }

        // X-based inequality like x > 3
        const xInequality = raw.match(/^\s*x\s*([<>]=?)\s*([\d.\-+*/ePIx()]+)$/i);
        if (xInequality) {
          const [, op, valueExpr] = xInequality;
          const xVal = evaluate(valueExpr, variables);
          const mask = x.map((val) => {
            switch (op) {
              case ">":
                return val > xVal;
              case "<":
                return val < xVal;
              case ">=":
                return val >= xVal;
              case "<=":
                return val <= xVal;
              default:
                return false;
            }
          });
          const y = mask.map((m) => (m ? 10 : NaN));
          plots.push({
            x,
            y,
            type: "scatter",
            mode: "none",
            fill: "tozeroy",
            fillcolor: color + "33",
            name: exp.expr,
          });
          return;
        }

        // Standard expression
        const y = x.map((val) => evaluate(raw, { x: val, ...variables }));
        plots.push({
          x,
          y,
          type: "scatter",
          mode: "lines",
          marker: { color },
          name: exp.expr,
        });
      } catch (err) {
        plots.push({
          x: [0],
          y: [0],
          type: "scatter",
          mode: "text",
          text: [`❌ Error in: ${exp.expr}`],
          textposition: "top center",
          marker: { color: "red" },
          name: "Error",
          showlegend: false,
        });
      }
    });

    return plots;
  };

  const isValidExpression = (expr) => {
    try {
      evaluate(normalizeExpression(expr), { x: 0, ...variables });
      return true;
    } catch {
      return false;
    }
  };

  const handleExpressionChange = (id, value) => {
    const updated = expressions.map((exp) =>
      exp.id === id ? { ...exp, expr: value } : exp
    );
    setExpressions(updated);
  };

  const addExpression = () => {
    const nextId =
      expressions.length > 0 ? expressions[expressions.length - 1].id + 1 : 1;
    const nextColor = colors[expressions.length % colors.length];
    setExpressions([...expressions, { id: nextId, expr: "", color: nextColor }]);
  };

  const removeExpression = (id) => {
    setExpressions(expressions.filter((exp) => exp.id !== id));
  };

  return (
    <div className="container">
      <h1>Graphing Calculator</h1>

      {expressions.map((exp) => (
        <div key={exp.id} className="expression-row">
          <input
            type="text"
            value={exp.expr}
            onChange={(e) => handleExpressionChange(exp.id, e.target.value)}
            placeholder="Enter expression like y > x^2, sin(x), etc."
          />
          <button className="remove-btn" onClick={() => removeExpression(exp.id)}>
            ✖
          </button>
          {!isValidExpression(exp.expr) &&
            !exp.expr.trim().startsWith("y") &&
            !exp.expr.trim().startsWith("x") && (
              <div style={{ color: "red", fontSize: "0.8em", marginTop: "4px" }}>
                ❌ Invalid Expression
              </div>
            )}
        </div>
      ))}

      <button className="add-btn" onClick={addExpression}>
        + Add Expression
      </button>

      <div className="sliders">
        {Object.keys(variables).map((v) => (
          <div key={v} className="slider-container">
            <label>
              {v} = {variables[v]}
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={variables[v]}
                onChange={(e) =>
                  setVariables({ ...variables, [v]: parseFloat(e.target.value) })
                }
              />
            </label>
          </div>
        ))}
      </div>

      <Plot
        data={generatePlotData()}
        layout={{
          autosize: true,
          paper_bgcolor: "#121212",
          plot_bgcolor: "#121212",
          font: { color: "white" },
          margin: { t: 20 },
        }}
        style={{ width: "100%", height: "500px" }}
      />
    </div>
  );
}
