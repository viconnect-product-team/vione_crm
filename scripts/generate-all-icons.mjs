import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SVG_CONTENT = `<svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.5093 3.42264C16.7526 3.56587 16.9636 3.68758 17.1493 3.792C17.2039 3.76572 17.257 3.73943 17.3075 3.71386C17.683 3.52283 18.0349 3.52971 18.3195 3.60414C18.291 2.53382 17.4086 1.6748 16.3234 1.6748C15.2987 1.6748 14.4547 2.44086 14.3398 3.4274C14.648 3.03353 15.2773 2.69715 16.5095 3.42264H16.5093Z" fill="#FCE5B3"/>
<path d="M14.5787 4.62191C15.1693 4.60832 16.356 4.17529 17.1497 3.79217C16.964 3.68775 16.753 3.56587 16.5097 3.42282C15.2775 2.69733 14.6482 3.0337 14.34 3.42758C14.3311 3.50307 14.3262 3.57963 14.3262 3.65741C14.3262 4.00754 14.4181 4.33651 14.5785 4.62191H14.5787Z" fill="#D8AF7D"/>
<path d="M17.3086 3.71382C17.2581 3.73957 17.205 3.76567 17.1504 3.79196C17.6784 4.08917 17.9944 4.24122 18.2096 4.31248C18.2875 4.09182 18.3276 3.85352 18.3212 3.60498L18.3205 3.6041C18.036 3.52949 17.6841 3.52261 17.3086 3.71382Z" fill="#E7C692"/>
<path d="M14.5781 4.62197C14.9195 5.2291 15.5729 5.63991 16.3232 5.63991C17.1949 5.63991 17.9357 5.08552 18.2083 4.31276C17.9931 4.2415 17.6773 4.08927 17.1491 3.79224C16.3552 4.17553 15.1685 4.60839 14.5781 4.62197Z" fill="#C79564"/>
<path d="M15.2189 10.7617L12.4208 10.759L10.1465 14.6687L11.5464 17.075L15.2189 10.7617Z" fill="url(#paint0_linear_274_2)"/>
<path d="M10.1468 14.6687L7.87267 10.759L5.07422 10.7617L8.74708 17.0752L10.147 19.4814L11.5468 17.075L10.1468 14.6687Z" fill="url(#paint1_linear_274_2)"/>
<path d="M1.34893 10.1175C1.34893 5.28355 5.29744 1.36472 10.168 1.36472C11.0964 1.36472 11.9911 1.50777 12.8314 1.77182C13.0699 1.33808 13.3875 0.95338 13.7662 0.637821C12.6553 0.225777 11.4526 0 10.197 0C4.5654 0 0 4.53107 0 10.1203C0 14.9537 3.41427 18.9951 7.97967 20L6.97748 18.2772C3.68441 17.0079 1.34893 13.8343 1.34893 10.1175Z" fill="url(#paint2_linear_274_2)"/>
<path d="M19.5115 5.99902C19.2127 6.39995 18.8385 6.74197 18.4105 7.00603C18.7812 7.97316 18.9861 9.02127 18.9861 10.1175C18.9861 13.8058 16.6864 16.9589 13.4333 18.2476L12.4141 19.9999C16.9789 18.9948 20.393 14.9536 20.393 10.1203C20.393 8.65244 20.0777 7.25791 19.5113 5.99902H19.5115Z" fill="url(#paint3_linear_274_2)"/>
<path d="M2.86916 11.2141C2.82348 10.9102 2.79824 10.5997 2.79131 10.2847C2.79007 10.2299 2.78705 10.1754 2.78705 10.1203C2.78705 6.05845 6.10482 2.76562 10.1976 2.76562C10.9603 2.76562 11.696 2.88028 12.3885 3.09265C12.4567 2.61993 12.6103 2.1749 12.8321 1.77185C11.9918 1.5078 11.0971 1.36475 10.1687 1.36475C5.29812 1.36475 1.34961 5.28357 1.34961 10.1175C1.34961 13.8344 3.68509 17.0078 6.97816 18.2772L5.57644 15.8679C4.1486 14.7355 3.15121 13.0914 2.86916 11.2143V11.2141Z" fill="url(#paint4_linear_274_2)"/>
<path d="M18.9864 10.1176C18.9864 9.02134 18.7815 7.97307 18.4108 7.0061C18.0224 7.24582 17.59 7.42168 17.1274 7.51675C17.4363 8.32637 17.6069 9.20355 17.6069 10.1204C17.6069 10.1756 17.6039 10.23 17.6027 10.2848C17.5957 10.5998 17.5705 10.9105 17.5248 11.2144C17.2428 13.091 16.2457 14.7349 14.8182 15.8672L13.4336 18.2475C16.6867 16.959 18.9864 13.8059 18.9864 10.1176Z" fill="url(#paint5_linear_274_2)"/>
<defs>
<linearGradient id="paint0_linear_274_2" x1="8.31307" y1="20.227" x2="29.5575" y2="-16.8483" gradientUnits="userSpaceOnUse">
<stop offset="0.06" stop-color="#AB6D3C"/>
<stop offset="0.3" stop-color="#FDE6B4"/>
<stop offset="1" stop-color="#BB7E47"/>
</linearGradient>
<linearGradient id="paint1_linear_274_2" x1="6.40787" y1="10.7848" x2="14.2188" y2="23.9979" gradientUnits="userSpaceOnUse">
<stop stop-color="#AB6D3C"/>
<stop offset="0.02" stop-color="#AE7241"/>
<stop offset="0.19" stop-color="#CA9B6A"/>
<stop offset="0.35" stop-color="#E0BB8A"/>
<stop offset="0.5" stop-color="#F0D3A1"/>
<stop offset="0.65" stop-color="#F9E1AF"/>
<stop offset="0.78" stop-color="#FDE6B4"/>
<stop offset="0.84" stop-color="#FBE3B1"/>
<stop offset="0.88" stop-color="#F6DBA9"/>
<stop offset="0.92" stop-color="#EDCE9B"/>
<stop offset="0.95" stop-color="#E1BA86"/>
<stop offset="0.97" stop-color="#D1A26C"/>
<stop offset="1" stop-color="#BB7E47"/>
</linearGradient>
<linearGradient id="paint2_linear_274_2" x1="1.31605" y1="15.6178" x2="21.0611" y2="-4.27686" gradientUnits="userSpaceOnUse">
<stop stop-color="#AB6D3C"/>
<stop offset="0.27" stop-color="#FDE6B4"/>
<stop offset="1" stop-color="#BB7E47"/>
</linearGradient>
<linearGradient id="paint3_linear_274_2" x1="22.3704" y1="1.45578" x2="-6.54727" y2="73.2682" gradientUnits="userSpaceOnUse">
<stop stop-color="#AB6D3C"/>
<stop offset="0.27" stop-color="#FDE6B4"/>
<stop offset="1" stop-color="#BB7E47"/>
</linearGradient>
<linearGradient id="paint4_linear_274_2" x1="1.34961" y1="9.82099" x2="12.8321" y2="9.82099" gradientUnits="userSpaceOnUse">
<stop stop-color="#AB6D3C"/>
<stop offset="0.27" stop-color="#FDE6B4"/>
<stop offset="1" stop-color="#BB7E47"/>
</linearGradient>
<linearGradient id="paint5_linear_274_2" x1="16.21" y1="18.2477" x2="16.21" y2="7.0061" gradientUnits="userSpaceOnUse">
<stop stop-color="#BB7E46"/>
<stop offset="0.27" stop-color="#FDE6B4"/>
<stop offset="1" stop-color="#BB7E47"/>
</linearGradient>
</defs>
</svg>`;

