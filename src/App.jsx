import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { evaluate } from "mathjs";
import { normalizeExpression } from "./utils/normalizeExpression";
import "./styles.css";

export default function App() {
  const [expressions, setExpressions] = useState([
    { id: 1, expr: "sinx", color: "blue" }
  ]);

  const [plotRange, setPlotRange] = useState({
    xMin: -10, xMax: 10,
    yMin: -10, yMax: 10
  });

  const colors = ["blue", "red", "green", "orange", "purple", "cyan", "magenta"];

  useEffect(() => {
    window.plotFromNative = function (expr) {
      const nextId = expressions.length ? expressions[expressions.length - 1].id + 1 : 1;
      const nextColor = colors[expressions.length % colors.length];
      setExpressions(prev => [...prev, { id: nextId, expr, color: nextColor }]);
    };
  }, [expressions]);

  const generatePlotData = () => {
    const plots = [];
  
    const resolution = 2000;
    const stepX = (plotRange.xMax - plotRange.xMin) / resolution;
    const x = Array.from({ length: resolution }, (_, i) => plotRange.xMin + i * stepX);
  
    const stepXY = (plotRange.xMax - plotRange.xMin) / 100;
    const xRange = Array.from({ length: 100 }, (_, i) => plotRange.xMin + i * stepXY);
    const yRange = Array.from({ length: 100 }, (_, j) => plotRange.yMin + j * stepXY);
  
    expressions.forEach((exp, index) => {
      const raw = normalizeExpression(exp.expr);
      const color = exp.color || colors[index % colors.length];
      const isImplicit = raw.includes("=") && raw.includes("x") && raw.includes("y");
  
      try {
        if (isImplicit) {
          const expr0 = normalizeExpression(raw.replace("=", "-"));
          const points = { x: [], y: [] };
  
          xRange.forEach(xVal => {
            yRange.forEach(yVal => {
              const scope = { x: xVal, y: yVal };
              const result = evaluate(expr0, scope);
              if (Math.abs(result) < 0.8) {
                points.x.push(xVal);
                points.y.push(yVal);
              }
            });
          });
  
          plots.push({
            x: points.x,
            y: points.y,
            type: "scatter",
            mode: "markers",
            marker: { color, size: 3 },
            name: exp.expr,
            hoverinfo: "skip",
          });
  
          return;
        }
  
        // ✅ Standard y = f(x) plot
        const y = x.map(val =>
          evaluate(normalizeExpression(exp.expr), { x: val })
        );
  
        plots.push({
          x,
          y,
          type: "scatter",
          mode: "lines",
          line: {
            color,
            width: 2,
            dash: "solid"
          },
          name: exp.expr,
        });
  
      } catch (err) {
        console.warn(`❌ Error parsing: ${exp.expr}`, err);
  
        plots.push({
          x: [0], y: [0],
          type: "scatter",
          mode: "text",
          text: [`❌ ${exp.expr}`],
          textposition: "top center",
          marker: { color: "red" },
          showlegend: false,
        });
      }
    });
  
    return plots;
  };  

  const handleExpressionChange = (id, value) => {
    setExpressions(expressions.map(exp =>
      exp.id === id ? { ...exp, expr: value } : exp
    ));
  };

  const addExpression = () => {
    const nextId = expressions.length ? expressions[expressions.length - 1].id + 1 : 1;
    const nextColor = colors[expressions.length % colors.length];
    setExpressions([...expressions, { id: nextId, expr: "", color: nextColor }]);
  };

  const removeExpression = (id) => {
    setExpressions(expressions.filter(exp => exp.id !== id));
  };

  return (
    <div className="container">
      <div className="sidebar">
        <h2>Graphing Calculator</h2>

        {expressions.map(exp => (
          <div key={exp.id} className="expression-row">
            <input
              type="text"
              value={exp.expr}
              onChange={(e) => handleExpressionChange(exp.id, e.target.value)}
              placeholder="e.g. y = sinx"
            />
            <button className="remove-btn" onClick={() => removeExpression(exp.id)}>✖</button>
          </div>
        ))}

        <button className="add-btn" onClick={addExpression}>+ Add Expression</button>
      </div>

      <div className="plot-area">
        <Plot
          data={generatePlotData()}
          layout={{
            autosize: true,
            dragmode: "pan",
            xaxis: { autorange: true, title: "x" },
            yaxis: { autorange: true, title: "y", scaleanchor: "x" },
            plot_bgcolor: "#121212",
            paper_bgcolor: "#121212",
            font: { color: "white" },
            margin: { t: 20 }
          }}
          config={{
            displaylogo: false,
            modeBarButtonsToRemove: ['sendDataToCloud'],
            responsive: true,
            scrollZoom: true
          }}
          onRelayout={(e) => {
            if (e["xaxis.range[0]"] && e["xaxis.range[1]"] && e["yaxis.range[0]"] && e["yaxis.range[1]"]) {
              setPlotRange({
                xMin: e["xaxis.range[0]"],
                xMax: e["xaxis.range[1]"],
                yMin: e["yaxis.range[0]"],
                yMax: e["yaxis.range[1]"]
              });
            }
          }}
          style={{ width: "100%", height: "500px" }}
        />
      </div>
    </div>
  );
}
