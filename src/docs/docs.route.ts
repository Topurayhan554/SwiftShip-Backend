import { Router } from "express";
import { swaggerSpec } from "./swagger";

const router = Router();

router.get("/json", (_req, res) => {
  res.json(swaggerSpec);
});

router.get("/", (_req, res) => {
  // helmet-এর CSP এই পেজে CDN script block করে, তাই সরানো হলো
  res.removeHeader("Content-Security-Policy");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Courier API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/docs/json",
          dom_id: "#swagger-ui",
        });
      };
    </script>
  </body>
</html>`);
});

export default router;
