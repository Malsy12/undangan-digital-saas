// Word-wrap perkiraan untuk teks yang dirender sebagai SVG di server (Sharp
// tidak bisa mengukur lebar teks nyata seperti canvas browser). Lebar tiap
// karakter didekati dari fontSize — cukup akurat untuk font sans-serif umum,
// dan sengaja konservatif (sedikit melebih-lebihkan lebar karakter) supaya
// teks lebih cenderung terpotong lebih awal daripada meluber keluar frame.
const AVG_CHAR_WIDTH_RATIO = 0.55;

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxHeight: number,
  lineHeightMultiplier = 1.3
): string[] {
  const maxCharsPerLine = Math.max(
    1,
    Math.floor(maxWidth / (fontSize * AVG_CHAR_WIDTH_RATIO))
  );
  const lineHeight = fontSize * lineHeightMultiplier;
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let currentLine = "";
  let wordIndex = 0;

  for (; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }
    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      // Satu kata saja sudah melebihi lebar baris — potong paksa.
      lines.push(word.slice(0, maxCharsPerLine));
      currentLine = "";
    }
    if (lines.length >= maxLines) break;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
    wordIndex = words.length;
  }

  const truncated = wordIndex < words.length;
  if (lines.length > maxLines) lines.length = maxLines;

  if (truncated && lines.length > 0) {
    const lastIndex = lines.length - 1;
    const last = lines[lastIndex];
    lines[lastIndex] = last.length > 3 ? `${last.slice(0, -3)}...` : `${last}...`;
  }

  return lines;
}
