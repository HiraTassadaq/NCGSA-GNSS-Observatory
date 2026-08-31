// // // One accent color per panel button, on a shared "frosted navy glass" base
// // // (translucent dark-blue panel + blur + subtle inner highlight) rather than
// // // solid saturated fills. Colors are individually assigned per button id --
// // // spread evenly around the hue wheel, nudged away from
// // // CONSTELLATION_COLORS (GPS green, GLONASS red, GALILEO blue, BEIDOU amber,
// // // QZSS yellow, SBAS purple, NAVIC cyan) so a button never reads as meaning
// // // a specific satellite system, and deliberately steering clear of the
// // // lime/magenta combo used in an earlier pass.
// // const BUTTON_ACCENT = {
// //   snr: '#E58461',
// //   iono: '#E5C661',
// //   multipath: '#C2E561',
// //   completeness: '#80E561',
// //   cycleslips: '#61E584',
// //   alerts: '#61E5C6',
// //   inview: '#61C2E5',
// //   dop: '#6180E5',
// //   constellation: '#8461E5',
// //   groundtrack: '#C661E5',
// //   ionomap: '#E561C2',
// //   table: '#E56180',
// // };
// // const DEFAULT_ACCENT = '#61C2E5';
// // const GUIDE_ACCENT = '#9FB4D6';

// // // Shared navy-glass base: a translucent dark-blue panel with backdrop blur
// // // and a faint top highlight, tinted by each button's own accent color.
// // const GLASS_BASE = {
// //   backdropFilter: 'blur(10px)',
// //   WebkitBackdropFilter: 'blur(10px)',
// // };

// // function glassStyle(accent, isOpen) {
// //   return {
// //     ...GLASS_BASE,
// //     background: isOpen
// //       ? `linear-gradient(180deg, color-mix(in srgb, ${accent} 38%, #0B1526 62%) 0%, color-mix(in srgb, ${accent} 22%, #0B1526 78%) 100%)`
// //       : `linear-gradient(180deg, color-mix(in srgb, ${accent} 16%, #0B1526 84%) 0%, color-mix(in srgb, #0B1526 100%, transparent) 100%)`,
// //     borderColor: isOpen ? accent : `color-mix(in srgb, ${accent} 45%, transparent)`,
// //     color: isOpen ? '#F4F7FB' : accent,
// //     boxShadow: isOpen
// //       ? `inset 0 1px 0 0 rgba(255,255,255,0.14), 0 0 0 1px color-mix(in srgb, ${accent} 35%, transparent), 0 0 14px 0 color-mix(in srgb, ${accent} 30%, transparent)`
// //       : 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
// //   };
// // }

// // export default function WorkspaceLauncher({ items, openIds, onToggle, guideOpen, onToggleGuide }) {
// //   return (
// //     <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-panel overflow-x-auto shrink-0">
// //       <span className="text-[11px] uppercase tracking-wide text-text-muted mr-1 shrink-0 whitespace-nowrap font-semibold">Panels</span>
// //       {items.map((item) => {
// //         const isOpen = openIds.includes(item.id);
// //         const accent = BUTTON_ACCENT[item.id] ?? DEFAULT_ACCENT;
// //         return (
// //           <button
// //             key={item.id}
// //             type="button"
// //             onClick={() => onToggle(item.id)}
// //             style={glassStyle(accent, isOpen)}
// //             className="h-9 px-4 rounded-lg text-[13px] font-bold whitespace-nowrap shrink-0 border transition-all duration-150"
// //           >
// //             {item.label}
// //           </button>
// //         );
// //       })}

// //       <button
// //         type="button"
// //         onClick={onToggleGuide}
// //         title="Dashboard guide"
// //         aria-label="Dashboard guide"
// //         style={glassStyle(GUIDE_ACCENT, guideOpen)}
// //         className="ml-auto h-9 px-4 flex items-center gap-1.5 rounded-lg text-[13px] font-bold whitespace-nowrap shrink-0 border transition-all duration-150"
// //       >
// //         Help Guide
// //       </button>
// //     </div>
// //   );
// // }
// // One accent color per panel button, on a shared "frosted navy glass" base
// const BUTTON_ACCENT = {
//   snr: '#E58461',
//   iono: '#E5C661',
//   multipath: '#C2E561',
//   completeness: '#80E561',
//   cycleslips: '#61E584',
//   alerts: '#61E5C6',
//   inview: '#61C2E5',
//   dop: '#6180E5',
//   constellation: '#8461E5',
//   groundtrack: '#C661E5',
//   ionomap: '#E561C2',
//   table: '#E56180',
// };

