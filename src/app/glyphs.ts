import {
  DisplayTransition,
  emptyGlyph,
  errorGlyph,
  Glyph,
  NuimoControlDevice,
  stopGlyph,
} from "rocket-nuimo";

const pauseGlyph = Glyph.fromString([
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
]);
const playingGlyph = Glyph.fromString([
  "  **     ",
  "  ***    ",
  "  ****   ",
  "  *****  ",
  "  ****** ",
  "  *****  ",
  "  ****   ",
  "  ***    ",
  "  **     ",
]);
const rightGlyphStrings = [
  " **    *",
  " ***   *",
  " ****  *",
  " ***** *",
  " *******",
  " ***** *",
  " ****  *",
  " ***   *",
  " **    *",
];
const rightGlyph = Glyph.fromString(rightGlyphStrings);
const leftGlyph = Glyph.fromString(
  rightGlyphStrings.map((r) => r.split("").reverse().join(""))
);
const volume1 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
]);
const volume2 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
]);
const volume3 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
]);
const volume4 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);
const volume5 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);
const volume6 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);
const volume7 = Glyph.fromString([
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);
const volume8 = Glyph.fromString([
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);
const volume9 = Glyph.fromString([
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

function displayVolumeGlyph(
  percentage: number,
  nuimo: NuimoControlDevice
): Promise<NuimoControlDevice> {
  type volumeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  const i = <volumeIndex>Math.floor(percentage / 10);
  return nuimo
    .displayGlyph(volumeGlyphs[`volume${i}`], {
      timeoutMs: 1000,
      transition: DisplayTransition.Immediate,
      brightness: 1,
    })
    .then(() => nuimo);
}

export const controlGlyphs: {
  playing: Glyph;
  paused: Glyph;
  stopped: Glyph;
  loading: Glyph;
  next: Glyph;
  previous: Glyph;
} = {
  playing: playingGlyph,
  paused: pauseGlyph,
  stopped: stopGlyph,
  loading: errorGlyph,
  next: rightGlyph,
  previous: leftGlyph,
};

export const volumeGlyphs: {
  display: (
    percentage: number,
    nuimo: NuimoControlDevice
  ) => Promise<NuimoControlDevice>;
  volume0: Glyph;
  volume1: Glyph;
  volume2: Glyph;
  volume3: Glyph;
  volume4: Glyph;
  volume5: Glyph;
  volume6: Glyph;
  volume7: Glyph;
  volume8: Glyph;
  volume9: Glyph;
  volume10: Glyph;
} = {
  display: displayVolumeGlyph,
  volume0: emptyGlyph,
  volume1: volume1,
  volume2: volume2,
  volume3: volume3,
  volume4: volume4,
  volume5: volume5,
  volume6: volume6,
  volume7: volume7,
  volume8: volume8,
  volume9: volume9,
  volume10: volume9,
};
