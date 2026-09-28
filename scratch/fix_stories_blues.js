const fs = require('fs');
const file = 'apps/vione_app_fe/src/components/business-connect/mobile/NetworkStoriesStrip.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace specific blue elements
content = content.replace(/bg-\[#0052CC\] animate-pulse/g, 'bg-[#D8B282] animate-pulse');
content = content.replace(/border-\[#0052CC\]\/40 bg-gradient-to-b from-\[#0052CC\]\/10 via-\[#0052CC\]\/5 to-transparent dark:from-\[#0052CC\]\/20 dark:to-slate-900\/80 shadow-xs cursor-pointer flex flex-col items-center justify-between p-2\.5 transition-all hover:scale-\[1\.02\] hover:border-\[#0052CC\]/g,
  'border-[#D8B282]/40 bg-gradient-to-b from-[#D8B282]/15 via-[#D8B282]/5 to-transparent dark:from-[#D8B282]/20 dark:to-stone-900/80 shadow-xs cursor-pointer flex flex-col items-center justify-between p-2.5 transition-all hover:scale-[1.02] hover:border-[#D8B282]');

content = content.replace(/bg-gradient-to-tr from-\[#0052CC\] to-sky-400/g, 'bg-gradient-to-tr from-[#D8B282] to-[#F6E1C3]');
content = content.replace(/bg-gradient-to-tr from-\[#0052CC\] via-sky-400 to-\[#0052CC\]/g, 'bg-gradient-to-tr from-[#F6E1C3] via-[#D8B282] to-[#8C653B]');

content = content.replace(/rounded-full bg-\[#0052CC\] text-white/g, 'rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 font-black');
content = content.replace(/text-\[#0052CC\] dark:text-sky-400/g, 'text-amber-800 dark:text-[#F6E1C3]');
content = content.replace(/text-sky-300 backdrop-blur-md border border-sky-400\/30/g, 'text-[#F6E1C3] backdrop-blur-md border border-amber-400/30');
content = content.replace(/text-sky-200\/90/g, 'text-amber-200/90');
content = content.replace(/bg-blue-500\/10 text-\[#0052CC\]/g, 'bg-amber-500/10 text-amber-700 dark:text-[#F6E1C3]');

content = content.replace(/border-\[#0052CC\]\/40 hover:border-\[#0052CC\] bg-blue-50\/30 dark:bg-blue-950\/20/g,
  'border-[#D8B282]/40 hover:border-[#D8B282] bg-amber-50/30 dark:bg-amber-950/20');
content = content.replace(/bg-\[#0052CC\]\/10 text-\[#0052CC\]/g, 'bg-[#D8B282]/15 text-[#D8B282]');
content = content.replace(/text-xs font-bold text-\[#0052CC\]/g, 'text-xs font-bold text-amber-800 dark:text-[#F6E1C3]');
content = content.replace(/focus:ring-\[#0052CC\]/g, 'focus:ring-[#D8B282]');

content = content.replace(/"bg-\[#0052CC\] text-white shadow-xs"/g, '"bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 shadow-xs font-bold"');
content = content.replace(/bg-\[#0052CC\] hover:bg-\[#003B95\] text-white/g, 'bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950');

content = content.replace(/h-full bg-\[#0052CC\]/g, 'h-full bg-[#D8B282]');
content = content.replace(/text-sky-300 font-medium/g, 'text-[#F6E1C3] font-medium');
content = content.replace(/text-sky-300/g, 'text-[#F6E1C3]');

content = content.replace(/bg-\[#0052CC\] text-white hover:bg-\[#003B95\]/g, 'bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-slate-950 hover:opacity-90');

fs.writeFileSync(file, content, 'utf8');
console.log('Updated NetworkStoriesStrip.tsx successfully');
