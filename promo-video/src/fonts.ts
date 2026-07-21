import { poppinsData } from "./fonts-data";

export const fontFamily = "Poppins";

if (typeof document !== "undefined" && !document.getElementById("poppins-face")) {
  const style = document.createElement("style");
  style.id = "poppins-face";
  style.textContent = Object.entries(poppinsData)
    .map(
      ([weight, url]) =>
        `@font-face{font-family:"Poppins";font-style:normal;font-weight:${weight};font-display:block;src:url(${url}) format("woff2");}`,
    )
    .join("\n");
  document.head.appendChild(style);
}