async function main() {
  const rootDir = process.cwd();
  const fePublicDir = path.join(rootDir, 'apps/vione_app_fe/public');
  const mobileAssetsDir = path.join(rootDir, 'apps/mobile_vione/assets');
  const mobileResDir = path.join(rootDir, 'apps/mobile_vione/android/app/src/main/res');

  console.log('1. Saving SVG files...');
  fs.writeFileSync(path.join(fePublicDir, 'vione-gold-icon.svg'), SVG_CONTENT, 'utf8');
  fs.writeFileSync(path.join(fePublicDir, 'vione-favicon.svg'), SVG_CONTENT, 'utf8');
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon_vione_mobile.svg'), SVG_CONTENT, 'utf8');

  // Convert SVG to buffer with high density for sharp
  const svgBuffer = Buffer.from(SVG_CONTENT);

  // Helper to render transparent icon at target size
  async function renderTransparent(size) {
    return sharp(svgBuffer, { density: 600 })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  }

  // Helper to render icon with dark background (for mobile icon / splash)
  async function renderPaddedWithBg(targetWidth, targetHeight, iconSize, bgColor = '#05070E') {
    const iconBuf = await renderTransparent(iconSize);
    return sharp({
      create: {
        width: targetWidth,
        height: targetHeight,
        channels: 4,
        background: bgColor,
      },
    })
      .composite([{ input: iconBuf, gravity: 'center' }])
      .png()
      .toBuffer();
  }

  console.log('2. Rendering Web Icons & Favicons...');
  const png32 = await renderTransparent(32);
  const png64 = await renderTransparent(64);
  const png180 = await renderTransparent(180);
  const png192 = await renderTransparent(192);
  const png512 = await renderTransparent(512);

  // Web outputs
  fs.writeFileSync(path.join(fePublicDir, 'favicon.png'), png64);
  fs.writeFileSync(path.join(fePublicDir, 'favicon.ico'), png32);
  fs.writeFileSync(path.join(fePublicDir, 'brand-favicon-64.png'), png64);
  fs.writeFileSync(path.join(fePublicDir, 'vione-gold-64.png'), png64);
  fs.writeFileSync(path.join(fePublicDir, 'vione-gold-192.png'), png192);
  fs.writeFileSync(path.join(fePublicDir, 'brand-favicon-192.png'), png192);
  fs.writeFileSync(path.join(fePublicDir, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(fePublicDir, 'app-icon-192.png'), png192);
  fs.writeFileSync(path.join(fePublicDir, 'app-icon.png'), png512);
  fs.writeFileSync(path.join(fePublicDir, 'vione-gold-512.png'), png512);

  console.log('3. Rendering Mobile Icons & Splash...');
  // Mobile favicon
  fs.writeFileSync(path.join(mobileAssetsDir, 'favicon.png'), png64);

  // Mobile App Icon: 1024x1024 on #05070E background with 600px logo
  const mobileAppIcon = await renderPaddedWithBg(1024, 1024, 620, '#05070E');
  fs.writeFileSync(path.join(mobileAssetsDir, 'icon.png'), mobileAppIcon);

  // Mobile Adaptive Icon Foreground (transparent 1024x1024, centered ~520px logo for safe zone)
  const adaptiveIconFg = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: await renderTransparent(520), gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(mobileAssetsDir, 'adaptive-icon.png'), adaptiveIconFg);

  // Mobile Splash: 1242x2436 on #05070E background with 400px logo
  const mobileSplash = await renderPaddedWithBg(1242, 2436, 420, '#05070E');
  fs.writeFileSync(path.join(mobileAssetsDir, 'splash.png'), mobileSplash);

  console.log('4. Rendering Android mipmaps...');
  const mipmapSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };

  for (const [folder, size] of Object.entries(mipmapSizes)) {
    const targetDir = path.join(mobileResDir, folder);
    if (fs.existsSync(targetDir)) {
      const launcherIcon = await renderPaddedWithBg(size, size, Math.round(size * 0.75), '#05070E');
      fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), launcherIcon);
      fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), launcherIcon);

      // Foreground for adaptive
      const fgIcon = await sharp({
        create: {
          width: size * 2,
          height: size * 2,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: await renderTransparent(Math.round(size * 1.1)), gravity: 'center' }])
        .png()
        .toBuffer();
      fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fgIcon);
    }
  }

  console.log('All Web and Mobile icons successfully generated and replaced!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
