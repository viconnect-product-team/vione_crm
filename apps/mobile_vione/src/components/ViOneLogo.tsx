// ViOne Mobile Native — Wordmark logo (Gold gradient vector)
// Matching 100% Web PWA ViOneLogo.tsx using react-native-svg

import React from "react";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
  Mask,
  G,
  Path,
} from "react-native-svg";

interface ViOneLogoProps {
  width?: number;
  height?: number;
}

export const ViOneLogo: React.FC<ViOneLogoProps> = ({ width = 74, height = 28 }) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 53 20"
      fill="none"
    >
      <Defs>
        <LinearGradient id="vl_p0" x1="4.55612" y1="18.3555" x2="34.4335" y2="-33.7855" gradientUnits="userSpaceOnUse">
          <Stop offset="0.06" stopColor="#AB6D3C" />
          <Stop offset="0.3" stopColor="#FDE6B4" />
          <Stop offset="1" stopColor="#BB7E47" />
        </LinearGradient>
        <LinearGradient id="vl_p1" x1="1.87553" y1="5.0762" x2="12.8604" y2="23.6586" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#AB6D3C" />
          <Stop offset="0.02" stopColor="#AE7241" />
          <Stop offset="0.19" stopColor="#CA9B6A" />
          <Stop offset="0.35" stopColor="#E0BB8A" />
          <Stop offset="0.5" stopColor="#F0D3A1" />
          <Stop offset="0.65" stopColor="#F9E1AF" />
          <Stop offset="0.78" stopColor="#FDE6B4" />
          <Stop offset="0.84" stopColor="#FBE3B1" />
          <Stop offset="0.88" stopColor="#F6DBA9" />
          <Stop offset="0.92" stopColor="#EDCE9B" />
          <Stop offset="0.95" stopColor="#E1BA86" />
          <Stop offset="0.97" stopColor="#D1A26C" />
          <Stop offset="1" stopColor="#BB7E47" />
        </LinearGradient>
        <LinearGradient id="vl_p2" x1="52.2885" y1="12.8195" x2="42.5278" y2="12.8607" gradientUnits="userSpaceOnUse">
          <Stop offset="0.14" stopColor="#AB6D3C" />
          <Stop offset="0.17" stopColor="#B27847" />
          <Stop offset="0.29" stopColor="#CD9F6E" />
          <Stop offset="0.41" stopColor="#E2BE8C" />
          <Stop offset="0.53" stopColor="#F0D4A2" />
          <Stop offset="0.64" stopColor="#F9E1AF" />
          <Stop offset="0.74" stopColor="#FDE6B4" />
          <Stop offset="0.85" stopColor="#FBE4B2" />
          <Stop offset="0.89" stopColor="#F7DDAB" />
          <Stop offset="0.92" stopColor="#EFD19F" />
          <Stop offset="0.95" stopColor="#E3C08E" />
          <Stop offset="0.97" stopColor="#D4AA79" />
          <Stop offset="0.98" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p3" x1="7.0298" y1="12.8388" x2="51.6752" y2="12.8388" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#DAB88D" />
          <Stop offset="0.31" stopColor="#EFDDBA" />
          <Stop offset="1" stopColor="#E6BD86" />
        </LinearGradient>
        <LinearGradient id="vl_p4" x1="44.0826" y1="12.8388" x2="52.3727" y2="12.8388" gradientUnits="userSpaceOnUse">
          <Stop offset="0.14" stopColor="#AB6D3C" />
          <Stop offset="0.17" stopColor="#B27847" />
          <Stop offset="0.29" stopColor="#CD9F6E" />
          <Stop offset="0.41" stopColor="#E2BE8C" />
          <Stop offset="0.53" stopColor="#F0D4A2" />
          <Stop offset="0.64" stopColor="#F9E1AF" />
          <Stop offset="0.74" stopColor="#FDE6B4" />
          <Stop offset="0.85" stopColor="#FBE4B2" />
          <Stop offset="0.89" stopColor="#F7DDAB" />
          <Stop offset="0.92" stopColor="#EFD19F" />
          <Stop offset="0.95" stopColor="#E3C08E" />
          <Stop offset="0.97" stopColor="#D4AA79" />
          <Stop offset="0.98" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p5" x1="40.5534" y1="19.6031" x2="40.5534" y2="6.8068" gradientUnits="userSpaceOnUse">
          <Stop offset="0.07" stopColor="#AB6D3C" />
          <Stop offset="0.16" stopColor="#C18D5C" />
          <Stop offset="0.35" stopColor="#ECCD9B" />
          <Stop offset="0.44" stopColor="#FDE6B4" />
          <Stop offset="0.56" stopColor="#FAE2B0" />
          <Stop offset="0.66" stopColor="#F3D8A6" />
          <Stop offset="0.75" stopColor="#E7C694" />
          <Stop offset="0.84" stopColor="#D7AE7C" />
          <Stop offset="0.93" stopColor="#C18E5D" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p6" x1="37.6738" y1="4.613" x2="37.6738" y2="22.4526" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#AD703F" />
          <Stop offset="0.01" stopColor="#C2905E" />
          <Stop offset="0.03" stopColor="#D4AA79" />
          <Stop offset="0.05" stopColor="#E3C08E" />
          <Stop offset="0.07" stopColor="#EFD19F" />
          <Stop offset="0.09" stopColor="#F7DDAB" />
          <Stop offset="0.12" stopColor="#FBE4B2" />
          <Stop offset="0.22" stopColor="#FDE6B4" />
          <Stop offset="0.32" stopColor="#F9E1AF" />
          <Stop offset="0.42" stopColor="#F0D4A2" />
          <Stop offset="0.54" stopColor="#E1BE8C" />
          <Stop offset="0.65" stopColor="#CD9F6D" />
          <Stop offset="0.77" stopColor="#B27746" />
          <Stop offset="0.8" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p7" x1="37.6754" y1="6.45052" x2="37.6754" y2="23.0002" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#AB6D3C" />
          <Stop offset="0.04" stopColor="#BE8958" />
          <Stop offset="0.1" stopColor="#D1A674" />
          <Stop offset="0.16" stopColor="#E1BD8B" />
          <Stop offset="0.22" stopColor="#EDCF9D" />
          <Stop offset="0.3" stopColor="#F6DCAA" />
          <Stop offset="0.41" stopColor="#FBE3B1" />
          <Stop offset="0.65" stopColor="#FDE6B4" />
          <Stop offset="0.8" stopColor="#FBE4B2" />
          <Stop offset="0.85" stopColor="#F7DDAB" />
          <Stop offset="0.89" stopColor="#EFD19F" />
          <Stop offset="0.93" stopColor="#E3C08E" />
          <Stop offset="0.95" stopColor="#D4AA79" />
          <Stop offset="0.98" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p8" x1="34.7954" y1="19.6031" x2="34.7954" y2="6.8068" gradientUnits="userSpaceOnUse">
          <Stop offset="0.07" stopColor="#AB6D3C" />
          <Stop offset="0.16" stopColor="#C18D5C" />
          <Stop offset="0.35" stopColor="#ECCD9B" />
          <Stop offset="0.44" stopColor="#FDE6B4" />
          <Stop offset="0.56" stopColor="#FAE2B0" />
          <Stop offset="0.66" stopColor="#F3D8A6" />
          <Stop offset="0.75" stopColor="#E7C694" />
          <Stop offset="0.84" stopColor="#D7AE7C" />
          <Stop offset="0.93" stopColor="#C18E5D" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p9" x1="17.438" y1="18.5591" x2="17.438" y2="4.24762" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#AB6D3C" />
          <Stop offset="0.45" stopColor="#FDE6B4" />
          <Stop offset="0.69" stopColor="#FBE4B2" />
          <Stop offset="0.78" stopColor="#F7DDAB" />
          <Stop offset="0.84" stopColor="#EFD19F" />
          <Stop offset="0.89" stopColor="#E3C08E" />
          <Stop offset="0.93" stopColor="#D4AA79" />
          <Stop offset="0.96" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p10" x1="16.2525" y1="8.75596" x2="16.2525" y2="23.0683" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#AB6D3C" />
          <Stop offset="0.45" stopColor="#FDE6B4" />
          <Stop offset="0.53" stopColor="#F7DEAC" />
          <Stop offset="0.65" stopColor="#EACA98" />
          <Stop offset="0.79" stopColor="#D3A877" />
          <Stop offset="0.96" stopColor="#B47A49" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p11" x1="16.8447" y1="19.9188" x2="16.8447" y2="11.9445" gradientUnits="userSpaceOnUse">
          <Stop offset="0.29" stopColor="#AB6D3C" />
          <Stop offset="0.48" stopColor="#FDE6B4" />
          <Stop offset="0.7" stopColor="#FBE4B2" />
          <Stop offset="0.79" stopColor="#F7DDAB" />
          <Stop offset="0.84" stopColor="#EFD19F" />
          <Stop offset="0.89" stopColor="#E3C08E" />
          <Stop offset="0.93" stopColor="#D4AA79" />
          <Stop offset="0.97" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p12" x1="16.8413" y1="5.99395" x2="16.8487" y2="11.6936" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#AB6D3C" />
          <Stop offset="0.73" stopColor="#FDE6B4" />
          <Stop offset="0.85" stopColor="#FBE4B2" />
          <Stop offset="0.89" stopColor="#F7DDAB" />
          <Stop offset="0.92" stopColor="#EFD19F" />
          <Stop offset="0.94" stopColor="#E3C08E" />
          <Stop offset="0.96" stopColor="#D4AA79" />
          <Stop offset="0.98" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p13" x1="32.4937" y1="11.2401" x2="19.2475" y2="11.2401" gradientUnits="userSpaceOnUse">
          <Stop offset="0.14" stopColor="#AB6D3C" />
          <Stop offset="0.17" stopColor="#B27847" />
          <Stop offset="0.29" stopColor="#CD9F6E" />
          <Stop offset="0.41" stopColor="#E2BE8C" />
          <Stop offset="0.53" stopColor="#F0D4A2" />
          <Stop offset="0.64" stopColor="#F9E1AF" />
          <Stop offset="0.74" stopColor="#FDE6B4" />
          <Stop offset="0.85" stopColor="#FBE4B2" />
          <Stop offset="0.89" stopColor="#F7DDAB" />
          <Stop offset="0.92" stopColor="#EFD19F" />
          <Stop offset="0.95" stopColor="#E3C08E" />
          <Stop offset="0.97" stopColor="#D4AA79" />
          <Stop offset="0.98" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <LinearGradient id="vl_p14" x1="7.03618" y1="11.2401" x2="51.6741" y2="11.2401" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#DAB88D" />
          <Stop offset="0.31" stopColor="#EFDDBA" />
          <Stop offset="1" stopColor="#E6BD86" />
        </LinearGradient>
        <LinearGradient id="vl_p15" x1="18.1171" y1="11.2401" x2="35.5704" y2="11.2401" gradientUnits="userSpaceOnUse">
          <Stop offset="0.14" stopColor="#AB6D3C" />
          <Stop offset="0.17" stopColor="#B27847" />
          <Stop offset="0.29" stopColor="#CD9F6E" />
          <Stop offset="0.41" stopColor="#E2BE8C" />
          <Stop offset="0.53" stopColor="#F0D4A2" />
          <Stop offset="0.64" stopColor="#F9E1AF" />
          <Stop offset="0.74" stopColor="#FDE6B4" />
          <Stop offset="0.85" stopColor="#FBE4B2" />
          <Stop offset="0.89" stopColor="#F7DDAB" />
          <Stop offset="0.92" stopColor="#EFD19F" />
          <Stop offset="0.95" stopColor="#E3C08E" />
          <Stop offset="0.97" stopColor="#D4AA79" />
          <Stop offset="0.98" stopColor="#C2905E" />
          <Stop offset="1" stopColor="#AB6D3C" />
        </LinearGradient>
        <ClipPath id="vl_clip0">
          <Rect width={12.9154} height={12.8185} x={19.4238} y={4.8308} />
        </ClipPath>
        <Mask id="vl_mask0" maskUnits="userSpaceOnUse" x={19} y={4} width={14} height={14}>
          <G clipPath="url(#vl_clip0)">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M19.4238 4.83081H32.3392V17.6493H19.4238V4.83081ZM25.8815 11.2401L28.9718 1.7298L35.3918 8.14981L25.8815 11.2401Z"
              fill="white"
            />
          </G>
        </Mask>
      </Defs>

      <Path
        d="M16.9545 6.07668C17.0988 6.16152 17.2239 6.23384 17.3341 6.29575C17.3665 6.28005 17.3979 6.26471 17.428 6.24936C17.6507 6.13594 17.8593 6.14017 18.0282 6.18427C18.0113 5.54963 17.488 5.04004 16.8443 5.04004C16.2365 5.04004 15.736 5.49442 15.668 6.07932C15.8507 5.84578 16.2239 5.64629 16.9547 6.0765L16.9545 6.07668Z"
        fill="#FCE5B3"
      />
      <Path
        d="M15.81 6.78787C16.1603 6.77976 16.8639 6.52312 17.3347 6.29575C17.2245 6.23384 17.0994 6.16152 16.9551 6.07668C16.2244 5.64646 15.8512 5.84596 15.6683 6.0795C15.6632 6.1243 15.6602 6.16963 15.6602 6.21585C15.6602 6.42346 15.7147 6.61854 15.8098 6.78787H15.81Z"
        fill="#D8AF7D"
      />
      <Path
        d="M17.4278 6.24924C17.3978 6.26441 17.3663 6.27993 17.334 6.29563C17.6471 6.47184 17.8345 6.56215 17.9621 6.60431C18.0083 6.47343 18.0321 6.33214 18.0282 6.18468L18.0278 6.18415C17.859 6.13988 17.6503 6.13582 17.4276 6.24924H17.4278Z"
        fill="#E7C692"
      />
      <Path
        d="M15.8105 6.78778C16.013 7.14779 16.4004 7.39138 16.8454 7.39138C17.3624 7.39138 17.8018 7.06259 17.9635 6.60433C17.8359 6.562 17.6486 6.47187 17.3354 6.29565C16.8646 6.52302 16.1608 6.77966 15.8107 6.78778H15.8105Z"
        fill="#C79564"
      />
      <Path
        d="M14.2683 5.04384L10.3332 5.04013L7.13474 10.5385L9.10357 13.9227L14.2683 5.04384Z"
        fill="url(#vl_p0)"
      />
      <Path
        d="M7.13388 10.5384L3.93554 5.04004L0 5.04374L5.1654 13.9226L7.13405 17.3068L9.10271 13.9226L7.13388 10.5384Z"
        fill="url(#vl_p1)"
      />
      <Path
        d="M52.238 12.7766C52.238 11.5278 51.7928 10.4436 50.9026 9.52351C50.0123 8.60382 48.9407 8.1438 47.6875 8.1438C46.356 8.1438 45.236 8.61017 44.3276 9.54291C43.4191 10.4757 42.9648 11.595 42.9648 12.901C42.9648 13.5489 43.0797 14.1447 43.3095 14.6889C43.5393 15.233 43.8812 15.7304 44.3355 16.1813C45.2596 17.083 46.364 17.5338 47.6484 17.5338C48.5882 17.5338 49.468 17.259 50.2878 16.7098C51.1075 16.1605 51.6506 15.4893 51.9168 14.6965H50.8103C50.1746 15.7444 49.0174 16.4454 47.6953 16.4454C45.6883 16.4454 44.0614 14.8305 44.0614 12.8387C44.0614 10.847 45.6885 9.23212 47.6953 9.23212C49.7022 9.23212 51.3293 10.847 51.3293 12.8387C51.3293 13.1642 51.285 13.4794 51.2036 13.7792H52.1283C52.1283 13.7792 52.2195 13.5965 52.238 13.0797C52.2416 12.9814 52.238 12.8802 52.238 12.7765V12.7766Z"
        fill="url(#vl_p2)"
      />
      <Path
        d="M47.6964 9.23218C45.6894 9.23218 44.0625 10.847 44.0625 12.8388C44.0625 14.8306 45.6896 16.4454 47.6964 16.4454C49.0187 16.4454 50.1757 15.7444 50.8114 14.6965H49.5604C49.3516 14.935 49.071 15.1229 48.7185 15.2601C48.3661 15.3975 47.9835 15.4661 47.5711 15.4661C47.028 15.4661 46.5412 15.3134 46.1104 15.0075C45.6796 14.7018 45.386 14.2924 45.2293 13.7793H51.2047C51.2861 13.4794 51.3304 13.1642 51.3304 12.8388C51.3304 10.8468 49.7033 9.23218 47.6964 9.23218ZM45.198 11.8983C45.3546 11.3956 45.6706 10.9888 46.1456 10.6779C46.6207 10.3671 47.1297 10.2115 47.6728 10.2115C48.2159 10.2115 48.7249 10.3657 49.1687 10.674C49.6125 10.9823 49.9207 11.3905 50.0929 11.8983H45.1978H45.198Z"
        fill="url(#vl_p3)"
      />
      <Path
        d="M39.4883 17.0393V17.5339H41.6187V17.0393L40.4398 16.5403L39.4883 17.0393Z"
        fill="url(#vl_p5)"
      />
      <Path
        d="M41.5233 11.3075C41.4242 10.7116 41.2205 10.2036 40.9125 9.78401C40.8759 9.71663 40.8446 9.67518 40.8185 9.65966L40.6854 9.52754C40.3669 9.18041 39.983 8.91089 39.5341 8.71915C39.085 8.5276 38.6255 8.43164 38.1556 8.43164C37.6857 8.43164 37.1796 8.48121 36.7655 8.71157C36.3329 8.95216 36.1372 9.15554 35.8605 9.51308V8.71157H33.7305V17.0394L34.9093 16.5406V12.892C34.9093 12.878 34.9084 12.8643 34.9084 12.8502C34.9084 11.0866 36.1465 9.65701 37.6735 9.65701C39.2005 9.65701 40.4385 11.0866 40.4385 12.8502V16.5406L41.6174 17.0396V12.9634C41.6174 12.2326 41.5861 11.6809 41.5233 11.3077V11.3075Z"
        fill="url(#vl_p6)"
      />
      <Path
        d="M37.6752 9.65674C36.148 9.65674 34.9102 11.0864 34.9102 12.8499C34.9102 12.8638 34.9109 12.8776 34.911 12.8917V16.5403L35.8621 17.0393V16.2039H35.8626V13.2665C35.8626 13.0282 35.8677 12.8222 35.8782 12.6485C35.8887 12.4749 35.9044 12.3026 35.9253 12.1315C35.9722 11.7895 36.0689 11.5032 36.215 11.2725C36.3611 11.0419 36.5753 10.8555 36.8573 10.7128C37.1392 10.5703 37.4212 10.499 37.7031 10.499C37.985 10.499 38.2475 10.565 38.5059 10.6973C38.7643 10.8294 38.9719 11.0199 39.1285 11.2686C39.2955 11.5071 39.4025 11.8411 39.4496 12.2713C39.4757 12.3698 39.4887 12.5227 39.4887 12.73V17.0393L40.4402 16.5403V12.8499C40.4402 11.0864 39.2022 9.65674 37.6752 9.65674Z"
        fill="url(#vl_p7)"
      />
      <Path
        d="M34.9093 16.5403L33.7305 17.0391V17.5339H35.8603V17.0393L34.9093 16.5403Z"
        fill="url(#vl_p8)"
      />
      <Path
        d="M16.8456 16.5403L18.0303 17.2191V8.76528L16.8456 9.44385V16.5403Z"
        fill="url(#vl_p9)"
      />
      <Path
        d="M16.8447 9.44388L15.6602 8.76514V17.2189L16.8447 16.5403V9.44388Z"
        fill="url(#vl_p10)"
      />
      <Path
        d="M15.6602 17.2189V17.5554H18.0294V17.219L16.8447 16.5403L15.6602 17.2189Z"
        fill="url(#vl_p11)"
      />
      <Path
        d="M18.0294 8.76519V8.42847H15.6602V8.76502L16.8447 9.44376L18.0294 8.76519Z"
        fill="url(#vl_p12)"
      />
      <G mask="url(#vl_mask0)">
        <Path
          d="M25.8815 4.83081C22.3149 4.83081 19.4238 7.7003 19.4238 11.2401C19.4238 14.7798 22.3151 17.6493 25.8815 17.6493C29.4479 17.6493 32.3393 14.7798 32.3393 11.2401C32.3393 7.7003 29.448 4.83081 25.8815 4.83081ZM25.8815 16.4765C22.9675 16.4765 20.6053 14.1321 20.6053 11.2401C20.6053 8.348 22.9675 6.00362 25.8815 6.00362C28.7954 6.00362 31.1576 8.348 31.1576 11.2401C31.1576 14.1321 28.7954 16.4765 25.8815 16.4765Z"
          fill="url(#vl_p13)"
        />
        <Path
          d="M25.8816 6.00366C22.9676 6.00366 20.6055 8.34804 20.6055 11.2401C20.6055 14.1322 22.9676 16.4766 25.8816 16.4766C28.7956 16.4766 31.1577 14.1322 31.1577 11.2401C31.1577 8.34804 28.7956 6.00366 25.8816 6.00366ZM25.8816 15.311C23.6163 15.311 21.7801 13.4884 21.7801 11.2403C21.7801 8.99221 23.6163 7.16941 25.8816 7.16941C28.1469 7.16941 29.9833 8.99204 29.9833 11.2403C29.9833 13.4885 28.1469 15.311 25.8816 15.311Z"
          fill="url(#vl_p14)"
        />
      </G>
      <Path
        d="M29.8796 7.02443C30.0336 7.11623 30.1672 7.19423 30.2849 7.26116C30.3194 7.24431 30.3531 7.22747 30.385 7.21108C30.6229 7.08864 30.8457 7.09305 31.0259 7.14076C31.0079 6.45476 30.4491 5.9042 29.7618 5.9042C29.1128 5.9042 28.5783 6.39518 28.5056 7.02748C28.7007 6.77504 29.0993 6.55945 29.8797 7.02443H29.8796Z"
        fill="#FCE5B3"
      />
      <Path
        d="M28.6568 7.79307C29.0309 7.78436 29.7824 7.50682 30.2851 7.26127C30.1675 7.19435 30.0339 7.11623 29.8798 7.02454C29.0994 6.55956 28.7009 6.77515 28.5057 7.02759C28.5001 7.07598 28.4969 7.12505 28.4969 7.1749C28.4969 7.39931 28.5551 7.61015 28.6567 7.79307H28.6568Z"
        fill="#D8AF7D"
      />
      <Path
        d="M30.3857 7.21105C30.3538 7.22755 30.3201 7.24428 30.2855 7.26113C30.62 7.45162 30.8201 7.54907 30.9564 7.59475C31.0057 7.45332 31.0311 7.30058 31.0271 7.14129L31.0266 7.14073C30.8464 7.09291 30.6236 7.0885 30.3857 7.21105Z"
        fill="#E7C692"
      />
      <Path
        d="M28.6565 7.79311C28.8727 8.18223 29.2865 8.44553 29.7617 8.44553C30.3138 8.44553 30.7829 8.09021 30.9556 7.59493C30.8193 7.54926 30.6192 7.45169 30.2847 7.26131C29.7819 7.50698 29.0304 7.78441 28.6565 7.79311Z"
        fill="#C79564"
      />
    </Svg>
  );
};
