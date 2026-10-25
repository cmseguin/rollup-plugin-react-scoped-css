import "./Sub.scoped.css";
import type { FC } from "react";

// Do not spread unknown props onto the root element. The plugin adds
// data-<appHash> to <Sub>, so spreading would put both the App and Sub
// hashes on this DOM node and make the e2e assertions ambiguous.
export const Sub: FC<{ className?: string }> = ({ className }) => (
  <div className={`sub ${className ?? ""}`}>
    <h1>Sub</h1>
    <button id="sub-button" type="button">
      sub button
    </button>
  </div>
);
