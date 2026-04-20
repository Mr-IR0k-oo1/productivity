import React from "react";

// Simple ASCII art background provider for landing pages
export function AsciiBackground({ variant = "A" }: { variant?: string }) {
  // Variant options (A-E) as static ASCII art strings. You can replace with richer art later.
  const arts: Record<string, string> = {
    A: `.      *       .       *       .
    *      .        *        .
.   *        .     *     .       *
        .      *    .       *
   *        .       *        .`,
    B: `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*  .  .  *   .  .  *  .  .  *  .  *  .
  . *  .  *  .  *  .  *  .  *  .  *
***  .  *  .  .  *  .  .  *  .  *** 
  *  .  *  .  .  *  .  *  .  .  *
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
    C: `       *        .
  *           *      *
       *   *  .
    *        *     *
       *        *
          *
      *       *`,
    D: `    .     .     .      .       .
  *   .  .   *  .  *   .  *   .
    .  *  .  *  .  *  .  *  .
  .   .   .   .  .   .  .   .`,
    E: `  *  *     * *    *     *
 *   *  *  *  *  *  **   *
  *  *     * *    *     *`,
  };

  const art = arts[variant] || arts["A"];
  return (
    <div aria-label="ascii-background" className="ascii-background" style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <pre style={{ margin: 0, padding: 0, lineHeight: 1.1 }}>{art}</pre>
    </div>
  );
}