// const DEFAULT_ACCENT = '#61C2E5';
// const GUIDE_ACCENT = '#9FB4D6';

// const GLASS_BASE = {
//   backdropFilter: 'blur(12px)',
//   WebkitBackdropFilter: 'blur(12px)',
// };

// function glassStyle(accent, isOpen) {
//   return {
//     ...GLASS_BASE,

//     background: isOpen
//       ? `linear-gradient(
//           180deg,
//           color-mix(in srgb, ${accent} 28%, #0B1526 72%) 0%,
//           color-mix(in srgb, ${accent} 12%, #0B1526 88%) 100%
//         )`
//       : `linear-gradient(
//           180deg,
//           color-mix(in srgb, ${accent} 10%, #0B1526 90%) 0%,
//           #0B1526 100%
//         )`,

//     borderColor: isOpen
//       ? `color-mix(in srgb, ${accent} 75%, transparent)`
//       : `color-mix(in srgb, ${accent} 30%, transparent)`,

//     color: isOpen ? '#F4F7FB' : accent,

//     boxShadow: isOpen
//       ? `
//         inset 0 1px 0 rgba(255,255,255,0.12),
//         0 0 0 1px color-mix(in srgb, ${accent} 18%, transparent),
//         0 3px 10px color-mix(in srgb, ${accent} 15%, transparent)
//       `
//       : `
//         inset 0 1px 0 rgba(255,255,255,0.04)
//       `,
//   };
// }

// export default function WorkspaceLauncher({
//   items,
//   openIds,
//   onToggle,
//   guideOpen,
//   onToggleGuide,
// }) {
//   return (
//     <div
//       className="
//         flex items-center
//         gap-1
//         px-2
//         py-1
//         border-b border-border
//         bg-panel
//         overflow-x-auto
//         shrink-0
//         scrollbar-none
//       "
//     >

//       {/* Section label */}
//       <span
//         className="
//           text-[8px]
//           uppercase
//           tracking-[0.12em]
//           text-text-muted
//           mr-1
//           shrink-0
//           whitespace-nowrap
//           font-bold
//           opacity-70
//         "
//       >
//         Panels
//       </span>

//       {/* Panel buttons */}
//       {items.map((item) => {
//         const isOpen = openIds.includes(item.id);
//         const accent = BUTTON_ACCENT[item.id] ?? DEFAULT_ACCENT;

//         return (
//           <button
//             key={item.id}
//             type="button"
//             onClick={() => onToggle(item.id)}
//             style={glassStyle(accent, isOpen)}
//             title={item.label}
//             className={`
//               group
//               relative
//               h-[22px]
//               px-[7px]
//               rounded-[5px]
//               text-[9px]
//               leading-none
//               font-semibold
//               tracking-[0.01em]
//               whitespace-nowrap
//               shrink-0
//               border
//               transition-all
//               duration-150
//               ease-out
//               hover:-translate-y-[1px]
//               hover:brightness-110
//               active:translate-y-0
//               ${isOpen ? 'font-bold' : ''}
//             `}
//           >
//             {/* Active indicator */}
//             {isOpen && (
//               <span
//                 className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[8px] rounded-full"
//                 style={{ background: accent }}
//               />
//             )}

//             <span className={isOpen ? 'pl-[4px]' : ''}>
//               {item.label}
//             </span>
//           </button>
//         );
//       })}

//       {/* Help Guide */}
//       <button
//         type="button"
//         onClick={onToggleGuide}
//         title="Dashboard guide"
//         aria-label="Dashboard guide"
//         style={glassStyle(GUIDE_ACCENT, guideOpen)}
//         className={`
//           ml-auto
//           relative
//           h-[22px]
//           px-[8px]
//           rounded-[5px]
//           text-[9px]
//           leading-none
//           font-semibold
//           tracking-[0.01em]
//           whitespace-nowrap
//           shrink-0
//           border
//           transition-all
//           duration-150
//           ease-out
//           hover:-translate-y-[1px]
//           hover:brightness-110
//           active:translate-y-0
//           ${guideOpen ? 'font-bold' : ''}
//         `}
//       >
//         {guideOpen && (
//           <span
//             className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[8px] rounded-full"
//             style={{ background: GUIDE_ACCENT }}
//           />
//         )}

