const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../apps/vione_app_fe/src/components/landing/BusinessConnectLanding.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add keyframes to <style> if missing
if (!content.includes('laserStreamFlow')) {
  const styleMarker = '<style>\n        {`';
  const keyframes = `
          @keyframes laserStreamFlow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -160; }
          }
          @keyframes laserStreamFlowReverse {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 160; }
          }
          .animate-laser-flow {
            animation: laserStreamFlow 4s linear infinite;
          }
          .animate-laser-flow-reverse {
            animation: laserStreamFlowReverse 4s linear infinite;
          }
`;
  content = content.replace(styleMarker, styleMarker + keyframes);
}

// 2. Add laser track divider between sections
const laserTrack = `
      {/* Ocean Current & Laser Energy Track from CEO1983 */}
      <div className="relative w-full h-16 pointer-events-none opacity-45 overflow-hidden -my-8 z-20">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full h-full animate-pulse" style={{ animationDuration: "4s" }}>
          <path d="M0,40 Q360,10 720,40 T1440,40" stroke="#F6E1C3" strokeWidth="2.5" strokeDasharray="16 10" className="animate-laser-flow" opacity="0.85" />
          <path d="M0,55 Q360,75 720,55 T1440,55" stroke="#D8B282" strokeWidth="2" strokeDasharray="20 12" className="animate-laser-flow-reverse" opacity="0.75" />
        </svg>
      </div>
`;

// Insert laser track before SectionFlip3D
content = content.replace(/<\/section>\s*<\/SectionFlip3D>\s*<SectionFlip3D/g, `</section>\n      </SectionFlip3D>\n${laserTrack}\n      <SectionFlip3D`);

// 3. Replace amber occurrences with CEO1983 gold & navy palette
content = content.replace(/from-amber-400 via-yellow-400 to-amber-500/g, 'from-[#F6E1C3] via-[#D8B282] to-[#8C653B]');
content = content.replace(/from-amber-400 via-amber-500 to-yellow-600/g, 'from-[#004b91] via-[#D8B282] to-[#F6E1C3]');
content = content.replace(/from-white via-amber-200 to-amber-400/g, 'from-white via-[#F6E1C3] to-[#D8B282]');
content = content.replace(/text-amber-400/g, 'text-[#D8B282]');
content = content.replace(/text-amber-300/g, 'text-[#F6E1C3]');
content = content.replace(/text-amber-500/g, 'text-[#C29B69]');
content = content.replace(/text-amber-600/g, 'text-[#8C653B]');
content = content.replace(/text-amber-800/g, 'text-[#78350F]');
content = content.replace(/text-amber-700/g, 'text-[#78350F]');
content = content.replace(/border-amber-400\/20/g, 'border-[#D8B282]/30');
content = content.replace(/border-amber-400\/25/g, 'border-[#D8B282]/35');
content = content.replace(/border-amber-400\/30/g, 'border-[#D8B282]/40');
content = content.replace(/border-amber-400\/40/g, 'border-[#D8B282]/50');
content = content.replace(/border-amber-500\/20/g, 'border-[#D8B282]/30');
content = content.replace(/border-amber-500\/30/g, 'border-[#D8B282]/40');
content = content.replace(/border-amber-500\/40/g, 'border-[#D8B282]/50');
content = content.replace(/border-amber-500\/50/g, 'border-[#D8B282]/60');
content = content.replace(/border-amber-500\/60/g, 'border-[#D8B282]/60');
content = content.replace(/border-amber-300\/60/g, 'border-[#F6E1C3]/60');
content = content.replace(/border-amber-300/g, 'border-[#F6E1C3]');
content = content.replace(/bg-amber-400\/20/g, 'bg-[#D8B282]/20');
content = content.replace(/bg-amber-400\/30/g, 'bg-[#D8B282]/30');
content = content.replace(/bg-amber-400\/40/g, 'bg-[#D8B282]/40');
content = content.replace(/bg-amber-500\/10/g, 'bg-[#D8B282]/10');
content = content.replace(/bg-amber-500\/15/g, 'bg-[#D8B282]/15');
content = content.replace(/bg-amber-500\/20/g, 'bg-[#D8B282]/20');
content = content.replace(/bg-amber-500\/30/g, 'bg-[#D8B282]/30');
content = content.replace(/bg-amber-400/g, 'bg-[#D8B282]');
content = content.replace(/bg-amber-500/g, 'bg-[#C29B69]');

// 4. Make sure root has exact CEO1983 background and font
content = content.replace(/bg-\[#050811\] text-slate-100/g, 'bg-[#02040A] text-[#FAF6F0]');
content = content.replace(/bg-\[#04060E\]/g, 'bg-[#02040A]');

// 5. Card background gradient matching CEO1983
content = content.replace(/bg-gradient-to-b from-\[#0E172E\]\/95 via-\[#070D1B\]\/95 to-\[#03060E\]/g, 'bg-gradient-to-b from-[#0F1B36]/95 via-[#080F22]/98 to-[#040814]');
content = content.replace(/bg-gradient-to-b from-\[#040813\] via-\[#081024\] to-\[#03060E\]/g, 'bg-gradient-to-b from-[#02040A] via-[#080F22] to-[#040814]');
content = content.replace(/bg-gradient-to-b from-\[#03060E\] via-\[#091126\] to-\[#050A14\]/g, 'bg-gradient-to-b from-[#040814] via-[#0F1B36]/80 to-[#02040A]');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully transformed BusinessConnectLanding.tsx with CEO1983 palette and laser tracks!');
