const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        margin: 0;
        padding: 20px;
        background: #fff;
      }
    </style>
  </head>
  <body>
    <div id="diagram"></div>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

      const code = \`${code.replace(/`/g, '\\`')}\`;

      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          primaryColor: '#0057FF',
          lineColor: '#C0C0C0',
          textColor: '#202124',
          taskTextColor: '#202124',
          ganttAxisFontSize: '12px',
          ganttSectionFill: '#F1F3F4',
          ganttSectionFontColor: '#202124'
        }
      });

      const el = document.getElementById('diagram');
      mermaid.render("theGraph", code).then(({ svg }) => {
        el.innerHTML = svg;
      });
    </script>
  </body>
</html>
`;
