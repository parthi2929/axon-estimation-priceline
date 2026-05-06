// Patches index.html: replaces the JSON-encoded template string in the
// <script type="__bundler/template"> tag with the contents of
// _template_source.html (re-encoded). All other bundler infrastructure
// (manifest, loader script, etc.) is left untouched.
const fs = require("fs");
const path = require("path");

const root = __dirname;
const indexPath = path.join(root, "index.html");
const templatePath = path.join(root, "_template_source.html");

const indexHtml = fs.readFileSync(indexPath, "utf8");
const template = fs.readFileSync(templatePath, "utf8");

// JSON-encode, then escape any "</" so the surrounding HTML <script> tag
// can't be terminated by content inside the JSON string.
const encoded = JSON.stringify(template).replace(/<\//g, "<\\u002F");

const open = '<script type="__bundler/template">';
const openIdx = indexHtml.indexOf(open);
if (openIdx < 0) {
  throw new Error("Could not locate __bundler/template script block in index.html");
}
// Match the closing </script> + </body> with any whitespace (LF or CRLF) between.
const tail = indexHtml.slice(openIdx + open.length);
const closeRe = /<\/script>\s*<\/body>/;
const tailMatch = closeRe.exec(tail);
if (!tailMatch) {
  throw new Error("Could not locate closing </script></body> after template block");
}
const closeIdx = openIdx + open.length + tailMatch.index;

const before = indexHtml.slice(0, openIdx + open.length);
const after = indexHtml.slice(closeIdx);
const next = before + "\n" + encoded + "\n  " + after;

fs.writeFileSync(indexPath, next);
console.log("Patched index.html — template length:", encoded.length);
