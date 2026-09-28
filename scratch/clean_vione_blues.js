const fs = require('fs');
const path = require('path');

function replaceBluesInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace Hex
  content = content.replace(/#0052CC/gi, '#D8B282');
  content = content.replace(/#003B95/gi, '#C29B69');
  content = content.replace(/#1D4ED8/gi, '#D8B282');
  content = content.replace(/#2563EB/gi, '#D8B282');
  content = content.replace(/#3B82F6/gi, '#D8B282');
  content = content.replace(/#0284C7/gi, '#D8B282');
  content = content.replace(/#0369A1/gi, '#C29B69');
  content = content.replace(/#0EA5E9/gi, '#F6E1C3');

  // Replace Tailwind blue/sky classes with amber/gold
  content = content.replace(/\btext-blue-([1-9]00)\b/g, (m, shade) => {
    if (shade <= '300') return 'text-amber-200';
    if (shade <= '500') return 'text-[#D8B282]';
    return 'text-amber-600';
  });
  content = content.replace(/\bbg-blue-([1-9]00)\b/g, (m, shade) => {
    if (shade <= '100') return 'bg-amber-50';
    if (shade <= '300') return 'bg-amber-100';
    if (shade >= '900') return 'bg-stone-900';
    return 'bg-amber-500';
  });
  content = content.replace(/\bborder-blue-([1-9]00)\b/g, (m, shade) => {
    if (shade <= '300') return 'border-amber-200';
    if (shade >= '800') return 'border-amber-900/40';
    return 'border-amber-400';
  });
  content = content.replace(/\bring-blue-([1-9]00)\b/g, 'ring-[#D8B282]');

  content = content.replace(/\btext-sky-([1-9]00)\b/g, (m, shade) => {
    if (shade <= '300') return 'text-[#F6E1C3]';
    if (shade <= '500') return 'text-[#D8B282]';
    return 'text-amber-600';
  });
  content = content.replace(/\bbg-sky-([1-9]00)\b/g, (m, shade) => {
    if (shade <= '100') return 'bg-yellow-50';
    if (shade <= '300') return 'bg-amber-100';
    if (shade >= '900') return 'bg-neutral-900';
    return 'bg-amber-500';
  });
  content = content.replace(/\bborder-sky-([1-9]00)\b/g, (m, shade) => {
    if (shade <= '300') return 'border-amber-200';
    if (shade >= '800') return 'border-amber-900/40';
    return 'border-amber-400';
  });
  content = content.replace(/\bring-sky-([1-9]00)\b/g, 'ring-[#D8B282]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed blue colors in:', path.basename(filePath));
    return true;
  }
  return false;
}

// Danh sách các thư mục / file ViOne cần làm sạch hoàn toàn
const targetFiles = [
  'apps/vione_app_fe/src/components/business-connect/mobile/community/CommunityEventDetail.tsx',
  'apps/vione_app_fe/src/components/business-connect/mobile/ZaloTransactionCard.tsx',
  'apps/vione_app_fe/src/routes/connect-app.inbox.$threadId.tsx',
  'apps/vione_app_fe/src/routes/connect-app.notifications.tsx',
  'apps/vione_app_fe/src/routes/connect-app.network.requests.tsx',
  'apps/vione_app_fe/src/routes/connect-app.network.$personId.tsx',
  'apps/vione_app_fe/src/routes/connect-app.me.card.tsx',
  'apps/vione_app_fe/src/routes/connect-app.me.index.tsx',
  'apps/vione_app_fe/src/routes/connect-app.inbox.index.tsx'
];

targetFiles.forEach(f => {
  const p = path.resolve(f);
  if (fs.existsSync(p)) {
    replaceBluesInFile(p);
  }
});
