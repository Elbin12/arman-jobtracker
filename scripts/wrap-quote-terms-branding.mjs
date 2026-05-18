import fs from 'fs';

const file = 'src/pages/user/QuoteDetailsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const wrap = (text) => {
  const trimmed = text.trim();
  if (!trimmed.includes('TruShine')) return null;
  if (trimmed.includes('termsCompanyLabel') || trimmed.includes('{profile')) return null;
  const escaped = trimmed
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `{termsCompanyLabel(\`${escaped}\`)}`;
};

// Typography body text lines with TruShine (indented content)
content = content.replace(
  /^(\s+)([^<{][^\n]*TruShine[^\n]*)$/gm,
  (match, indent, text) => {
    const wrapped = wrap(text);
    return wrapped ? `${indent}${wrapped}` : match;
  }
);

// Typography component="li" with TruShine inside
content = content.replace(
  /(<Typography[^>]*>)(\s*[^<{]*TruShine[^<]*)(\s*<\/Typography>)/g,
  (match, open, text, close) => {
    const wrapped = wrap(text);
    return wrapped ? `${open}${wrapped}${close}` : match;
  }
);

fs.writeFileSync(file, content);
console.log('Updated', file);
