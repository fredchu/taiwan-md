import { readFile } from 'fs/promises';
import { resolve } from 'path';

export async function getLangSwitchPath(currentPath: string) {
  // Language switch logic — use _translations.json for article pages
  let zhLink = '/';
  let enLink = '/en';

  // Build translation lookup from _translations.json
  const translationMap = new Map<string, string>(); // enUrl → zhUrl
  const reverseMap = new Map<string, string>(); // zhUrl → enUrl
  try {
    const translationsPath = resolve(
      process.cwd(),
      'knowledge',
      '_translations.json',
    );
    const raw = await readFile(translationsPath, 'utf-8');
    const translations: Record<string, string> = JSON.parse(raw);
    const categoryFolderToSlug: Record<string, string> = {
      History: 'history',
      Geography: 'geography',
      Culture: 'culture',
      Food: 'food',
      Art: 'art',
      Music: 'music',
      Technology: 'technology',
      Nature: 'nature',
      People: 'people',
      Society: 'society',
      Economy: 'economy',
      Lifestyle: 'lifestyle',
      About: 'about',
    };
    for (const [enFile, zhFile] of Object.entries(translations)) {
      const enParts = enFile.replace(/\.md$/, '').split('/');
      const zhParts = zhFile.replace(/\.md$/, '').split('/');
      if (enParts.length >= 3 && zhParts.length >= 2) {
        const enCatSlug =
          categoryFolderToSlug[enParts[1]] || enParts[1].toLowerCase();
        const zhCatSlug =
          categoryFolderToSlug[zhParts[0]] || zhParts[0].toLowerCase();
        const enUrl = `/en/${enCatSlug}/${enParts[2]}`;
        const zhUrl = `/${zhCatSlug}/${encodeURIComponent(zhParts[1])}`;
        translationMap.set(enUrl, zhUrl);
        reverseMap.set(zhUrl, enUrl);
      }
    }
  } catch {}

  if (currentPath.startsWith('/en')) {
    enLink = currentPath;
    const decoded = decodeURIComponent(currentPath);
    zhLink =
      translationMap.get(decoded) ||
      translationMap.get(currentPath) ||
      (() => {
        const match = currentPath.match(/^\/en\/([^/]+)\/[^/]+$/);
        return match ? `/${match[1]}` : currentPath.replace(/^\/en/, '') || '/';
      })();
  } else {
    zhLink = currentPath;
    const decoded = decodeURIComponent(currentPath);
    enLink =
      reverseMap.get(decoded) ||
      reverseMap.get(currentPath) ||
      (() => {
        const match = currentPath.match(/^\/([^/]+)\/[^/]+$/);
        return match
          ? `/en/${match[1]}`
          : '/en' + (currentPath === '/' ? '' : currentPath);
      })();
  }

  return {
    enLink,
    zhLink,
  };
}