//         <span className={guideOpen ? 'pl-[4px]' : ''}>
//           Help
//         </span>
//       </button>

//     </div>
//   );
// }
// One accent color per panel button, on a shared "frosted navy glass" base
// One accent color per panel button, on a shared "frosted navy glass" base
import './WorkspaceLauncher.css';

// One accent color per panel button, on a shared "frosted navy glass" base
const BUTTON_ACCENT = {
  snr: '#E58461',
  iono: '#E5C661',
  multipath: '#C2E561',
  completeness: '#80E561',
  cycleslips: '#61E584',
  alerts: '#61E5C6',
  inview: '#61C2E5',
  dop: '#6180E5',
  constellation: '#8461E5',
  groundtrack: '#C661E5',
  ionomap: '#E561C2',
  table: '#E56180',
};

const DEFAULT_ACCENT = '#61C2E5';
const GUIDE_ACCENT = '#9FB4D6';

const GLASS_BASE = {
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

function glassStyle(accent, isOpen) {
  return {
    ...GLASS_BASE,

    background: isOpen
      ? `linear-gradient(
          180deg,
          color-mix(in srgb, ${accent} 28%, #0B1526 72%) 0%,
          color-mix(in srgb, ${accent} 12%, #0B1526 88%) 100%
        )`
      : `linear-gradient(
          180deg,
          color-mix(in srgb, ${accent} 10%, #0B1526 90%) 0%,
          #0B1526 100%
        )`,

    borderColor: isOpen
      ? `color-mix(in srgb, ${accent} 75%, transparent)`
      : `color-mix(in srgb, ${accent} 30%, transparent)`,

    color: isOpen ? '#F4F7FB' : accent,

    boxShadow: isOpen
      ? `
        inset 0 1px 0 rgba(255,255,255,0.12),
        0 0 0 1px color-mix(in srgb, ${accent} 18%, transparent),
        0 3px 10px color-mix(in srgb, ${accent} 15%, transparent)
      `
      : `
        inset 0 1px 0 rgba(255,255,255,0.04)
      `,
  };
}

export default function WorkspaceLauncher({
  items,
  openIds,
  onToggle,
  guideOpen,
  onToggleGuide,
}) {
  return (
    <div
      className="
        panels-scrollbar
        flex items-center
        gap-2
        px-3
        pt-2
        pb-3
        border-b border-border
        bg-panel
        overflow-x-auto
        shrink-0
      "
    >

      {/* Section label */}
      <span
        className="
          text-[11px]
          uppercase
          tracking-[0.1em]
          text-text-muted
          mr-1.5
          shrink-0
          whitespace-nowrap
          font-bold
          opacity-80
        "
      >
        Panels
      </span>

      {/* Panel buttons */}
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const accent = BUTTON_ACCENT[item.id] ?? DEFAULT_ACCENT;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            style={glassStyle(accent, isOpen)}
            title={item.label}
            className={`
              group
              relative
              h-8
              px-3.5
              rounded-md
              text-[12px]
              leading-none
              font-semibold
              tracking-[0.01em]
              whitespace-nowrap
              shrink-0
              border
              transition-all
              duration-150
              ease-out
              hover:-translate-y-[1px]
              hover:brightness-110
              active:translate-y-0
              ${isOpen ? 'font-bold' : ''}
            `}
          >
            {/* Active indicator */}
            {isOpen && (
              <span
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-[12px] rounded-full"
                style={{ background: accent }}
              />
            )}

            <span className={isOpen ? 'pl-2' : ''}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Help Guide */}
      <button
        type="button"
        onClick={onToggleGuide}
        title="Dashboard guide"
        aria-label="Dashboard guide"
        style={glassStyle(GUIDE_ACCENT, guideOpen)}
        className={`
          ml-auto
          relative
          h-8
          px-3.5
          rounded-md
          text-[12px]
          leading-none
          font-semibold
          tracking-[0.01em]
          whitespace-nowrap
          shrink-0
          border
          transition-all
          duration-150
          ease-out
          hover:-translate-y-[1px]
          hover:brightness-110
          active:translate-y-0
          ${guideOpen ? 'font-bold' : ''}
        `}
      >
        {guideOpen && (
          <span
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-[12px] rounded-full"
            style={{ background: GUIDE_ACCENT }}
          />
        )}

        <span className={guideOpen ? 'pl-2' : ''}>
          Help
        </span>
      </button>

    </div>
  );
}
