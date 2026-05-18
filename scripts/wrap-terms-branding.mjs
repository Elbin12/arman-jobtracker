import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/user/TermsAndConditions.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<h1 className="text-3xl text-gray-900 mb-2 font-bold">\s*\n\s*TruShine Window Cleaning\s*\n\s*<\/h1>/,
  '<h1 className="text-3xl text-gray-900 mb-2 font-bold">{profile.name}</h1>'
);

content = content.replace(
  /<strong>"TruShine \/ TWC"<\/strong> = TruShine Window Cleaning\./g,
  '<strong>"{profile.name} / TWC"</strong> = {profile.name}.'
);

const wrapText = (text) => {
  const trimmed = text.trim();
  if (!trimmed.includes('TruShine')) return null;
  if (trimmed.includes('{t(') || trimmed.includes('{profile')) return null;
  const escaped = trimmed
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `{t(\`${escaped}\`)}`;
};

content = content.replace(
  /(<p className="[^"]*">)\s*([^<{][^<]*TruShine[^<]*)\s*(<\/p>)/g,
  (match, open, text, close) => {
    const wrapped = wrapText(text);
    return wrapped ? `${open}${wrapped}${close}` : match;
  }
);

content = content.replace(
  /(<p className="[^"]*text-base[^"]*">)\s*([^<{][^<]*TruShine[^<]*)\s*(<\/p>)/g,
  (match, open, text, close) => {
    const wrapped = wrapText(text);
    return wrapped ? `${open}${wrapped}${close}` : match;
  }
);

// Lines that are bare text nodes between tags (indented content)
content = content.replace(
  /^(\s{24})((?:(?!TruShine)[\s\S])*?TruShine(?:(?!TruShine)[\s\S])*?)$/gm,
  (match, indent, text) => {
    if (text.includes('{t(') || text.includes('{profile') || text.includes('<')) return match;
    const wrapped = wrapText(text);
    return wrapped ? `${indent}{t(\`${text.trim().replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`)}` : match;
  }
);

fs.writeFileSync(file, content);
console.log('Updated', file);
